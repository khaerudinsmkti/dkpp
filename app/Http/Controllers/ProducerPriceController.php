<?php

namespace App\Http\Controllers;

use App\Models\ProducerCommodity;
use App\Models\ProducerPrice;
use App\Services\SimpleExcelService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ProducerPriceController extends Controller
{
    /**
     * Display a listing of producer prices with HAP comparison for the selected date.
     */
    public function index(Request $request): Response
    {
        $maxRecordedDate = ProducerPrice::max('recorded_date') ?? now()->format('Y-m-d');
        $minRecordedDate = ProducerPrice::min('recorded_date') ?? '2026-01-01';

        $selectedDate = $request->query('date', $maxRecordedDate);
        if (! is_string($selectedDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $selectedDate)) {
            $selectedDate = $maxRecordedDate;
        }

        // Get producer price record for selected date
        $currentRecord = ProducerPrice::with('creator')->where('recorded_date', $selectedDate)->first();

        // Get previous date before selected date to calculate difference
        $prevDate = ProducerPrice::where('recorded_date', '<', $selectedDate)->max('recorded_date');
        $prevRecord = $prevDate ? ProducerPrice::where('recorded_date', $prevDate)->first() : null;

        $dbCommodities = ProducerCommodity::where('is_active', true)
            ->with(['haps' => fn ($q) => $q->where('effective_date', '<=', $selectedDate)->orderByDesc('effective_date')->orderByDesc('id')])
            ->orderBy('order')
            ->get();

        if ($dbCommodities->isNotEmpty()) {
            $commoditiesConfig = $dbCommodities->map(function ($c) use ($selectedDate) {
                $hap = $c->hapAt($selectedDate);
                return [
                    'id' => $c->id,
                    'key' => $c->key,
                    'name' => $c->name,
                    'short_name' => $c->name,
                    'category' => $c->category,
                    'unit' => $c->unit,
                    'order' => $c->order,
                    'hap' => $hap ? (float) $hap->price : 0,
                    'hap_label' => $hap?->source_regulation ?? 'HAP Bapanas',
                    'description' => $c->description ?? '',
                    'image' => $c->image,
                    'image_url' => $c->image_url,
                ];
            })->toArray();
        } else {
            $commoditiesConfig = ProducerPrice::COMMODITIES;
        }

        $items = array_map(function ($cfg) use ($currentRecord, $prevRecord): array {
            $key = $cfg['key'];
            $currentPrice = $currentRecord && $currentRecord->{$key} !== null ? (float) $currentRecord->{$key} : null;
            $prevPrice = $prevRecord && $prevRecord->{$key} !== null ? (float) $prevRecord->{$key} : null;
            $hapPrice = (float) $cfg['hap'];

            $diffHap = null;
            $diffHapPercentage = null;
            $status = 'not_recorded';

            if ($currentPrice !== null) {
                $diffHap = round($currentPrice - $hapPrice, 2);
                $diffHapPercentage = $hapPrice > 0 ? round(($diffHap / $hapPrice) * 100, 2) : 0;
                if ($diffHap > 0) {
                    $status = 'above';
                } elseif ($diffHap < 0) {
                    $status = 'below';
                } else {
                    $status = 'equal';
                }
            }

            $diffYesterday = null;
            $diffYesterdayPercentage = null;
            $changeType = 'stable';

            if ($currentPrice !== null && $prevPrice !== null) {
                $diffYesterday = round($currentPrice - $prevPrice, 2);
                $diffYesterdayPercentage = $prevPrice > 0 ? round(($diffYesterday / $prevPrice) * 100, 2) : 0;
                if ($diffYesterday > 0) {
                    $changeType = 'up';
                } elseif ($diffYesterday < 0) {
                    $changeType = 'down';
                } else {
                    $changeType = 'stable';
                }
            }

            return [
                'id' => $cfg['id'] ?? null,
                'key' => $key,
                'name' => $cfg['name'],
                'short_name' => $cfg['short_name'],
                'category' => $cfg['category'],
                'unit' => $cfg['unit'],
                'order' => $cfg['order'],
                'hap' => $hapPrice,
                'hap_label' => $cfg['hap_label'],
                'description' => $cfg['description'],
                'image' => $cfg['image'] ?? null,
                'image_url' => $cfg['image_url'] ?? null,
                'price' => $currentPrice,
                'yesterday_price' => $prevPrice,
                'diff_hap' => $diffHap,
                'diff_hap_percentage' => $diffHapPercentage,
                'status' => $status,
                'diff_yesterday' => $diffYesterday,
                'diff_yesterday_percentage' => $diffYesterdayPercentage,
                'change_type' => $changeType,
            ];
        }, $commoditiesConfig);

        $recordedCount = count(array_filter($items, fn ($i) => $i['price'] !== null));
        $aboveHapCount = count(array_filter($items, fn ($i) => $i['status'] === 'above'));
        $belowHapCount = count(array_filter($items, fn ($i) => $i['status'] === 'below'));
        $equalHapCount = count(array_filter($items, fn ($i) => $i['status'] === 'equal'));

        // History table: list of all recorded dates
        $historyRecords = ProducerPrice::with('creator')
            ->orderByDesc('recorded_date')
            ->limit(60)
            ->get()
            ->map(function (ProducerPrice $rec): array {
                return [
                    'id' => $rec->id,
                    'recorded_date' => $rec->recorded_date->format('Y-m-d'),
                    'formatted_date' => Carbon::parse($rec->recorded_date)->translatedFormat('d F Y'),
                    'day_name' => Carbon::parse($rec->recorded_date)->translatedFormat('l'),
                    'gkp_petani' => $rec->gkp_petani,
                    'gkp_penggilingan' => $rec->gkp_penggilingan,
                    'gkg_penggilingan' => $rec->gkg_penggilingan,
                    'beras_medium_penggilingan' => $rec->beras_medium_penggilingan,
                    'beras_premium_penggilingan' => $rec->beras_premium_penggilingan,
                    'sapi_hidup' => $rec->sapi_hidup,
                    'notes' => $rec->notes,
                    'creator_name' => $rec->creator?->name ?? 'Petugas DKPP',
                    'updated_at' => $rec->updated_at?->diffForHumans(),
                ];
            });

        return Inertia::render('producer-prices/index', [
            'selectedDate' => $selectedDate,
            'prevDate' => $prevDate,
            'minDate' => $minRecordedDate,
            'maxDate' => now()->format('Y-m-d'),
            'currentRecord' => $currentRecord ? [
                'id' => $currentRecord->id,
                'recorded_date' => $currentRecord->recorded_date->format('Y-m-d'),
                'notes' => $currentRecord->notes,
                'creator_name' => $currentRecord->creator?->name,
                'updated_at' => $currentRecord->updated_at?->translatedFormat('d M Y H:i'),
            ] : null,
            'items' => $items,
            'commoditiesConfig' => $commoditiesConfig,
            'historyRecords' => $historyRecords,
            'statistics' => [
                'total_commodities' => count($commoditiesConfig),
                'recorded_count' => $recordedCount,
                'above_hap_count' => $aboveHapCount,
                'below_hap_count' => $belowHapCount,
                'equal_hap_count' => $equalHapCount,
                'latest_date' => $maxRecordedDate,
            ],
        ]);
    }

    /**
     * Store or update producer prices for a given date.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'recorded_date' => ['required', 'date_format:Y-m-d'],
            'gkp_petani' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'gkp_penggilingan' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'gkg_penggilingan' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'beras_medium_penggilingan' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'beras_premium_penggilingan' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'sapi_hidup' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $userId = $request->user()?->id;

        ProducerPrice::updateOrCreate(
            ['recorded_date' => $validated['recorded_date']],
            [
                'gkp_petani' => $validated['gkp_petani'] ?? null,
                'gkp_penggilingan' => $validated['gkp_penggilingan'] ?? null,
                'gkg_penggilingan' => $validated['gkg_penggilingan'] ?? null,
                'beras_medium_penggilingan' => $validated['beras_medium_penggilingan'] ?? null,
                'beras_premium_penggilingan' => $validated['beras_premium_penggilingan'] ?? null,
                'sapi_hidup' => $validated['sapi_hidup'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $userId,
            ]
        );

        return back()->with('success', 'Data harga produsen tanggal '.$validated['recorded_date'].' berhasil disimpan.');
    }

    /**
     * Bulk store or update producer prices across multiple dates or from clipboard.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.recorded_date' => ['required', 'date_format:Y-m-d'],
            'items.*.gkp_petani' => ['nullable', 'numeric', 'min:0'],
            'items.*.gkp_penggilingan' => ['nullable', 'numeric', 'min:0'],
            'items.*.gkg_penggilingan' => ['nullable', 'numeric', 'min:0'],
            'items.*.beras_medium_penggilingan' => ['nullable', 'numeric', 'min:0'],
            'items.*.beras_premium_penggilingan' => ['nullable', 'numeric', 'min:0'],
            'items.*.sapi_hidup' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $userId = $request->user()?->id;
        $savedCount = 0;

        DB::transaction(function () use ($validated, $userId, &$savedCount): void {
            foreach ($validated['items'] as $item) {
                $hasPrice = false;
                $fields = [
                    'gkp_petani',
                    'gkp_penggilingan',
                    'gkg_penggilingan',
                    'beras_medium_penggilingan',
                    'beras_premium_penggilingan',
                    'sapi_hidup',
                ];

                $data = [
                    'created_by' => $userId,
                ];

                if (isset($item['notes'])) {
                    $data['notes'] = $item['notes'];
                }

                foreach ($fields as $f) {
                    if (isset($item[$f]) && $item[$f] !== null && $item[$f] !== '') {
                        $data[$f] = (float) $item[$f];
                        $hasPrice = true;
                    }
                }

                if ($hasPrice) {
                    ProducerPrice::updateOrCreate(
                        ['recorded_date' => $item['recorded_date']],
                        $data
                    );
                    $savedCount++;
                }
            }
        });

        $message = "Berhasil menyimpan {$savedCount} baris data harga produsen.";

        return back()->with('success', $message);
    }

    /**
     * Remove the specified producer price record by id or date.
     */
    public function destroy(ProducerPrice $producerPrice): RedirectResponse
    {
        $date = $producerPrice->recorded_date->format('Y-m-d');
        $producerPrice->delete();

        return back()->with('success', "Data harga produsen tanggal {$date} berhasil dihapus.");
    }

    /**
     * Download the official 6 commodities producer prices template (.xlsx or .csv).
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

        $filenameBase = $days === 1
            ? 'format_harga_produsen_6_komoditas'
            : ($days === 7
                ? 'format_harga_produsen_mingguan_7_hari'
                : "format_harga_produsen_bulanan_{$days}_hari");

        if ($format === 'csv') {
            $csv = $excelService->generateProducerCsvTemplate($selectedDate, [], $days);

            return response($csv, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filenameBase}.csv\"",
            ]);
        }

        $xlsx = $excelService->generateProducerXlsxTemplate($selectedDate, [], $days);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filenameBase}.xlsx\"",
        ]);
    }

    /**
     * Import producer prices from an uploaded Excel or CSV file.
     */
    public function import(Request $request, SimpleExcelService $excelService): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'recorded_date' => ['nullable', 'date_format:Y-m-d'],
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

        $anchorDate = $validated['recorded_date'] ?? now()->format('Y-m-d');
        $result = $excelService->matchProducerPrices($rawRows, $anchorDate, 31);

        if (empty($result['matched'])) {
            return back()->withErrors(['file' => 'Tidak ditemukan data harga produsen yang valid dalam berkas. Pastikan format kolom sesuai template.']);
        }

        $userId = $request->user()?->id;

        DB::transaction(function () use ($result, $userId): void {
            foreach ($result['matched'] as $dateStr => $data) {
                $fields = [
                    'gkp_petani',
                    'gkp_penggilingan',
                    'gkg_penggilingan',
                    'beras_medium_penggilingan',
                    'beras_premium_penggilingan',
                    'sapi_hidup',
                ];

                $updateData = ['created_by' => $userId];
                if (isset($data['notes'])) {
                    $updateData['notes'] = $data['notes'];
                }

                $hasPrice = false;
                foreach ($fields as $f) {
                    if (isset($data[$f])) {
                        $updateData[$f] = $data[$f];
                        $hasPrice = true;
                    }
                }

                if ($hasPrice) {
                    ProducerPrice::updateOrCreate(
                        ['recorded_date' => $dateStr],
                        $updateData
                    );
                }
            }
        });

        $dateCount = count($result['dates']);
        $totalDetected = $result['total_detected'];

        if ($dateCount > 1) {
            $startDate = min($result['dates']);
            $endDate = max($result['dates']);
            $successMsg = "Berhasil mengimpor {$totalDetected} nilai harga produsen untuk {$dateCount} hari ({$startDate} s/d {$endDate}).";
        } else {
            $singleDate = $result['dates'][0] ?? $anchorDate;
            $successMsg = "Berhasil mengimpor {$totalDetected} nilai harga produsen untuk tanggal {$singleDate}.";
        }

        return back()->with('success', $successMsg);
    }
}

