<?php

namespace App\Http\Controllers;

use App\Models\Skpg;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SkpgController extends Controller
{
    /**
     * Display public SKPG monitoring page with interactive map, hero banner, and indicator status cards.
     */
    public function publicIndex(Request $request): Response
    {
        $maxYear = Skpg::max('year') ?? (int) now()->year;
        $selectedYear = (int) $request->query('year', $maxYear);

        $maxMonthInYear = Skpg::where('year', $selectedYear)->max('month') ?? (int) now()->month;
        $selectedMonth = (int) $request->query('month', $maxMonthInYear);

        $selectedIndicator = (string) $request->query('indicator', 'ikb');
        if (! array_key_exists($selectedIndicator, Skpg::INDICATORS)) {
            $selectedIndicator = 'ikb';
        }

        // Fetch records for the selected year and month
        $records = Skpg::where('year', $selectedYear)
            ->where('month', $selectedMonth)
            ->get()
            ->keyBy(fn (Skpg $item) => Skpg::normalizeName($item->kecamatan));

        // Format all 31 kecamatan in standardized order
        $kecamatanItems = [];
        $indicatorCounts = [
            'ikb' => ['AMAN' => 0, 'WASPADA' => 0, 'RENTAN' => 0],
            'ik' => ['AMAN' => 0, 'WASPADA' => 0, 'RENTAN' => 0],
            'ia' => ['AMAN' => 0, 'WASPADA' => 0, 'RENTAN' => 0],
            'ip' => ['AMAN' => 0, 'WASPADA' => 0, 'RENTAN' => 0],
            'potensi_kering' => ['AMAN' => 0, 'WASPADA' => 0, 'SIAGA' => 0, 'AWAS' => 0],
            'potensi_basah' => ['AMAN' => 0, 'WASPADA' => 0, 'SIAGA' => 0, 'AWAS' => 0],
            'kondisi_iklim' => ['AMAN' => 0, 'WASPADA' => 0, 'SIAGA' => 0, 'AWAS' => 0],
        ];

        foreach (Skpg::KECAMATAN_LIST as $kecName) {
            $normName = Skpg::normalizeName($kecName);
            $record = $records->get($normName);
            $code = Skpg::KECAMATAN_CODES[$kecName] ?? '';

            $ik = $record?->ik ?? Skpg::STATUS_AMAN;
            $ia = $record?->ia ?? Skpg::STATUS_AMAN;
            $ip = $record?->ip ?? Skpg::STATUS_AMAN;
            $ikb = $record?->ikb ?? Skpg::STATUS_AMAN;
            $potensiKering = $record?->potensi_kering ?? Skpg::STATUS_AMAN;
            $potensiBasah = $record?->potensi_basah ?? Skpg::STATUS_AMAN;
            $kondisiIklim = $record?->kondisi_iklim ?? Skpg::STATUS_AMAN;

            $item = [
                'id' => $record?->id,
                'kecamatan' => $kecName,
                'kode_kecamatan' => $code,
                'year' => $selectedYear,
                'month' => $selectedMonth,
                'ik' => $ik,
                'ia' => $ia,
                'ip' => $ip,
                'ikb' => $ikb,
                'potensi_kering' => $potensiKering,
                'potensi_basah' => $potensiBasah,
                'kondisi_iklim' => $kondisiIklim,
                'keterangan' => $record?->keterangan ?? '',
                'is_recorded' => $record !== null,
                'current_indicator_status' => match ($selectedIndicator) {
                    'ik' => $ik,
                    'ia' => $ia,
                    'ip' => $ip,
                    'potensi_kering' => $potensiKering,
                    'potensi_basah' => $potensiBasah,
                    'kondisi_iklim' => $kondisiIklim,
                    default => $ikb,
                },
            ];

            // Tally counts
            foreach (array_keys($indicatorCounts) as $indKey) {
                $statusVal = $item[$indKey] ?? Skpg::STATUS_AMAN;
                if (isset($indicatorCounts[$indKey][$statusVal])) {
                    $indicatorCounts[$indKey][$statusVal]++;
                }
            }

            $kecamatanItems[] = $item;
        }

        // Available years and months for navigation
        $availableYears = Skpg::distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->toArray();

        if (empty($availableYears)) {
            $availableYears = [(int) now()->year];
        }

        $availableMonths = Skpg::where('year', $selectedYear)
            ->distinct()
            ->orderBy('month')
            ->pluck('month')
            ->toArray();

        if (empty($availableMonths)) {
            $availableMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }

        // Summary for current selected indicator
        $isClimate = in_array($selectedIndicator, Skpg::CLIMATE_INDICATORS, true);
        $currentCounts = $indicatorCounts[$selectedIndicator] ?? [];

        $overallStatus = 'AMAN';
        if ($isClimate) {
            if (($currentCounts['AWAS'] ?? 0) > 0) {
                $overallStatus = 'AWAS';
            } elseif (($currentCounts['SIAGA'] ?? 0) > 2) {
                $overallStatus = 'SIAGA';
            } elseif (($currentCounts['WASPADA'] ?? 0) > 5) {
                $overallStatus = 'WASPADA';
            }
        } else {
            if (($currentCounts['RENTAN'] ?? 0) > 3) {
                $overallStatus = 'RENTAN';
            } elseif (($currentCounts['WASPADA'] ?? 0) > 5) {
                $overallStatus = 'WASPADA';
            }
        }

        $summary = [
            'year' => $selectedYear,
            'month' => $selectedMonth,
            'month_name' => $this->getMonthName($selectedMonth),
            'selected_indicator' => $selectedIndicator,
            'indicator_label' => Skpg::INDICATORS[$selectedIndicator] ?? 'Komposit (IKB)',
            'total_kecamatan' => count($kecamatanItems),
            'is_climate' => $isClimate,
            'count_aman' => $currentCounts['AMAN'] ?? 0,
            'count_waspada' => $currentCounts['WASPADA'] ?? 0,
            'count_rentan' => $currentCounts['RENTAN'] ?? 0,
            'count_siaga' => $currentCounts['SIAGA'] ?? 0,
            'count_awas' => $currentCounts['AWAS'] ?? 0,
            'overall_status' => $overallStatus,
            'indicator_counts' => $indicatorCounts,
        ];

        // Prepare 12-month annual calendar data for the selected year
        $annualRecords = Skpg::where('year', $selectedYear)->get();
        $annualCalendar = [];

        foreach (Skpg::KECAMATAN_LIST as $kecName) {
            $normName = Skpg::normalizeName($kecName);
            $annualCalendar[$normName] = [
                'kecamatan' => $kecName,
                'kode_kecamatan' => Skpg::KECAMATAN_CODES[$kecName] ?? '',
                'months' => array_fill(1, 12, null),
            ];
        }

        foreach ($annualRecords as $rec) {
            $normRec = Skpg::normalizeName($rec->kecamatan);
            if (isset($annualCalendar[$normRec])) {
                $annualCalendar[$normRec]['months'][(int) $rec->month] = [
                    'ik' => $rec->ik,
                    'ia' => $rec->ia,
                    'ip' => $rec->ip,
                    'ikb' => $rec->ikb,
                    'potensi_kering' => $rec->potensi_kering,
                    'potensi_basah' => $rec->potensi_basah,
                    'kondisi_iklim' => $rec->kondisi_iklim,
                    'keterangan' => $rec->keterangan,
                ];
            }
        }

        return Inertia::render('skpg', [
            'kecamatanItems' => $kecamatanItems,
            'calendarData' => array_values($annualCalendar),
            'summary' => $summary,
            'indicators' => Skpg::INDICATORS,
            'availableYears' => $availableYears,
            'availableMonths' => $availableMonths,
            'filters' => [
                'year' => $selectedYear,
                'month' => $selectedMonth,
                'indicator' => $selectedIndicator,
            ],
        ]);
    }

    /**
     * Display SKPG management and bulk input/edit in admin dashboard.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $selectedYear = (int) $request->query('year', Skpg::max('year') ?? now()->year);
        $selectedMonth = (int) $request->query('month', now()->month);
        $filterStatus = (string) $request->query('status', '');
        $filterIndicator = (string) $request->query('indicator', 'ikb');

        // Records for list view with creator
        $query = Skpg::with('creator:id,name')
            ->where('year', $selectedYear)
            ->where('month', $selectedMonth);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('kecamatan', 'like', "%{$search}%")
                    ->orWhere('kode_kecamatan', 'like', "%{$search}%")
                    ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        if ($filterStatus !== '') {
            $column = array_key_exists($filterIndicator, Skpg::INDICATORS) ? $filterIndicator : 'ikb';
            $validStatuses = in_array($column, Skpg::CLIMATE_INDICATORS, true)
                ? Skpg::CLIMATE_STATUS_LIST
                : Skpg::STATUS_LIST;

            if (in_array($filterStatus, $validStatuses, true)) {
                $query->where($column, $filterStatus);
            }
        }

        $records = $query->orderBy('kecamatan')->get();

        // 31 subdistricts mapped for bulk editor
        $existingRecords = Skpg::where('year', $selectedYear)
            ->where('month', $selectedMonth)
            ->get()
            ->keyBy(fn (Skpg $item) => Skpg::normalizeName($item->kecamatan));

        $bulkItems = [];
        foreach (Skpg::KECAMATAN_LIST as $kecName) {
            $norm = Skpg::normalizeName($kecName);
            $rec = $existingRecords->get($norm);

            $bulkItems[] = [
                'id' => $rec?->id,
                'kecamatan' => $kecName,
                'kode_kecamatan' => Skpg::KECAMATAN_CODES[$kecName] ?? '',
                'year' => $selectedYear,
                'month' => $selectedMonth,
                'ik' => $rec?->ik ?? Skpg::STATUS_AMAN,
                'ia' => $rec?->ia ?? Skpg::STATUS_AMAN,
                'ip' => $rec?->ip ?? Skpg::STATUS_AMAN,
                'ikb' => $rec?->ikb ?? Skpg::STATUS_AMAN,
                'potensi_kering' => $rec?->potensi_kering ?? Skpg::STATUS_AMAN,
                'potensi_basah' => $rec?->potensi_basah ?? Skpg::STATUS_AMAN,
                'kondisi_iklim' => $rec?->kondisi_iklim ?? Skpg::STATUS_AMAN,
                'keterangan' => $rec?->keterangan ?? '',
                'is_recorded' => $rec !== null,
            ];
        }

        // Summary statistics for selected month
        $allCurrentMonth = $existingRecords->values();
        $statistics = [
            'total_kecamatan' => count(Skpg::KECAMATAN_LIST),
            'recorded_count' => $allCurrentMonth->count(),
            'missing_count' => count(Skpg::KECAMATAN_LIST) - $allCurrentMonth->count(),
            'count_aman' => $allCurrentMonth->where('ikb', Skpg::STATUS_AMAN)->count(),
            'count_waspada' => $allCurrentMonth->where('ikb', Skpg::STATUS_WASPADA)->count(),
            'count_rentan' => $allCurrentMonth->where('ikb', Skpg::STATUS_RENTAN)->count(),
        ];

        $availableYears = Skpg::distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->toArray();

        if (! in_array((int) now()->year, $availableYears, true)) {
            $availableYears[] = (int) now()->year;
            rsort($availableYears);
        }

        return Inertia::render('skpg/index', [
            'records' => $records,
            'bulkItems' => $bulkItems,
            'kecamatanList' => Skpg::KECAMATAN_LIST,
            'indicators' => Skpg::INDICATORS,
            'statuses' => Skpg::STATUS_LIST,
            'climateStatuses' => Skpg::CLIMATE_STATUS_LIST,
            'statistics' => $statistics,
            'availableYears' => $availableYears,
            'filters' => [
                'search' => $search,
                'year' => $selectedYear,
                'month' => $selectedMonth,
                'status' => $filterStatus,
                'indicator' => $filterIndicator,
            ],
        ]);
    }

    /**
     * Store a single SKPG record.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kecamatan' => ['required', 'string', 'in:'.implode(',', Skpg::KECAMATAN_LIST)],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'ik' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'ia' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'ip' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'ikb' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'potensi_kering' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'potensi_basah' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'kondisi_iklim' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['kode_kecamatan'] = Skpg::KECAMATAN_CODES[$validated['kecamatan']] ?? null;
        $validated['created_by'] = $request->user()?->id;

        Skpg::updateOrCreate(
            [
                'kecamatan' => $validated['kecamatan'],
                'year' => $validated['year'],
                'month' => $validated['month'],
            ],
            $validated
        );

        return back()->with('success', "Data SKPG Kecamatan {$validated['kecamatan']} ({$this->getMonthName((int) $validated['month'])} {$validated['year']}) berhasil disimpan.");
    }

    /**
     * Update an existing SKPG record.
     */
    public function update(Request $request, Skpg $skpg): RedirectResponse
    {
        $validated = $request->validate([
            'ik' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'ia' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'ip' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'ikb' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'potensi_kering' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'potensi_basah' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'kondisi_iklim' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ]);

        $skpg->update($validated);

        return back()->with('success', "Data SKPG Kecamatan {$skpg->kecamatan} berhasil diperbarui.");
    }

    /**
     * Delete an existing SKPG record.
     */
    public function destroy(Skpg $skpg): RedirectResponse
    {
        $kecamatan = $skpg->kecamatan;
        $year = $skpg->year;
        $monthName = $this->getMonthName($skpg->month);

        $skpg->delete();

        return back()->with('success', "Data SKPG Kecamatan {$kecamatan} ({$monthName} {$year}) berhasil dihapus.");
    }

    /**
     * Bulk store/update SKPG records for all 31 subdistricts for a given month and year.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.kecamatan' => ['required', 'string'],
            'items.*.ik' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'items.*.ia' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'items.*.ip' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'items.*.ikb' => ['required', 'string', 'in:'.implode(',', Skpg::STATUS_LIST)],
            'items.*.potensi_kering' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'items.*.potensi_basah' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'items.*.kondisi_iklim' => ['required', 'string', 'in:'.implode(',', Skpg::CLIMATE_STATUS_LIST)],
            'items.*.keterangan' => ['nullable', 'string', 'max:1000'],
        ]);

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];
        $userId = $request->user()?->id;

        DB::transaction(function () use ($validated, $year, $month, $userId) {
            foreach ($validated['items'] as $item) {
                $kecName = $item['kecamatan'];
                $code = Skpg::KECAMATAN_CODES[$kecName] ?? null;

                Skpg::updateOrCreate(
                    [
                        'kecamatan' => $kecName,
                        'year' => $year,
                        'month' => $month,
                    ],
                    [
                        'kode_kecamatan' => $code,
                        'ik' => $item['ik'],
                        'ia' => $item['ia'],
                        'ip' => $item['ip'],
                        'ikb' => $item['ikb'],
                        'potensi_kering' => $item['potensi_kering'],
                        'potensi_basah' => $item['potensi_basah'],
                        'kondisi_iklim' => $item['kondisi_iklim'],
                        'keterangan' => $item['keterangan'] ?? null,
                        'created_by' => $userId,
                    ]
                );
            }
        });

        $monthName = $this->getMonthName($month);

        return back()->with('success', "Berhasil menyimpan dan memperbarui data bulk SKPG 31 kecamatan periode {$monthName} {$year}.");
    }

    /**
     * Download or serve the original Indramayu GeoJSON map file.
     */
    public function geojson(): BinaryFileResponse|JsonResponse
    {
        $filePath = base_path('storage/peta/indramayu_kecamatan.json');

        if (! file_exists($filePath)) {
            return response()->json(['error' => 'Peta kecamatan tidak ditemukan'], 404);
        }

        return response()->file($filePath, [
            'Content-Type' => 'application/geo+json',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * Helper to get Indonesian month name.
     */
    private function getMonthName(int $month): string
    {
        $months = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];

        return $months[$month] ?? "Bulan {$month}";
    }
}
