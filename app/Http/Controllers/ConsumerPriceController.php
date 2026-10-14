<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkConsumerPriceRequest;
use App\Http\Requests\StoreConsumerPriceRequest;
use App\Models\Commodity;
use App\Models\ConsumerPrice;
use App\Models\Market;
use App\Services\SimpleExcelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
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

    /**
     * Provide price trend data for public charts (daily, weekly, monthly).
     */
    public function chartData(Request $request): JsonResponse
    {
        $type = (string) $request->query('type', 'daily'); // 'daily', 'weekly', 'monthly'
        $commodityId = (int) $request->query('commodity_id');
        $marketId = (int) $request->query('market_id');

        if (! $commodityId) {
            $firstCommodity = Commodity::where('is_active', true)->orderBy('order')->first();
            $commodityId = $firstCommodity?->id ?? 1;
        }

        if (! $marketId) {
            $firstMarket = Market::where('is_active', true)->orderBy('order')->first();
            $marketId = $firstMarket?->id ?? 1;
        }

        $commodity = Commodity::with(['hets'])->find($commodityId);

        if ($type === 'daily') {
            // Daily chart: date range with max 31 days
            $endDate = (string) $request->query('end_date', '');
            $startDate = (string) $request->query('start_date', '');

            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
                $endDate = ConsumerPrice::where('market_id', $marketId)
                    ->where('commodity_id', $commodityId)
                    ->max('recorded_date') ?? now()->format('Y-m-d');
            }

            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
                $startDate = Carbon::parse($endDate)->subDays(30)->format('Y-m-d');
            } else {
                // Enforce max 31 days
                $startCarbon = Carbon::parse($startDate);
                $endCarbon = Carbon::parse($endDate);
                if ($startCarbon->gt($endCarbon)) {
                    $startDate = $endCarbon->copy()->subDays(30)->format('Y-m-d');
                } elseif ($startCarbon->diffInDays($endCarbon) > 31) {
                    $startDate = $endCarbon->copy()->subDays(30)->format('Y-m-d');
                }
            }

            $prices = ConsumerPrice::where('market_id', $marketId)
                ->where('commodity_id', $commodityId)
                ->whereBetween('recorded_date', [$startDate, $endDate])
                ->orderBy('recorded_date')
                ->get()
                ->keyBy(fn ($item) => Carbon::parse($item->recorded_date)->format('Y-m-d'));

            $chartPoints = [];
            $current = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);

            while ($current->lte($end)) {
                $dStr = $current->format('Y-m-d');
                $priceRec = $prices->get($dStr);
                $het = $commodity?->hetAt($dStr);

                $chartPoints[] = [
                    'date' => $dStr,
                    'label' => $current->translatedFormat('d M'),
                    'full_date' => $current->translatedFormat('l, d F Y'),
                    'price' => $priceRec ? (float) $priceRec->price : null,
                    'het' => $het ? (float) $het->price : null,
                ];

                $current->addDay();
            }

            return response()->json([
                'type' => 'daily',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'commodity' => $commodity ? ['id' => $commodity->id, 'name' => $commodity->name, 'unit' => $commodity->unit] : null,
                'data' => $chartPoints,
            ]);
        }

        if ($type === 'weekly') {
            // Weekly chart: filter month (1-12) and year (e.g. 2026)
            $year = (int) $request->query('year', (int) now()->format('Y'));
            $month = (int) $request->query('month', (int) now()->format('n'));
            if ($month < 1 || $month > 12) {
                $month = (int) now()->format('n');
            }

            $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endOfMonth = $startOfMonth->copy()->endOfMonth();

            $prices = ConsumerPrice::where('market_id', $marketId)
                ->where('commodity_id', $commodityId)
                ->whereBetween('recorded_date', [$startOfMonth->format('Y-m-d'), $endOfMonth->format('Y-m-d')])
                ->orderBy('recorded_date')
                ->get();

            // Divide month into 4 or 5 weeks
            $weeksData = [];
            $wStart = $startOfMonth->copy();
            $weekNum = 1;

            while ($wStart->lte($endOfMonth)) {
                $wEnd = $wStart->copy()->addDays(6);
                if ($wEnd->gt($endOfMonth)) {
                    $wEnd = $endOfMonth->copy();
                }

                $wPrices = $prices->filter(function ($item) use ($wStart, $wEnd) {
                    $d = Carbon::parse($item->recorded_date);

                    return $d->betweenIncluded($wStart, $wEnd);
                });

                $avgPrice = $wPrices->count() > 0 ? round($wPrices->avg('price'), 0) : null;
                $midDate = $wStart->copy()->addDays((int) ($wStart->diffInDays($wEnd) / 2))->format('Y-m-d');
                $het = $commodity?->hetAt($midDate);

                $weeksData[] = [
                    'week' => $weekNum,
                    'label' => "M{$weekNum} ({$wStart->format('d')}-{$wEnd->format('d')} {$wStart->translatedFormat('M')})",
                    'date_range' => "{$wStart->translatedFormat('d M')} - {$wEnd->translatedFormat('d M Y')}",
                    'price' => $avgPrice,
                    'het' => $het ? (float) $het->price : null,
                ];

                $wStart = $wEnd->copy()->addDay();
                $weekNum++;
            }

            return response()->json([
                'type' => 'weekly',
                'year' => $year,
                'month' => $month,
                'commodity' => $commodity ? ['id' => $commodity->id, 'name' => $commodity->name, 'unit' => $commodity->unit] : null,
                'data' => $weeksData,
            ]);
        }

        if ($type === 'monthly') {
            // Monthly chart: filter year only (12 months)
            $year = (int) $request->query('year', (int) now()->format('Y'));

            $startOfYear = Carbon::createFromDate($year, 1, 1)->startOfYear();
            $endOfYear = Carbon::createFromDate($year, 12, 31)->endOfYear();

            $prices = ConsumerPrice::where('market_id', $marketId)
                ->where('commodity_id', $commodityId)
                ->whereBetween('recorded_date', [$startOfYear->format('Y-m-d'), $endOfYear->format('Y-m-d')])
                ->get();

            $monthlyData = [];
            for ($m = 1; $m <= 12; $m++) {
                $mCarbon = Carbon::createFromDate($year, $m, 1);
                $mStart = $mCarbon->copy()->startOfMonth();
                $mEnd = $mCarbon->copy()->endOfMonth();

                $mPrices = $prices->filter(function ($item) use ($mStart, $mEnd) {
                    $d = Carbon::parse($item->recorded_date);

                    return $d->betweenIncluded($mStart, $mEnd);
                });

                $avgPrice = $mPrices->count() > 0 ? round($mPrices->avg('price'), 0) : null;
                $midDate = $mCarbon->copy()->day(15)->format('Y-m-d');
                $het = $commodity?->hetAt($midDate);

                $monthlyData[] = [
                    'month' => $m,
                    'label' => $mCarbon->translatedFormat('M'),
                    'full_month' => $mCarbon->translatedFormat('F Y'),
                    'price' => $avgPrice,
                    'het' => $het ? (float) $het->price : null,
                ];
            }

            return response()->json([
                'type' => 'monthly',
                'year' => $year,
                'commodity' => $commodity ? ['id' => $commodity->id, 'name' => $commodity->name, 'unit' => $commodity->unit] : null,
                'data' => $monthlyData,
            ]);
        }

        return response()->json(['error' => 'Invalid chart type'], 400);
    }

    /**
     * Resolve historical price data for the specified market and date range.
     *
     * @return array{market: ?Market, start_date: string, end_date: string, commodities: Collection<int, Commodity>, rows: array<int, array{date: string, formatted_date: string, day_name: string, prices: array<int, float|null>}>}
     */
    protected function getHistoryPricePayload(Request $request): array
    {
        $marketId = (int) $request->query('market_id');
        if (! $marketId) {
            $firstMarket = Market::where('is_active', true)->orderBy('order')->first();
            $marketId = $firstMarket?->id ?? 1;
        }

        $market = Market::find($marketId);
        $commodities = Commodity::with(['hets'])->where('is_active', true)->orderBy('order')->get();

        $startDate = (string) $request->query('start_date', '');
        $endDate = (string) $request->query('end_date', '');

        // If date range is not specified or invalid, default to 14 latest distinct dates in this market
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
            $latestDates = ConsumerPrice::where('market_id', $marketId)
                ->distinct('recorded_date')
                ->orderBy('recorded_date', 'desc')
                ->limit(14)
                ->pluck('recorded_date')
                ->map(fn ($d) => Carbon::parse($d)->format('Y-m-d'))
                ->toArray();

            if (empty($latestDates)) {
                $today = now();
                $latestDates = [];
                for ($i = 0; $i < 14; $i++) {
                    $latestDates[] = $today->copy()->subDays($i)->format('Y-m-d');
                }
            }

            $dates = array_values($latestDates);
            $startDate = end($dates);
            $endDate = reset($dates);
        } else {
            $startCarbon = Carbon::parse($startDate);
            $endCarbon = Carbon::parse($endDate);

            if ($startCarbon->gt($endCarbon)) {
                $temp = $startCarbon;
                $startCarbon = $endCarbon;
                $endCarbon = $temp;
            }

            // Enforce max 31 days
            if ($startCarbon->diffInDays($endCarbon) > 31) {
                $startCarbon = $endCarbon->copy()->subDays(30);
            }

            $startDate = $startCarbon->format('Y-m-d');
            $endDate = $endCarbon->format('Y-m-d');

            $dates = [];
            $cur = $endCarbon->copy();
            while ($cur->gte($startCarbon)) {
                $dates[] = $cur->format('Y-m-d');
                $cur->subDay();
            }
        }

        // Distinct recorded dates up to endDate in this market to find yesterday's record
        $distinctRecordedDates = ConsumerPrice::where('market_id', $marketId)
            ->where('recorded_date', '<=', $endDate)
            ->distinct('recorded_date')
            ->orderBy('recorded_date', 'desc')
            ->pluck('recorded_date')
            ->map(fn ($d) => Carbon::parse($d)->format('Y-m-d'))
            ->toArray();

        // Get the date before $startDate to query its prices as well
        $prevDateBeforeStart = ConsumerPrice::where('market_id', $marketId)
            ->where('recorded_date', '<', $startDate)
            ->orderBy('recorded_date', 'desc')
            ->value('recorded_date');
        $prevDateBeforeStartStr = $prevDateBeforeStart ? Carbon::parse($prevDateBeforeStart)->format('Y-m-d') : null;

        $queryDates = array_values(array_unique(array_filter(array_merge($dates, [$prevDateBeforeStartStr]))));

        $prices = ConsumerPrice::where('market_id', $marketId)
            ->whereIn('recorded_date', $queryDates)
            ->get();

        $groupedPrices = [];
        foreach ($prices as $p) {
            $d = Carbon::parse($p->recorded_date)->format('Y-m-d');
            $groupedPrices[$d][$p->commodity_id] = (float) $p->price;
        }

        $rows = [];
        foreach ($dates as $dateStr) {
            $cDate = Carbon::parse($dateStr);
            $datePrices = $groupedPrices[$dateStr] ?? [];

            // Find yesterday date
            $curIdx = array_search($dateStr, $distinctRecordedDates, true);
            $yestDateStr = ($curIdx !== false && isset($distinctRecordedDates[$curIdx + 1]))
                ? $distinctRecordedDates[$curIdx + 1]
                : $cDate->copy()->subDay()->format('Y-m-d');

            $yestPrices = $yestDateStr ? ($groupedPrices[$yestDateStr] ?? []) : [];

            $commodityPriceMap = [];
            $commodityHetMap = [];
            $commodityAboveHetMap = [];
            $commodityDiffMap = [];

            foreach ($commodities as $c) {
                $todayPrice = $datePrices[$c->id] ?? null;
                $yestPrice = $yestPrices[$c->id] ?? null;

                $applicableHet = $c->hetAt($dateStr);
                $hetPrice = $applicableHet ? (float) $applicableHet->price : null;

                $isAboveHet = ($todayPrice !== null && $hetPrice !== null && $hetPrice > 0 && $todayPrice > $hetPrice);

                $diffType = null;
                if ($todayPrice !== null && $yestPrice !== null) {
                    if ($todayPrice > $yestPrice) {
                        $diffType = 'up';
                    } elseif ($todayPrice < $yestPrice) {
                        $diffType = 'down';
                    } else {
                        $diffType = 'stable';
                    }
                }

                $commodityPriceMap[$c->id] = $todayPrice;
                $commodityHetMap[$c->id] = $hetPrice;
                $commodityAboveHetMap[$c->id] = $isAboveHet;
                $commodityDiffMap[$c->id] = $diffType;
            }

            $rows[] = [
                'date' => $dateStr,
                'formatted_date' => $cDate->translatedFormat('d M Y'),
                'day_name' => $cDate->translatedFormat('l'),
                'prices' => $commodityPriceMap,
                'hets' => $commodityHetMap,
                'is_above_het' => $commodityAboveHetMap,
                'diffs' => $commodityDiffMap,
            ];
        }

        // Calculate previous month's date bounds & averages
        $endCarbon = Carbon::parse($endDate);
        $prevMonthCarbon = $endCarbon->copy()->subMonth();
        $prevMonthStart = $prevMonthCarbon->copy()->startOfMonth()->format('Y-m-d');
        $prevMonthEnd = $prevMonthCarbon->copy()->endOfMonth()->format('Y-m-d');
        $prevMonthLabel = $prevMonthCarbon->translatedFormat('F Y');

        $prevMonthPrices = ConsumerPrice::where('market_id', $marketId)
            ->where('recorded_date', '>=', $prevMonthStart)
            ->where('recorded_date', '<=', $prevMonthEnd)
            ->selectRaw('commodity_id, AVG(price) as avg_price')
            ->groupBy('commodity_id')
            ->pluck('avg_price', 'commodity_id');

        $prevMonthAverages = [];
        $commodityHets = [];

        foreach ($commodities as $c) {
            $pmVal = $prevMonthPrices[$c->id] ?? null;
            $prevMonthAverages[$c->id] = $pmVal !== null ? round((float) $pmVal, 0) : null;

            $applicableHet = $c->hetAt($endDate) ?? $c->hets->first();
            $commodityHets[$c->id] = $applicableHet ? (float) $applicableHet->price : null;
        }

        return [
            'market' => $market,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'prev_month_label' => $prevMonthLabel,
            'prev_month_averages' => $prevMonthAverages,
            'commodity_hets' => $commodityHets,
            'commodities' => $commodities,
            'rows' => $rows,
        ];
    }

    /**
     * Get historical price data in JSON format for the interactive table.
     */
    public function historyData(Request $request): JsonResponse
    {
        $payload = $this->getHistoryPricePayload($request);

        return response()->json([
            'market' => $payload['market'] ? [
                'id' => $payload['market']->id,
                'name' => $payload['market']->name,
            ] : null,
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'],
            'prev_month_label' => $payload['prev_month_label'],
            'prev_month_averages' => $payload['prev_month_averages'],
            'commodity_hets' => $payload['commodity_hets'],
            'commodities' => $payload['commodities']->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'category' => $c->category,
                'unit' => $c->unit,
            ]),
            'rows' => $payload['rows'],
        ]);
    }

    /**
     * Download historical price data as Excel (.xlsx).
     */
    public function historyExcel(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $payload = $this->getHistoryPricePayload($request);
        $marketName = $payload['market']?->name ?? 'Pasar Indramayu';

        $xlsxContent = $excelService->generateHistoricalXlsx(
            marketName: $marketName,
            startDate: $payload['start_date'],
            endDate: $payload['end_date'],
            commodities: $payload['commodities'],
            rows: $payload['rows']
        );

        $safeMarketName = preg_replace('/[^A-Za-z0-9_-]/', '_', $marketName);
        $filename = 'Historis_Harga_'.$safeMarketName.'_'.$payload['start_date'].'_sd_'.$payload['end_date'].'.xlsx';

        return response($xlsxContent, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Resolve monthly historical price data (Jan - Dec) for the specified market and year.
     *
     * @return array{
     *     market: ?Market,
     *     year: int,
     *     available_years: array<int, int>,
     *     months: array<int, array{num: int, name: string, short: string}>,
     *     commodities: Collection<int, Commodity>,
     *     commodity_rows: array<int, array{
     *         id: int,
     *         name: string,
     *         category: string,
     *         unit: string,
     *         current_het: float|null,
     *         monthly_prices: array<int, float|null>,
     *         monthly_hets: array<int, float|null>,
     *         is_above_het: array<int, bool>,
     *         yearly_average: float|null,
     *     }>,
     *     month_summary: array<int, array{
     *         average: float|null,
     *         above_het_count: int,
     *         recorded_count: int,
     *     }>,
     * }
     */
    protected function getMonthlyHistoryPricePayload(Request $request): array
    {
        $marketId = (int) $request->query('market_id');
        if (! $marketId) {
            $firstMarket = Market::where('is_active', true)->orderBy('order')->first();
            $marketId = $firstMarket?->id ?? 1;
        }

        $market = Market::find($marketId);

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $yearSql = $isSqlite ? "strftime('%Y', recorded_date)" : 'YEAR(recorded_date)';
        $monthSql = $isSqlite ? "CAST(strftime('%m', recorded_date) AS INTEGER)" : 'MONTH(recorded_date)';

        // Get available recorded years for this market
        $availableYears = ConsumerPrice::where('market_id', $marketId)
            ->selectRaw("DISTINCT {$yearSql} as yr")
            ->orderByDesc('yr')
            ->pluck('yr')
            ->map(fn ($y) => (int) $y)
            ->values()
            ->all();

        $currentYear = (int) now()->format('Y');
        if (empty($availableYears)) {
            $availableYears = [$currentYear];
        }

        $requestedYear = (int) $request->query('year');
        if ($requestedYear > 2000 && $requestedYear < 2100) {
            $year = $requestedYear;
            if (! in_array($year, $availableYears, true)) {
                $availableYears[] = $year;
                rsort($availableYears);
            }
        } else {
            $year = $availableYears[0];
        }

        $commodities = Commodity::with(['hets'])->where('is_active', true)->orderBy('order')->get();

        // Query monthly averages in a single aggregated SQL query
        $monthlyPricesRaw = ConsumerPrice::where('market_id', $marketId)
            ->whereYear('recorded_date', $year)
            ->selectRaw("commodity_id, {$monthSql} as month_num, ROUND(AVG(price), 0) as avg_price, COUNT(*) as sample_count")
            ->groupBy('commodity_id', DB::raw($monthSql))
            ->get();

        $groupedMonthlyPrices = [];
        foreach ($monthlyPricesRaw as $record) {
            $groupedMonthlyPrices[(int) $record->commodity_id][(int) $record->month_num] = (float) $record->avg_price;
        }

        $monthNames = [
            1 => ['name' => 'Januari', 'short' => 'Jan'],
            2 => ['name' => 'Februari', 'short' => 'Feb'],
            3 => ['name' => 'Maret', 'short' => 'Mar'],
            4 => ['name' => 'April', 'short' => 'Apr'],
            5 => ['name' => 'Mei', 'short' => 'Mei'],
            6 => ['name' => 'Juni', 'short' => 'Jun'],
            7 => ['name' => 'Juli', 'short' => 'Jul'],
            8 => ['name' => 'Agustus', 'short' => 'Agu'],
            9 => ['name' => 'September', 'short' => 'Sep'],
            10 => ['name' => 'Oktober', 'short' => 'Okt'],
            11 => ['name' => 'November', 'short' => 'Nov'],
            12 => ['name' => 'Desember', 'short' => 'Des'],
        ];

        $months = [];
        foreach ($monthNames as $mNum => $mInfo) {
            $months[] = [
                'num' => $mNum,
                'name' => $mInfo['name'],
                'short' => $mInfo['short'],
            ];
        }

        $commodityRows = [];
        $monthCommodityPrices = array_fill(1, 12, []);
        $monthAboveHetCounts = array_fill(1, 12, 0);

        foreach ($commodities as $c) {
            $monthlyPrices = [];
            $monthlyHets = [];
            $isAboveHet = [];
            $validPricesForYear = [];

            $latestHetRecord = $c->hetAt(sprintf('%04d-12-31', $year)) ?? $c->hets->first();
            $currentHetPrice = $latestHetRecord ? (float) $latestHetRecord->price : null;

            for ($m = 1; $m <= 12; $m++) {
                $price = $groupedMonthlyPrices[$c->id][$m] ?? null;
                $midDate = sprintf('%04d-%02d-15', $year, $m);
                $hetRecord = $c->hetAt($midDate) ?? $latestHetRecord;
                $hetPrice = $hetRecord ? (float) $hetRecord->price : null;

                $above = ($price !== null && $hetPrice !== null && $hetPrice > 0 && $price > $hetPrice);

                $monthlyPrices[$m] = $price;
                $monthlyHets[$m] = $hetPrice;
                $isAboveHet[$m] = $above;

                if ($price !== null) {
                    $validPricesForYear[] = $price;
                    $monthCommodityPrices[$m][] = $price;
                }

                if ($above) {
                    $monthAboveHetCounts[$m]++;
                }
            }

            $yearlyAvg = ! empty($validPricesForYear)
                ? round(array_sum($validPricesForYear) / count($validPricesForYear), 0)
                : null;

            $commodityRows[] = [
                'id' => $c->id,
                'name' => $c->name,
                'category' => $c->category,
                'unit' => $c->unit,
                'current_het' => $currentHetPrice,
                'monthly_prices' => $monthlyPrices,
                'monthly_hets' => $monthlyHets,
                'is_above_het' => $isAboveHet,
                'yearly_average' => $yearlyAvg,
            ];
        }

        $monthSummary = [];
        for ($m = 1; $m <= 12; $m++) {
            $pricesInMonth = $monthCommodityPrices[$m];
            $monthAvg = ! empty($pricesInMonth) ? round(array_sum($pricesInMonth) / count($pricesInMonth), 0) : null;
            $monthSummary[$m] = [
                'average' => $monthAvg,
                'above_het_count' => $monthAboveHetCounts[$m],
                'recorded_count' => count($pricesInMonth),
            ];
        }

        return [
            'market' => $market,
            'year' => $year,
            'available_years' => $availableYears,
            'months' => $months,
            'commodities' => $commodities,
            'commodity_rows' => $commodityRows,
            'month_summary' => $monthSummary,
        ];
    }

    /**
     * Get monthly historical price data in JSON format for the interactive table.
     */
    public function monthlyHistoryData(Request $request): JsonResponse
    {
        $payload = $this->getMonthlyHistoryPricePayload($request);

        return response()->json([
            'market' => $payload['market'] ? [
                'id' => $payload['market']->id,
                'name' => $payload['market']->name,
            ] : null,
            'year' => $payload['year'],
            'available_years' => $payload['available_years'],
            'months' => $payload['months'],
            'commodities' => $payload['commodities']->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'category' => $c->category,
                'unit' => $c->unit,
            ]),
            'commodity_rows' => $payload['commodity_rows'],
            'month_summary' => $payload['month_summary'],
        ]);
    }

    /**
     * Download monthly historical price data as Excel (.xlsx).
     */
    public function monthlyHistoryExcel(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $payload = $this->getMonthlyHistoryPricePayload($request);
        $marketName = $payload['market']?->name ?? 'Pasar Indramayu';

        $xlsxContent = $excelService->generateMonthlyHistoricalXlsx(
            marketName: $marketName,
            year: $payload['year'],
            commodities: $payload['commodities'],
            commodityRows: $payload['commodity_rows'],
            monthSummary: $payload['month_summary']
        );

        $safeMarketName = preg_replace('/[^A-Za-z0-9_-]/', '_', $marketName);
        $filename = 'Historis_Rata_Rata_Bulanan_'.$safeMarketName.'_'.$payload['year'].'.xlsx';

        return response($xlsxContent, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
