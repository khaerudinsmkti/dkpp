<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkConsumerPriceRequest;
use App\Http\Requests\StoreConsumerPriceRequest;
use App\Models\Commodity;
use App\Models\ConsumerPrice;
use App\Models\Market;
use App\Services\SimpleExcelService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ConsumerPriceController extends Controller
{
    /**
     * Display a listing of consumer prices with HET comparison for the selected date and market.
     */
    public function index(Request $request): Response
    {
        $selectedDate = $request->query('date', now()->format('Y-m-d'));
        if (! is_string($selectedDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $selectedDate)) {
            $selectedDate = now()->format('Y-m-d');
        }

        $markets = Market::where('is_active', true)->orderBy('order')->get();
        $defaultMarketId = $markets->first()?->id;
        $selectedMarketId = (int) $request->query('market_id', $defaultMarketId ?? 0);

        $selectedMarket = $markets->firstWhere('id', $selectedMarketId) ?? $markets->first();

        // Eager-load HETs effective up to the selected date
        $commodities = Commodity::where('is_active', true)
            ->with(['hets' => fn ($query) => $query->where('effective_date', '<=', $selectedDate)->orderByDesc('effective_date')->orderByDesc('id')])
            ->orderBy('order')
            ->get();

        $existingPrices = ConsumerPrice::where('recorded_date', $selectedDate)
            ->where('market_id', $selectedMarket?->id)
            ->get()
            ->keyBy('commodity_id');

        $rows = $commodities->map(function (Commodity $commodity) use ($existingPrices, $selectedDate): array {
            $priceRecord = $existingPrices->get($commodity->id);
            $applicableHet = $commodity->hetAt($selectedDate);

            $currentPrice = $priceRecord ? (float) $priceRecord->price : null;
            $hetPrice = $applicableHet ? (float) $applicableHet->price : null;

            $diff = null;
            $diffPercentage = null;
            $status = 'not_recorded';

            if ($currentPrice !== null && $hetPrice !== null) {
                $diff = round($currentPrice - $hetPrice, 2);
                $diffPercentage = $hetPrice > 0 ? round(($diff / $hetPrice) * 100, 2) : 0;
                if ($diff > 0) {
                    $status = 'above';
                } elseif ($diff < 0) {
                    $status = 'below';
                } else {
                    $status = 'equal';
                }
            } elseif ($currentPrice !== null && $hetPrice === null) {
                $status = 'no_het';
            }

            return [
                'commodity_id' => $commodity->id,
                'commodity_name' => $commodity->name,
                'commodity_slug' => $commodity->slug,
                'category' => $commodity->category,
                'unit' => $commodity->unit,
                'order' => $commodity->order,
                'consumer_price_id' => $priceRecord?->id,
                'price' => $currentPrice,
                'notes' => $priceRecord?->notes,
                'applicable_het' => $applicableHet ? [
                    'id' => $applicableHet->id,
                    'price' => (float) $applicableHet->price,
                    'effective_date' => $applicableHet->effective_date->format('Y-m-d'),
                    'source_regulation' => $applicableHet->source_regulation,
                    'notes' => $applicableHet->notes,
                ] : null,
                'diff' => $diff,
                'diff_percentage' => $diffPercentage,
                'status' => $status,
            ];
        });

        // Summary statistics across all commodities
        $recordedCount = $rows->whereNotNull('price')->count();
        $aboveHetCount = $rows->where('status', 'above')->count();
        $belowHetCount = $rows->where('status', 'below')->count();
        $equalHetCount = $rows->where('status', 'equal')->count();

        // Unique categories for filtering
        $categories = $commodities->pluck('category')->unique()->values();

        // Optional filter application for displayed items
        $search = (string) $request->query('search', '');
        $categoryFilter = (string) $request->query('category', '');
        $statusFilter = (string) $request->query('status', 'all');

        $filteredRows = $rows->filter(function (array $item) use ($search, $categoryFilter, $statusFilter): bool {
            if ($search !== '' && ! str_contains(strtolower($item['commodity_name']), strtolower($search))) {
                return false;
            }
            if ($categoryFilter !== '' && $item['category'] !== $categoryFilter) {
                return false;
            }
            if ($statusFilter === 'above' && $item['status'] !== 'above') {
                return false;
            }
            if ($statusFilter === 'below' && $item['status'] !== 'below') {
                return false;
            }
            if ($statusFilter === 'equal' && $item['status'] !== 'equal') {
                return false;
            }
            if ($statusFilter === 'not_recorded' && $item['status'] !== 'not_recorded') {
                return false;
            }

            return true;
        })->values();

        return Inertia::render('consumer-prices/index', [
            'items' => $filteredRows,
            'allItemsForBulk' => $rows,
            'markets' => $markets,
            'selectedMarket' => $selectedMarket,
            'selectedDate' => $selectedDate,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category' => $categoryFilter,
                'status' => $statusFilter,
                'date' => $selectedDate,
                'market_id' => $selectedMarket?->id,
            ],
            'statistics' => [
                'total_commodities' => $commodities->count(),
                'recorded_count' => $recordedCount,
                'above_het_count' => $aboveHetCount,
                'below_het_count' => $belowHetCount,
                'equal_het_count' => $equalHetCount,
            ],
        ]);
    }

    /**
     * Store or update a single commodity price record.
     */
    public function store(StoreConsumerPriceRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        ConsumerPrice::updateOrCreate(
            [
                'commodity_id' => $validated['commodity_id'],
                'market_id' => $validated['market_id'],
                'recorded_date' => $validated['recorded_date'],
            ],
            [
                'price' => $validated['price'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]
        );

        return back()->with('success', 'Harga konsumen berhasil disimpan.');
    }

    /**
     * Bulk store or update consumer prices for a given date (or multi-day up to 31 days) and market.
     */
    public function bulkStore(BulkConsumerPriceRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $marketId = (int) $validated['market_id'];
        $defaultRecordedDate = $validated['recorded_date'] ?? null;
        $userId = $request->user()?->id;

        $recordedDates = [];
        $savedCount = 0;

        DB::transaction(function () use ($validated, $marketId, $defaultRecordedDate, $userId, &$recordedDates, &$savedCount): void {
            foreach ($validated['items'] as $item) {
                if (isset($item['price']) && $item['price'] !== null && $item['price'] !== '') {
                    $itemDate = $item['recorded_date'] ?? $defaultRecordedDate;
                    if (! $itemDate) {
                        continue;
                    }

                    ConsumerPrice::updateOrCreate(
                        [
                            'commodity_id' => $item['commodity_id'],
                            'market_id' => $marketId,
                            'recorded_date' => $itemDate,
                        ],
                        [
                            'price' => $item['price'],
                            'notes' => $item['notes'] ?? null,
                            'created_by' => $userId,
                        ]
                    );

                    $recordedDates[$itemDate] = true;
                    $savedCount++;
                }
            }
        });

        $dateCount = count($recordedDates);
        $message = $dateCount > 1
            ? "Berhasil menyimpan {$savedCount} data harga komoditas untuk {$dateCount} hari."
            : 'Semua data harga konsumen berhasil diperbarui.';

        return back()->with('success', $message);
    }

    /**
     * Remove the specified consumer price record.
     */
    public function destroy(ConsumerPrice $consumerPrice): RedirectResponse
    {
        $consumerPrice->delete();

        return back()->with('success', 'Data harga konsumen berhasil dihapus.');
    }

    /**
     * Download the official 25 commodities consumer prices template in Excel (.xlsx) or CSV format.
     * Supports daily (1 day), weekly (7 days), or monthly (up to 31 days).
     */
    public function downloadTemplate(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $selectedDate = $request->query('date', now()->format('Y-m-d'));
        if (! is_string($selectedDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $selectedDate)) {
            $selectedDate = now()->format('Y-m-d');
        }

        $format = strtolower((string) $request->query('format', 'xlsx'));
        $days = (int) $request->query('days', 1);
        $period = (string) $request->query('period', '');

        if ($period === 'weekly') {
            $days = 7;
        } elseif ($period === 'monthly') {
            $days = (int) Carbon::parse($selectedDate)->daysInMonth;
        }
        $days = max(1, min(31, $days));

        // Always query the 25 commodities in exact order
        $commodities = Commodity::where('is_active', true)
            ->with(['hets' => fn ($query) => $query->where('effective_date', '<=', $selectedDate)->orderByDesc('effective_date')->orderByDesc('id')])
            ->orderBy('order')
            ->get();

        $filenameBase = $days === 1
            ? 'format_harga_konsumen_25_komoditas'
            : ($days === 7
                ? 'format_harga_konsumen_mingguan_7_hari'
                : "format_harga_konsumen_bulanan_{$days}_hari");

        if ($format === 'csv') {
            $csv = $excelService->generateCsvTemplate($commodities, $selectedDate, [], $days);

            return response($csv, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filenameBase}.csv\"",
            ]);
        }

        $xlsx = $excelService->generateXlsxTemplate($commodities, $selectedDate, [], $days);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filenameBase}.xlsx\"",
        ]);
    }

    /**
     * Import consumer prices from an uploaded Excel or CSV file (1 day, 7 days, up to 31 days).
     */
    public function import(Request $request, SimpleExcelService $excelService): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'market_id' => ['required', 'integer', 'exists:markets,id'],
            'recorded_date' => ['nullable', 'date_format:Y-m-d'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $file = $request->file('file');
        if (! $file) {
            return back()->withErrors(['file' => 'Berkas tidak ditemukan.']);
        }

        $extension = $file->getClientOriginalExtension();
        $allowed = ['xlsx', 'csv', 'txt', 'xls', 'tsv'];
        if (! in_array(strtolower($extension), $allowed, true)) {
            return back()->withErrors(['file' => 'Format berkas harus .xlsx atau .csv.']);
        }

        try {
            $rawRows = $excelService->parseFile($file->getRealPath(), $extension);
        } catch (\Throwable $e) {
            return back()->withErrors(['file' => 'Gagal membaca berkas Excel: '.$e->getMessage()]);
        }

        $commodities = Commodity::where('is_active', true)->orderBy('order')->get();
        $anchorDate = $validated['recorded_date'] ?? $validated['start_date'] ?? now()->format('Y-m-d');
        $result = $excelService->matchCommodityPrices($rawRows, $commodities, $anchorDate, 31);

        if (empty($result['matched'])) {
            return back()->withErrors(['file' => 'Tidak ditemukan data harga yang valid dalam berkas. Pastikan format kolom sesuai template.']);
        }

        $marketId = (int) $validated['market_id'];
        $userId = $request->user()?->id;

        DB::transaction(function () use ($result, $marketId, $anchorDate, $userId): void {
            foreach ($result['matched'] as $item) {
                $targetDate = $item['recorded_date'] ?? $anchorDate;
                ConsumerPrice::updateOrCreate(
                    [
                        'commodity_id' => $item['commodity_id'],
                        'market_id' => $marketId,
                        'recorded_date' => $targetDate,
                    ],
                    [
                        'price' => $item['price'],
                        'notes' => $item['notes'] ?? null,
                        'created_by' => $userId,
                    ]
                );
            }
        });

        $count = count($result['matched']);
        $market = Market::find($marketId);
        $marketName = $market ? $market->name : 'pasar terpilih';
        $dates = $result['dates'] ?? array_values(array_unique(array_column($result['matched'], 'recorded_date')));
        $dateCount = count($dates);

        if ($dateCount > 1) {
            $startDate = min($dates);
            $endDate = max($dates);
            $successMsg = "Berhasil mengimpor {$count} data harga komoditas ({$dateCount} hari, {$startDate} s/d {$endDate}) untuk {$marketName}.";
        } else {
            $singleDate = $dates[0] ?? $anchorDate;
            $successMsg = "Berhasil mengimpor {$count} data harga komoditas untuk {$marketName} pada tanggal {$singleDate}.";
        }

        return back()->with('success', $successMsg);
    }
}
