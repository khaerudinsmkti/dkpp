<?php

namespace App\Http\Controllers;

use App\Models\ProducerCommodity;
use App\Models\ProducerPrice;
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

    /**
     * Provide chart data for daily, weekly, or monthly intervals of producer prices.
     */
    public function chartData(Request $request): JsonResponse
    {
        $type = (string) $request->query('type', 'daily');

        // Identify commodity by id or key
        $commodityId = $request->query('commodity_id');
        $commodityKey = $request->query('commodity_key');

        $commodity = null;
        if ($commodityId) {
            $commodity = ProducerCommodity::with(['haps'])->find($commodityId);
        } elseif ($commodityKey) {
            $commodity = ProducerCommodity::with(['haps'])->where('key', $commodityKey)->first();
        }

        if (! $commodity) {
            $commodity = ProducerCommodity::with(['haps'])->where('is_active', true)->orderBy('order')->first();
        }

        $key = $commodity?->key ?? 'gkp_petani';

        if ($type === 'daily') {
            $startDate = (string) $request->query('start_date', '');
            $endDate = (string) $request->query('end_date', '');

            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
                $latestDate = ProducerPrice::max('recorded_date') ?? now()->format('Y-m-d');
                $endDate = $latestDate;
                $startDate = Carbon::parse($endDate)->subDays(30)->format('Y-m-d');
            } else {
                $startCarbon = Carbon::parse($startDate);
                $endCarbon = Carbon::parse($endDate);
                if ($startCarbon->gt($endCarbon)) {
                    $startDate = $endCarbon->copy()->subDays(30)->format('Y-m-d');
                } elseif ($startCarbon->diffInDays($endCarbon) > 31) {
                    $startDate = $endCarbon->copy()->subDays(30)->format('Y-m-d');
                }
            }

            $prices = ProducerPrice::whereBetween('recorded_date', [$startDate, $endDate])
                ->orderBy('recorded_date')
                ->get()
                ->keyBy(fn ($item) => Carbon::parse($item->recorded_date)->format('Y-m-d'));

            $chartPoints = [];
            $current = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);

            while ($current->lte($end)) {
                $dStr = $current->format('Y-m-d');
                $priceRec = $prices->get($dStr);
                $hap = $commodity?->hapAt($dStr);
                $priceVal = $priceRec && $priceRec->{$key} !== null ? (float) $priceRec->{$key} : null;
                $hapVal = $hap ? (float) $hap->price : null;

                $chartPoints[] = [
                    'date' => $dStr,
                    'label' => $current->translatedFormat('d M'),
                    'full_date' => $current->translatedFormat('l, d F Y'),
                    'price' => $priceVal,
                    'hap' => $hapVal,
                    'het' => $hapVal, // alias
                ];

                $current->addDay();
            }

            return response()->json([
                'type' => 'daily',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'commodity' => $commodity ? ['id' => $commodity->id, 'key' => $commodity->key, 'name' => $commodity->name, 'unit' => $commodity->unit] : null,
                'data' => $chartPoints,
            ]);
        }

        if ($type === 'weekly') {
            $year = (int) $request->query('year', (int) now()->format('Y'));
            $month = (int) $request->query('month', (int) now()->format('n'));
            if ($month < 1 || $month > 12) {
                $month = (int) now()->format('n');
            }

            $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endOfMonth = $startOfMonth->copy()->endOfMonth();

            $prices = ProducerPrice::whereBetween('recorded_date', [$startOfMonth->format('Y-m-d'), $endOfMonth->format('Y-m-d')])
                ->orderBy('recorded_date')
                ->get();

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
                })->pluck($key)->filter(fn ($v) => $v !== null);

                $avgPrice = $wPrices->count() > 0 ? round($wPrices->avg(), 0) : null;
                $midDate = $wStart->copy()->addDays((int) ($wStart->diffInDays($wEnd) / 2))->format('Y-m-d');
                $hap = $commodity?->hapAt($midDate);
                $hapVal = $hap ? (float) $hap->price : null;

                $weeksData[] = [
                    'week' => $weekNum,
                    'label' => "M{$weekNum} ({$wStart->format('d')}-{$wEnd->format('d')} {$wStart->translatedFormat('M')})",
                    'date_range' => "{$wStart->translatedFormat('d M')} - {$wEnd->translatedFormat('d M Y')}",
                    'price' => $avgPrice,
                    'hap' => $hapVal,
                    'het' => $hapVal,
                ];

                $wStart = $wEnd->copy()->addDay();
                $weekNum++;
            }

            return response()->json([
                'type' => 'weekly',
                'year' => $year,
                'month' => $month,
                'commodity' => $commodity ? ['id' => $commodity->id, 'key' => $commodity->key, 'name' => $commodity->name, 'unit' => $commodity->unit] : null,
                'data' => $weeksData,
            ]);
        }

        if ($type === 'monthly') {
            $year = (int) $request->query('year', (int) now()->format('Y'));

            $startOfYear = Carbon::createFromDate($year, 1, 1)->startOfYear();
            $endOfYear = Carbon::createFromDate($year, 12, 31)->endOfYear();

            $prices = ProducerPrice::whereBetween('recorded_date', [$startOfYear->format('Y-m-d'), $endOfYear->format('Y-m-d')])
                ->get();

            $monthlyData = [];
            for ($m = 1; $m <= 12; $m++) {
                $mCarbon = Carbon::createFromDate($year, $m, 1);
                $mStart = $mCarbon->copy()->startOfMonth();
                $mEnd = $mCarbon->copy()->endOfMonth();

                $mPrices = $prices->filter(function ($item) use ($mStart, $mEnd) {
                    $d = Carbon::parse($item->recorded_date);

                    return $d->betweenIncluded($mStart, $mEnd);
                })->pluck($key)->filter(fn ($v) => $v !== null);

                $avgPrice = $mPrices->count() > 0 ? round($mPrices->avg(), 0) : null;
                $midDate = $mCarbon->copy()->day(15)->format('Y-m-d');
                $hap = $commodity?->hapAt($midDate);
                $hapVal = $hap ? (float) $hap->price : null;

                $monthlyData[] = [
                    'month' => $m,
                    'label' => $mCarbon->translatedFormat('M'),
                    'full_month' => $mCarbon->translatedFormat('F Y'),
                    'price' => $avgPrice,
                    'hap' => $hapVal,
                    'het' => $hapVal,
                ];
            }

            return response()->json([
                'type' => 'monthly',
                'year' => $year,
                'commodity' => $commodity ? ['id' => $commodity->id, 'key' => $commodity->key, 'name' => $commodity->name, 'unit' => $commodity->unit] : null,
                'data' => $monthlyData,
            ]);
        }

        return response()->json(['error' => 'Invalid chart type'], 400);
    }

    /**
     * Resolve historical price payload for the 6 producer commodities.
     */
    protected function getHistoryPricePayload(Request $request): array
    {
        $commodities = ProducerCommodity::where('is_active', true)->with(['haps'])->orderBy('order')->get();

        $startDate = (string) $request->query('start_date', '');
        $endDate = (string) $request->query('end_date', '');

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
            $latestDates = ProducerPrice::distinct('recorded_date')
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

        // Distinct recorded dates up to endDate
        $distinctRecordedDates = ProducerPrice::where('recorded_date', '<=', $endDate)
            ->distinct('recorded_date')
            ->orderBy('recorded_date', 'desc')
            ->pluck('recorded_date')
            ->map(fn ($d) => Carbon::parse($d)->format('Y-m-d'))
            ->toArray();

        $prevDateBeforeStart = ProducerPrice::where('recorded_date', '<', $startDate)
            ->orderBy('recorded_date', 'desc')
            ->value('recorded_date');
        $prevDateBeforeStartStr = $prevDateBeforeStart ? Carbon::parse($prevDateBeforeStart)->format('Y-m-d') : null;

        $queryDates = array_values(array_unique(array_filter(array_merge($dates, [$prevDateBeforeStartStr]))));

        $prices = ProducerPrice::whereIn('recorded_date', $queryDates)
            ->get()
            ->keyBy(fn ($item) => Carbon::parse($item->recorded_date)->format('Y-m-d'));

        $rows = [];
        foreach ($dates as $dateStr) {
            $cDate = Carbon::parse($dateStr);
            $currentRec = $prices->get($dateStr);

            $curIdx = array_search($dateStr, $distinctRecordedDates, true);
            $yestDateStr = ($curIdx !== false && isset($distinctRecordedDates[$curIdx + 1]))
                ? $distinctRecordedDates[$curIdx + 1]
                : $cDate->copy()->subDay()->format('Y-m-d');

            $yestRec = $yestDateStr ? $prices->get($yestDateStr) : null;

            $commodityPriceMap = [];
            $commodityHapMap = [];
            $commodityAboveHapMap = [];
            $commodityBelowHapMap = [];
            $commodityDiffMap = [];

            foreach ($commodities as $c) {
                $key = $c->key;
                $todayPrice = $currentRec && $currentRec->{$key} !== null ? (float) $currentRec->{$key} : null;
                $yestPrice = $yestRec && $yestRec->{$key} !== null ? (float) $yestRec->{$key} : null;

                $applicableHap = $c->hapAt($dateStr);
                $hapPrice = $applicableHap ? (float) $applicableHap->price : null;

                $isAboveHap = ($todayPrice !== null && $hapPrice !== null && $hapPrice > 0 && $todayPrice > $hapPrice);
                $isBelowHap = ($todayPrice !== null && $hapPrice !== null && $hapPrice > 0 && $todayPrice < $hapPrice);

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
                $commodityHapMap[$c->id] = $hapPrice;
                $commodityAboveHapMap[$c->id] = $isAboveHap;
                $commodityBelowHapMap[$c->id] = $isBelowHap;
                $commodityDiffMap[$c->id] = $diffType;
            }

            $rows[] = [
                'date' => $dateStr,
                'formatted_date' => $cDate->translatedFormat('d M Y'),
                'day_name' => $cDate->translatedFormat('l'),
                'prices' => $commodityPriceMap,
                'haps' => $commodityHapMap,
                'hets' => $commodityHapMap,
                'is_above_hap' => $commodityAboveHapMap,
                'is_below_hap' => $commodityBelowHapMap,
                'is_above_het' => $commodityAboveHapMap,
                'diffs' => $commodityDiffMap,
            ];
        }

        // Previous month averages
        $endCarbon = Carbon::parse($endDate);
        $prevMonthCarbon = $endCarbon->copy()->subMonth();
        $prevMonthStart = $prevMonthCarbon->copy()->startOfMonth()->format('Y-m-d');
        $prevMonthEnd = $prevMonthCarbon->copy()->endOfMonth()->format('Y-m-d');
        $prevMonthLabel = $prevMonthCarbon->translatedFormat('F Y');

        $prevMonthRecords = ProducerPrice::whereBetween('recorded_date', [$prevMonthStart, $prevMonthEnd])->get();

        $prevMonthAverages = [];
        $commodityHaps = [];

        foreach ($commodities as $c) {
            $key = $c->key;
            $vals = $prevMonthRecords->pluck($key)->filter(fn ($v) => $v !== null);
            $prevMonthAverages[$c->id] = $vals->count() > 0 ? round($vals->avg(), 0) : null;

            $applicableHap = $c->hapAt($endDate) ?? $c->haps->first();
            $commodityHaps[$c->id] = $applicableHap ? (float) $applicableHap->price : null;
        }

        return [
            'market' => [
                'name' => 'Kabupaten Indramayu',
                'description' => 'Sentra Produsen & Penggilingan Padi Indramayu',
            ],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'prev_month_label' => $prevMonthLabel,
            'prev_month_averages' => $prevMonthAverages,
            'commodity_haps' => $commodityHaps,
            'commodity_hets' => $commodityHaps,
            'commodities' => $commodities,
            'rows' => $rows,
        ];
    }

    /**
     * Get historical producer price data in JSON format for the interactive table.
     */
    public function historyData(Request $request): JsonResponse
    {
        $payload = $this->getHistoryPricePayload($request);

        return response()->json([
            'market' => $payload['market'],
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'],
            'prev_month_label' => $payload['prev_month_label'],
            'prev_month_averages' => $payload['prev_month_averages'],
            'commodity_haps' => $payload['commodity_haps'],
            'commodity_hets' => $payload['commodity_hets'],
            'commodities' => $payload['commodities']->map(fn ($c) => [
                'id' => $c->id,
                'key' => $c->key,
                'name' => $c->name,
                'category' => $c->category,
                'unit' => $c->unit,
            ]),
            'rows' => $payload['rows'],
        ]);
    }

    /**
     * Download historical producer price data as Excel (.xlsx).
     */
    public function historyExcel(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $payload = $this->getHistoryPricePayload($request);

        $xlsxContent = $excelService->generateProducerHistoricalXlsx(
            startDate: $payload['start_date'],
            endDate: $payload['end_date'],
            commodities: $payload['commodities'],
            rows: $payload['rows']
        );

        $filename = "rekap_historis_harga_produsen_{$payload['start_date']}_sd_{$payload['end_date']}.xlsx";

        return response($xlsxContent, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Resolve monthly historical producer price data (Jan - Dec) for the specified year.
     *
     * @return array{
     *     market: array{name: string, description: string},
     *     year: int,
     *     available_years: array<int, int>,
     *     months: array<int, array{num: int, name: string, short: string}>,
     *     commodities: Collection<int, ProducerCommodity>,
     *     commodity_rows: array<int, array{
     *         id: int,
     *         key: string,
     *         name: string,
     *         category: string,
     *         unit: string,
     *         current_hap: float|null,
     *         current_het: float|null,
     *         monthly_prices: array<int, float|null>,
     *         monthly_haps: array<int, float|null>,
     *         monthly_hets: array<int, float|null>,
     *         is_below_hap: array<int, bool>,
     *         is_above_hap: array<int, bool>,
     *         yearly_average: float|null,
     *     }>,
     *     month_summary: array<int, array{
     *         average: float|null,
     *         below_hap_count: int,
     *         above_hap_count: int,
     *         recorded_count: int,
     *     }>,
     * }
     */
    protected function getMonthlyHistoryPricePayload(Request $request): array
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $yearSql = $isSqlite ? "strftime('%Y', recorded_date)" : 'YEAR(recorded_date)';

        // Available recorded years
        $availableYears = ProducerPrice::selectRaw("DISTINCT {$yearSql} as yr")
            ->orderByDesc('yr')
            ->pluck('yr')
            ->map(fn ($y) => (int) $y)
            ->filter(fn ($y) => $y > 0)
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

        $commodities = ProducerCommodity::where('is_active', true)->with(['haps'])->orderBy('order')->get();

        $startOfYear = Carbon::createFromDate($year, 1, 1)->startOfYear()->format('Y-m-d');
        $endOfYear = Carbon::createFromDate($year, 12, 31)->endOfYear()->format('Y-m-d');

        $prices = ProducerPrice::whereBetween('recorded_date', [$startOfYear, $endOfYear])
            ->get();

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

        // Group prices by month number (1..12)
        $groupedByMonth = [];
        foreach ($prices as $pRec) {
            $m = (int) Carbon::parse($pRec->recorded_date)->format('n');
            $groupedByMonth[$m][] = $pRec;
        }

        $commodityRows = [];
        $monthCommodityPrices = array_fill(1, 12, []);
        $monthBelowHapCounts = array_fill(1, 12, 0);
        $monthAboveHapCounts = array_fill(1, 12, 0);

        foreach ($commodities as $c) {
            $key = $c->key;
            $monthlyPrices = [];
            $monthlyHaps = [];
            $isBelowHap = [];
            $isAboveHap = [];
            $validPricesForYear = [];

            $latestHapRecord = $c->hapAt(sprintf('%04d-12-31', $year)) ?? $c->haps->first();
            $currentHapPrice = $latestHapRecord ? (float) $latestHapRecord->price : null;

            for ($m = 1; $m <= 12; $m++) {
                $monthRecs = $groupedByMonth[$m] ?? [];
                $vals = collect($monthRecs)->pluck($key)->filter(fn ($v) => $v !== null && $v !== '');
                $avgPrice = $vals->count() > 0 ? round((float) $vals->avg(), 0) : null;

                $midDate = sprintf('%04d-%02d-15', $year, $m);
                $hapRecord = $c->hapAt($midDate) ?? $latestHapRecord;
                $hapPrice = $hapRecord ? (float) $hapRecord->price : null;

                $below = ($avgPrice !== null && $hapPrice !== null && $hapPrice > 0 && $avgPrice < $hapPrice);
                $above = ($avgPrice !== null && $hapPrice !== null && $hapPrice > 0 && $avgPrice > $hapPrice);

                $monthlyPrices[$m] = $avgPrice;
                $monthlyHaps[$m] = $hapPrice;
                $isBelowHap[$m] = $below;
                $isAboveHap[$m] = $above;

                if ($avgPrice !== null) {
                    $validPricesForYear[] = $avgPrice;
                    $monthCommodityPrices[$m][] = $avgPrice;
                }

                if ($below) {
                    $monthBelowHapCounts[$m]++;
                }
                if ($above) {
                    $monthAboveHapCounts[$m]++;
                }
            }

            $yearlyAvg = ! empty($validPricesForYear)
                ? round(array_sum($validPricesForYear) / count($validPricesForYear), 0)
                : null;

            $commodityRows[] = [
                'id' => $c->id,
                'key' => $key,
                'name' => $c->name,
                'category' => $c->category,
                'unit' => $c->unit,
                'current_hap' => $currentHapPrice,
                'current_het' => $currentHapPrice,
                'monthly_prices' => $monthlyPrices,
                'monthly_haps' => $monthlyHaps,
                'monthly_hets' => $monthlyHaps,
                'is_below_hap' => $isBelowHap,
                'is_above_hap' => $isAboveHap,
                'yearly_average' => $yearlyAvg,
            ];
        }

        $monthSummary = [];
        for ($m = 1; $m <= 12; $m++) {
            $pricesInMonth = $monthCommodityPrices[$m];
            $monthAvg = ! empty($pricesInMonth) ? round(array_sum($pricesInMonth) / count($pricesInMonth), 0) : null;
            $monthSummary[$m] = [
                'average' => $monthAvg,
                'below_hap_count' => $monthBelowHapCounts[$m],
                'above_hap_count' => $monthAboveHapCounts[$m],
                'recorded_count' => count($pricesInMonth),
            ];
        }

        return [
            'market' => [
                'name' => 'Kabupaten Indramayu',
                'description' => 'Sentra Produsen & Penggilingan Padi Indramayu',
            ],
            'year' => $year,
            'available_years' => $availableYears,
            'months' => $months,
            'commodities' => $commodities,
            'commodity_rows' => $commodityRows,
            'month_summary' => $monthSummary,
        ];
    }

    /**
     * Get historical monthly producer price data in JSON format for the interactive table.
     */
    public function monthlyHistoryData(Request $request): JsonResponse
    {
        $payload = $this->getMonthlyHistoryPricePayload($request);

        return response()->json([
            'market' => $payload['market'],
            'year' => $payload['year'],
            'available_years' => $payload['available_years'],
            'months' => $payload['months'],
            'commodities' => $payload['commodities']->map(fn ($c) => [
                'id' => $c->id,
                'key' => $c->key,
                'name' => $c->name,
                'category' => $c->category,
                'unit' => $c->unit,
            ]),
            'commodity_rows' => $payload['commodity_rows'],
            'month_summary' => $payload['month_summary'],
        ]);
    }

    /**
     * Download historical monthly producer price data as Excel (.xlsx).
     */
    public function monthlyHistoryExcel(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $payload = $this->getMonthlyHistoryPricePayload($request);
        $marketName = 'Kabupaten Indramayu';

        $xlsxContent = $excelService->generateProducerMonthlyHistoricalXlsx(
            marketName: $marketName,
            year: $payload['year'],
            commodities: $payload['commodities'],
            commodityRows: $payload['commodity_rows'],
            monthSummary: $payload['month_summary']
        );

        $filename = "rekap_historis_bulanan_harga_produsen_{$payload['year']}.xlsx";

        return response($xlsxContent, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
