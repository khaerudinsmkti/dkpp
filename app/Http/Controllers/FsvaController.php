<?php

namespace App\Http\Controllers;

use App\Models\Fsva;
use App\Services\SimpleExcelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FsvaController extends Controller
{
    /**
     * Display public FSVA dashboard with hero banner, filters, summary cards,
     * Leaflet interactive map, bar chart of 6 priorities, donut chart of vulnerability,
     * and 6 classification cards.
     */
    public function publicIndex(Request $request): Response
    {
        $maxYear = Fsva::max('tahun') ?? (int) now()->year;
        $selectedYear = (int) $request->query('year', $maxYear);

        $selectedIndicator = (string) $request->query('indicator', 'komposit');
        if (! array_key_exists($selectedIndicator, Fsva::INDICATORS)) {
            $selectedIndicator = 'komposit';
        }

        $selectedKecamatan = (string) $request->query('kecamatan', '');

        // Query all village records for the selected year
        $query = Fsva::where('tahun', $selectedYear);
        if ($selectedKecamatan !== '') {
            $query->where('kecamatan', $selectedKecamatan);
        }
        $records = $query->orderBy('rank')->get();

        // Total villages available
        $totalDesa = $records->count();

        // 6 Priority Buckets
        $priorityCounts = [
            1 => 0,
            2 => 0,
            3 => 0,
            4 => 0,
            5 => 0,
            6 => 0,
        ];
        $priorityVillages = [
            1 => [],
            2 => [],
            3 => [],
            4 => [],
            5 => [],
            6 => [],
        ];

        // Format items for map and table
        $items = [];
        $indicatorValues = [];

        foreach ($records as $r) {
            $komposit = max(1, min(6, (int) ($r->komposit ?? 1)));

            // Get value for current selected indicator
            $indicatorVal = match ($selectedIndicator) {
                'komposit' => $komposit,
                'ikp' => $r->ikp,
                'ncpr' => $r->ncpr,
                'energy' => $r->energy,
                'protein' => $r->protein,
                'food_reserves' => $r->food_reserves,
                'poverty' => $r->poverty,
                'price_cv' => $r->price_cv,
                'pou' => $r->pou,
                'female_school' => $r->female_school,
                'no_water' => $r->no_water,
                'pph' => $r->pph,
                'stunting' => $r->stunting,
                default => $komposit,
            };

            // Calculate active priority (1-6) for this village based on current indicator
            $activePriority = ($selectedIndicator === 'komposit' || $selectedIndicator === 'ikp')
                ? $komposit
                : ($indicatorVal !== null ? max(1, min(6, (int) round((float) $indicatorVal))) : $komposit);

            $priorityCounts[$activePriority]++;

            if ($indicatorVal !== null && is_numeric($indicatorVal)) {
                $indicatorValues[] = (float) $indicatorVal;
            }

            $item = [
                'id' => $r->id,
                'tahun' => $r->tahun,
                'kecamatan' => $r->kecamatan,
                'desa' => $r->desa,
                'ncpr' => $r->ncpr,
                'energy' => $r->energy,
                'protein' => $r->protein,
                'food_reserves' => $r->food_reserves,
                'poverty' => $r->poverty,
                'price_cv' => $r->price_cv,
                'pou' => $r->pou,
                'female_school' => $r->female_school,
                'no_water' => $r->no_water,
                'pph' => $r->pph,
                'stunting' => $r->stunting,
                'ikp' => $r->ikp,
                'rank' => $r->rank,
                'komposit' => $komposit,
                'keterangan' => $r->keterangan,
                'current_indicator_value' => $indicatorVal,
                'active_priority' => $activePriority,
                'priority_info' => Fsva::getPriorityInfo($activePriority),
            ];

            $priorityVillages[$activePriority][] = $item;
            $items[] = $item;
        }

        // Indicator Summary Statistics
        $indInfo = Fsva::INDICATORS[$selectedIndicator] ?? Fsva::INDICATORS['komposit'];
        $avgValue = ! empty($indicatorValues) ? round(array_sum($indicatorValues) / count($indicatorValues), 2) : 0;
        $minValue = ! empty($indicatorValues) ? min($indicatorValues) : 0;
        $maxValue = ! empty($indicatorValues) ? max($indicatorValues) : 0;

        // Find desa with min and max
        $minDesa = null;
        $maxDesa = null;
        if (! empty($items) && $selectedIndicator !== 'komposit') {
            foreach ($items as $it) {
                if ($it['current_indicator_value'] !== null) {
                    if ($minDesa === null || $it['current_indicator_value'] < $minDesa['current_indicator_value']) {
                        $minDesa = $it;
                    }
                    if ($maxDesa === null || $it['current_indicator_value'] > $maxDesa['current_indicator_value']) {
                        $maxDesa = $it;
                    }
                }
            }
        }

        // Donut / Pie Summary: Rentan (1-3) vs Aman (4-6)
        $countRentan = $priorityCounts[1] + $priorityCounts[2] + $priorityCounts[3];
        $countAman = $priorityCounts[4] + $priorityCounts[5] + $priorityCounts[6];
        $pctRentan = $totalDesa > 0 ? round(($countRentan / $totalDesa) * 100, 1) : 0;
        $pctAman = $totalDesa > 0 ? round(($countAman / $totalDesa) * 100, 1) : 0;

        $donutSummary = [
            'total_desa' => $totalDesa,
            'count_rentan' => $countRentan,
            'percentage_rentan' => $pctRentan,
            'count_aman' => $countAman,
            'percentage_aman' => $pctAman,
            'chart_data' => [
                [
                    'name' => 'Desa Rentan (Prioritas 1-3)',
                    'value' => $countRentan,
                    'percentage' => $pctRentan,
                    'color' => '#ef4444',
                ],
                [
                    'name' => 'Desa Aman / Tahan (Prioritas 4-6)',
                    'value' => $countAman,
                    'percentage' => $pctAman,
                    'color' => '#10b981',
                ],
            ],
        ];

        // 6 Priority Distribution Bar Chart Data
        $priorityChartData = [];
        foreach (range(1, 6) as $p) {
            $pInfo = Fsva::PRIORITIES[$p];
            $count = $priorityCounts[$p];
            $pct = $totalDesa > 0 ? round(($count / $totalDesa) * 100, 1) : 0;

            $priorityChartData[] = [
                'priority' => $p,
                'name' => "P{$p}",
                'full_name' => $pInfo['label'],
                'short_name' => $pInfo['short'],
                'count' => $count,
                'percentage' => $pct,
                'color' => $pInfo['color'],
                'category' => $pInfo['category'],
            ];
        }

        // 6 Classification Cards
        $classificationCards = [];
        foreach (range(1, 6) as $p) {
            $pInfo = Fsva::PRIORITIES[$p];
            $vList = $priorityVillages[$p];
            $count = count($vList);
            $pct = $totalDesa > 0 ? round(($count / $totalDesa) * 100, 1) : 0;

            $ikpSum = array_sum(array_column($vList, 'ikp'));
            $avgIkp = $count > 0 ? round($ikpSum / $count, 2) : 0;

            $indSum = array_sum(array_column($vList, 'current_indicator_value'));
            $avgInd = $count > 0 ? round($indSum / $count, 2) : 0;

            $classificationCards[] = [
                'priority' => $p,
                'title' => "Prioritas {$p}",
                'status' => $pInfo['short'],
                'full_title' => $pInfo['label'],
                'count' => $count,
                'percentage' => $pct,
                'avg_ikp' => $avgIkp,
                'avg_indicator' => $avgInd,
                'color' => $pInfo['color'],
                'bg_class' => $pInfo['bg_class'],
                'category' => $pInfo['category'],
                'description' => $pInfo['desc'],
                'villages' => array_map(fn ($v) => [
                    'id' => $v['id'],
                    'desa' => $v['desa'],
                    'kecamatan' => $v['kecamatan'],
                    'ikp' => $v['ikp'],
                    'rank' => $v['rank'],
                    'current_indicator_value' => $v['current_indicator_value'],
                ], $vList),
            ];
        }

        // Available years
        $availableYears = Fsva::distinct()
            ->orderByDesc('tahun')
            ->pluck('tahun')
            ->toArray();

        if (empty($availableYears)) {
            $availableYears = [(int) now()->year];
        }

        return Inertia::render('fsva', [
            'items' => $items,
            'summary' => [
                'year' => $selectedYear,
                'total_desa' => $totalDesa,
                'indicator' => $selectedIndicator,
                'indicator_info' => $indInfo,
                'avg_value' => $avgValue,
                'min_value' => $minValue,
                'max_value' => $maxValue,
                'min_desa' => $minDesa,
                'max_desa' => $maxDesa,
                'count_rentan' => $countRentan,
                'count_aman' => $countAman,
                'pct_rentan' => $pctRentan,
                'pct_aman' => $pctAman,
            ],
            'priorityChartData' => $priorityChartData,
            'donutSummary' => $donutSummary,
            'classificationCards' => $classificationCards,
            'indicators' => Fsva::INDICATORS,
            'availableYears' => $availableYears,
            'kecamatanList' => Fsva::getKecamatanList(),
            'filters' => [
                'year' => $selectedYear,
                'indicator' => $selectedIndicator,
                'kecamatan' => $selectedKecamatan,
            ],
        ]);
    }

    /**
     * Display FSVA admin management with CRUD table, search, filters, import, and copy-paste.
     */
    public function index(Request $request): Response
    {
        $maxYear = Fsva::max('tahun') ?? (int) now()->year;
        $selectedYear = (int) $request->query('year', $maxYear);
        $search = (string) $request->query('search', '');
        $filterKecamatan = (string) $request->query('kecamatan', '');
        $filterKomposit = $request->query('komposit');

        $query = Fsva::with('creator:id,name')->where('tahun', $selectedYear);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('desa', 'like', "%{$search}%")
                    ->orWhere('kecamatan', 'like', "%{$search}%")
                    ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        if ($filterKecamatan !== '') {
            $query->where('kecamatan', $filterKecamatan);
        }

        if ($filterKomposit !== null && $filterKomposit !== '') {
            $query->where('komposit', (int) $filterKomposit);
        }

        $perPage = (int) $request->query('per_page', 15);
        if ($perPage <= 0) {
            $perPage = 15;
        }

        // Paginate records for admin table (default 15)
        $records = $query->orderBy('kecamatan')
            ->orderBy('desa')
            ->paginate($perPage)
            ->withQueryString();

        // Overview statistics
        $allCurrentYear = Fsva::where('tahun', $selectedYear)->get();
        $totalRecorded = $allCurrentYear->count();

        $countRentan = $allCurrentYear->whereIn('komposit', [1, 2, 3])->count();
        $countAman = $allCurrentYear->whereIn('komposit', [4, 5, 6])->count();
        $avgIkp = $totalRecorded > 0 ? round($allCurrentYear->avg('ikp') ?? 0, 2) : 0;

        $priorityBreakdown = [];
        foreach (range(1, 6) as $p) {
            $priorityBreakdown[$p] = $allCurrentYear->where('komposit', $p)->count();
        }

        $statistics = [
            'total_desa' => $totalRecorded,
            'target_total' => 317,
            'count_rentan' => $countRentan,
            'count_aman' => $countAman,
            'avg_ikp' => $avgIkp,
            'priority_breakdown' => $priorityBreakdown,
        ];

        $availableYears = Fsva::distinct()
            ->orderByDesc('tahun')
            ->pluck('tahun')
            ->toArray();

        if (empty($availableYears)) {
            $availableYears = [(int) now()->year];
        }

        return Inertia::render('fsva/index', [
            'records' => $records,
            'statistics' => $statistics,
            'availableYears' => $availableYears,
            'kecamatanList' => Fsva::getKecamatanList(),
            'villageData' => Fsva::VILLAGE_DATA,
            'indicators' => Fsva::INDICATORS,
            'priorities' => Fsva::PRIORITIES,
            'filters' => [
                'year' => $selectedYear,
                'search' => $search,
                'kecamatan' => $filterKecamatan,
                'komposit' => $filterKomposit !== null && $filterKomposit !== '' ? (int) $filterKomposit : null,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a single FSVA record.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun' => ['required', 'integer', 'min:2000', 'max:2100'],
            'kecamatan' => ['required', 'string', 'max:100'],
            'desa' => ['required', 'string', 'max:100'],
            'ncpr' => ['nullable', 'numeric'],
            'energy' => ['nullable', 'numeric'],
            'protein' => ['nullable', 'numeric'],
            'food_reserves' => ['nullable', 'numeric'],
            'poverty' => ['nullable', 'numeric'],
            'price_cv' => ['nullable', 'numeric'],
            'pou' => ['nullable', 'numeric'],
            'female_school' => ['nullable', 'numeric'],
            'no_water' => ['nullable', 'numeric'],
            'pph' => ['nullable', 'numeric'],
            'stunting' => ['nullable', 'numeric'],
            'ikp' => ['nullable', 'numeric'],
            'rank' => ['nullable', 'integer', 'min:1'],
            'komposit' => ['required', 'integer', 'min:1', 'max:6'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['created_by'] = $request->user()?->id;

        Fsva::updateOrCreate(
            [
                'tahun' => $validated['tahun'],
                'kecamatan' => strtoupper(trim($validated['kecamatan'])),
                'desa' => strtoupper(trim($validated['desa'])),
            ],
            $validated
        );

        return back()->with('success', "Data FSVA Desa {$validated['desa']} Kecamatan {$validated['kecamatan']} tahun {$validated['tahun']} berhasil disimpan.");
    }

    /**
     * Update an existing FSVA record.
     */
    public function update(Request $request, Fsva $fsva): RedirectResponse
    {
        $validated = $request->validate([
            'ncpr' => ['nullable', 'numeric'],
            'energy' => ['nullable', 'numeric'],
            'protein' => ['nullable', 'numeric'],
            'food_reserves' => ['nullable', 'numeric'],
            'poverty' => ['nullable', 'numeric'],
            'price_cv' => ['nullable', 'numeric'],
            'pou' => ['nullable', 'numeric'],
            'female_school' => ['nullable', 'numeric'],
            'no_water' => ['nullable', 'numeric'],
            'pph' => ['nullable', 'numeric'],
            'stunting' => ['nullable', 'numeric'],
            'ikp' => ['nullable', 'numeric'],
            'rank' => ['nullable', 'integer', 'min:1'],
            'komposit' => ['required', 'integer', 'min:1', 'max:6'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ]);

        $fsva->update($validated);

        return back()->with('success', "Data FSVA Desa {$fsva->desa} Kecamatan {$fsva->kecamatan} berhasil diperbarui.");
    }

    /**
     * Delete an existing FSVA record.
     */
    public function destroy(Fsva $fsva): RedirectResponse
    {
        $desa = $fsva->desa;
        $kec = $fsva->kecamatan;
        $tahun = $fsva->tahun;

        $fsva->delete();

        return back()->with('success', "Data FSVA Desa {$desa} ({$kec}) tahun {$tahun} berhasil dihapus.");
    }

    /**
     * Bulk store/update FSVA records (used by copy-paste feature and batch updates).
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.kecamatan' => ['required', 'string'],
            'items.*.desa' => ['required', 'string'],
            'items.*.ncpr' => ['nullable', 'numeric'],
            'items.*.energy' => ['nullable', 'numeric'],
            'items.*.protein' => ['nullable', 'numeric'],
            'items.*.food_reserves' => ['nullable', 'numeric'],
            'items.*.poverty' => ['nullable', 'numeric'],
            'items.*.price_cv' => ['nullable', 'numeric'],
            'items.*.pou' => ['nullable', 'numeric'],
            'items.*.female_school' => ['nullable', 'numeric'],
            'items.*.no_water' => ['nullable', 'numeric'],
            'items.*.pph' => ['nullable', 'numeric'],
            'items.*.stunting' => ['nullable', 'numeric'],
            'items.*.ikp' => ['nullable', 'numeric'],
            'items.*.rank' => ['nullable', 'integer'],
            'items.*.komposit' => ['required', 'integer', 'min:1', 'max:6'],
            'items.*.keterangan' => ['nullable', 'string', 'max:1000'],
        ]);

        $year = (int) $validated['year'];
        $userId = $request->user()?->id;
        $savedCount = 0;

        DB::transaction(function () use ($validated, $year, $userId, &$savedCount) {
            foreach ($validated['items'] as $item) {
                $kec = strtoupper(trim($item['kecamatan']));
                $desa = strtoupper(trim($item['desa']));

                Fsva::updateOrCreate(
                    [
                        'tahun' => $year,
                        'kecamatan' => $kec,
                        'desa' => $desa,
                    ],
                    [
                        'ncpr' => $item['ncpr'] ?? null,
                        'energy' => $item['energy'] ?? null,
                        'protein' => $item['protein'] ?? null,
                        'food_reserves' => $item['food_reserves'] ?? null,
                        'poverty' => $item['poverty'] ?? null,
                        'price_cv' => $item['price_cv'] ?? null,
                        'pou' => $item['pou'] ?? null,
                        'female_school' => $item['female_school'] ?? null,
                        'no_water' => $item['no_water'] ?? null,
                        'pph' => $item['pph'] ?? null,
                        'stunting' => $item['stunting'] ?? null,
                        'ikp' => $item['ikp'] ?? null,
                        'rank' => ! empty($item['rank']) ? (int) $item['rank'] : null,
                        'komposit' => max(1, min(6, (int) ($item['komposit'] ?? 1))),
                        'keterangan' => $item['keterangan'] ?? null,
                        'created_by' => $userId,
                    ]
                );
                $savedCount++;
            }
        });

        return back()->with('success', "Berhasil menyimpan dan memperbarui data bulk FSVA {$savedCount} desa untuk tahun {$year}.");
    }

    /**
     * Download Excel or CSV template for FSVA input.
     */
    public function downloadTemplate(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $year = (int) $request->query('year', now()->year);
        $format = strtolower((string) $request->query('format', 'xlsx'));

        // Preload existing records if available
        $existing = Fsva::where('tahun', $year)
            ->get()
            ->keyBy(fn ($item) => Fsva::normalizeName($item->kecamatan).'_'.Fsva::normalizeName($item->desa))
            ->toArray();

        $filenameBase = "template_fsva_indramayu_{$year}";

        if ($format === 'csv') {
            $csv = $excelService->generateFsvaCsvTemplate($year, $existing);

            return response($csv, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filenameBase}.csv\"",
            ]);
        }

        $xlsx = $excelService->generateFsvaXlsxTemplate($year, $existing);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filenameBase}.xlsx\"",
        ]);
    }

    /**
     * Export FSVA data for selected year to Excel.
     */
    public function exportExcel(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $year = (int) $request->query('year', now()->year);

        $records = Fsva::where('tahun', $year)
            ->orderBy('rank')
            ->orderBy('kecamatan')
            ->orderBy('desa')
            ->get()
            ->toArray();

        $xlsx = $excelService->exportFsvaXlsx($year, $records);
        $filename = "data_fsva_indramayu_{$year}.xlsx";

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import FSVA data from uploaded Excel/CSV file.
     */
    public function import(Request $request, SimpleExcelService $excelService): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $file = $request->file('file');
        if (! $file) {
            return back()->withErrors(['file' => 'Berkas tidak ditemukan.']);
        }

        $extension = $file->getClientOriginalExtension();
        $allowed = ['xlsx', 'csv', 'txt', 'xls', 'tsv'];
        if (! in_array(strtolower($extension), $allowed, true)) {
            return back()->withErrors(['file' => 'Format berkas tidak didukung. Harap unggah berkas .xlsx, .csv, atau .tsv.']);
        }

        try {
            $rawRows = $excelService->parseFile($file->getRealPath(), $extension);
        } catch (\Throwable $e) {
            return back()->withErrors(['file' => 'Gagal membaca berkas: '.$e->getMessage()]);
        }

        $year = (int) $validated['year'];
        $matchedResult = $excelService->matchFsvaRows($rawRows, $year);
        $matchedRows = $matchedResult['matched'];

        if (empty($matchedRows)) {
            return back()->withErrors(['file' => 'Tidak ada baris data desa/kecamatan yang cocok ditemukan dalam berkas Excel. Pastikan nama kecamatan dan desa sesuai template resmi FSVA.']);
        }

        $userId = $request->user()?->id;
        $savedCount = 0;

        DB::transaction(function () use ($matchedRows, $year, $userId, &$savedCount) {
            foreach ($matchedRows as $row) {
                $kec = strtoupper(trim($row['kecamatan']));
                $desa = strtoupper(trim($row['desa']));

                Fsva::updateOrCreate(
                    [
                        'tahun' => $year,
                        'kecamatan' => $kec,
                        'desa' => $desa,
                    ],
                    [
                        'ncpr' => $row['ncpr'] ?? null,
                        'energy' => $row['energy'] ?? null,
                        'protein' => $row['protein'] ?? null,
                        'food_reserves' => $row['food_reserves'] ?? null,
                        'poverty' => $row['poverty'] ?? null,
                        'price_cv' => $row['price_cv'] ?? null,
                        'pou' => $row['pou'] ?? null,
                        'female_school' => $row['female_school'] ?? null,
                        'no_water' => $row['no_water'] ?? null,
                        'pph' => $row['pph'] ?? null,
                        'stunting' => $row['stunting'] ?? null,
                        'ikp' => $row['ikp'] ?? null,
                        'rank' => ! empty($row['rank']) ? (int) $row['rank'] : null,
                        'komposit' => max(1, min(6, (int) ($row['komposit'] ?? 1))),
                        'keterangan' => $row['keterangan'] ?? null,
                        'created_by' => $userId,
                    ]
                );
                $savedCount++;
            }
        });

        return back()->with('success', "Berhasil mengimpor data {$savedCount} desa untuk FSVA tahun {$year}.");
    }

    /**
     * Download or serve original Indramayu Desa GeoJSON map file.
     */
    public function geojson(): BinaryFileResponse|JsonResponse
    {
        $filePath = base_path('storage/peta/indramayu_desa.json');

        if (! file_exists($filePath)) {
            return response()->json(['error' => 'Peta desa tidak ditemukan'], 404);
        }

        return response()->file($filePath, [
            'Content-Type' => 'application/geo+json',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}

