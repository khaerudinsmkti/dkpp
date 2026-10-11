<?php

namespace App\Http\Controllers;

use App\Models\FoodBalance;
use App\Models\FoodBalanceCommodity;
use App\Services\SimpleExcelService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class FoodBalanceController extends Controller
{
    /**
     * Display a listing of monthly food balances for admin.
     */
    public function index(Request $request): Response
    {
        $currentDate = now();
        $latestRecord = FoodBalance::orderByDesc('year')->orderByDesc('month')->first();

        $defaultYear = $latestRecord?->year ?? (int) $currentDate->format('Y');
        $defaultMonth = $latestRecord?->month ?? (int) $currentDate->format('n');

        $year = (int) $request->query('year', $defaultYear);
        $month = (int) $request->query('month', $defaultMonth);

        if ($month < 1 || $month > 12) {
            $month = (int) $currentDate->format('n');
        }
        if ($year < 2020 || $year > 2035) {
            $year = (int) $currentDate->format('Y');
        }

        $commodities = FoodBalanceCommodity::where('is_active', true)
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $existingBalances = FoodBalance::where('year', $year)
            ->where('month', $month)
            ->get()
            ->keyBy('food_balance_commodity_id');

        $rows = $commodities->map(function (FoodBalanceCommodity $commodity) use ($existingBalances, $year, $month): array {
            $record = $existingBalances->get($commodity->id);

            $hasRecord = $record !== null;
            $produksi = $hasRecord ? (float) $record->produksi : null;
            $ketersediaan = $hasRecord ? (float) $record->ketersediaan : null;
            $kebutuhan = $hasRecord ? (float) $record->kebutuhan : null;

            $selisih = null;
            $keterangan = 'not_recorded';

            if ($hasRecord) {
                $selisih = round($ketersediaan - $kebutuhan, 2);
                $keterangan = $selisih < 0 ? 'Defisit' : 'Surplus';
            }

            return [
                'food_balance_commodity_id' => $commodity->id,
                'commodity_name' => $commodity->name,
                'commodity_slug' => $commodity->slug,
                'unit' => $commodity->unit,
                'order' => $commodity->order,
                'food_balance_id' => $record?->id,
                'year' => $year,
                'month' => $month,
                'produksi' => $produksi,
                'ketersediaan' => $ketersediaan,
                'kebutuhan' => $kebutuhan,
                'selisih' => $selisih,
                'keterangan' => $keterangan,
                'notes' => $record?->notes,
                'is_recorded' => $hasRecord,
            ];
        });

        // Statistics
        $totalCommodities = $commodities->count();
        $recordedRows = $rows->where('is_recorded', true);
        $recordedCount = $recordedRows->count();
        $surplusCount = $recordedRows->where('keterangan', 'Surplus')->count();
        $defisitCount = $recordedRows->where('keterangan', 'Defisit')->count();

        $totalProduksi = (float) $recordedRows->sum('produksi');
        $totalKetersediaan = (float) $recordedRows->sum('ketersediaan');
        $totalKebutuhan = (float) $recordedRows->sum('kebutuhan');
        $totalSelisih = round($totalKetersediaan - $totalKebutuhan, 2);

        // Filters
        $search = (string) $request->query('search', '');
        $statusFilter = (string) $request->query('status', 'all');

        $filteredRows = $rows->filter(function (array $item) use ($search, $statusFilter): bool {
            if ($search !== '' && ! str_contains(strtolower($item['commodity_name']), strtolower($search))) {
                return false;
            }
            if ($statusFilter === 'surplus' && $item['keterangan'] !== 'Surplus') {
                return false;
            }
            if ($statusFilter === 'defisit' && $item['keterangan'] !== 'Defisit') {
                return false;
            }
            if ($statusFilter === 'unrecorded' && $item['is_recorded']) {
                return false;
            }

            return true;
        })->values();

        // Distinct years in DB
        $dbYears = FoodBalance::select('year')->distinct()->pluck('year')->toArray();
        $currentYearInt = (int) $currentDate->format('Y');
        $availableYears = array_values(array_unique(array_merge([$currentYearInt - 1, $currentYearInt, $currentYearInt + 1], $dbYears)));
        sort($availableYears);

        return Inertia::render('food-balances/index', [
            'items' => $filteredRows,
            'allItems' => $rows,
            'commodities' => $commodities,
            'selectedYear' => $year,
            'selectedMonth' => $month,
            'availableYears' => $availableYears,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'year' => $year,
                'month' => $month,
            ],
            'statistics' => [
                'total_commodities' => $totalCommodities,
                'recorded_count' => $recordedCount,
                'surplus_count' => $surplusCount,
                'defisit_count' => $defisitCount,
                'total_produksi' => $totalProduksi,
                'total_ketersediaan' => $totalKetersediaan,
                'total_kebutuhan' => $totalKebutuhan,
                'total_selisih' => $totalSelisih,
            ],
        ]);
    }

    /**
     * Store or update a single food balance item.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'food_balance_commodity_id' => ['required', 'exists:food_balance_commodities,id'],
            'year' => ['required', 'integer', 'min:2020', 'max:2035'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'produksi' => ['required', 'numeric', 'min:0'],
            'ketersediaan' => ['required', 'numeric', 'min:0'],
            'kebutuhan' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $ketersediaan = (float) $validated['ketersediaan'];
        $kebutuhan = (float) $validated['kebutuhan'];
        $selisih = round($ketersediaan - $kebutuhan, 2);
        $keterangan = $selisih < 0 ? 'Defisit' : 'Surplus';
        $periodDate = sprintf('%04d-%02d-01', $validated['year'], $validated['month']);

        FoodBalance::updateOrCreate(
            [
                'food_balance_commodity_id' => $validated['food_balance_commodity_id'],
                'year' => $validated['year'],
                'month' => $validated['month'],
            ],
            [
                'period_date' => $periodDate,
                'produksi' => (float) $validated['produksi'],
                'ketersediaan' => $ketersediaan,
                'kebutuhan' => $kebutuhan,
                'selisih' => $selisih,
                'keterangan' => $keterangan,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]
        );

        $commodity = FoodBalanceCommodity::find($validated['food_balance_commodity_id']);

        return back()->with('success', "Data neraca '{$commodity?->name}' periode {$validated['month']}/{$validated['year']} berhasil disimpan.");
    }

    /**
     * Bulk store multiple food balance records for the given month and year.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2020', 'max:2035'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'items' => ['required', 'array'],
            'items.*.food_balance_commodity_id' => ['required', 'exists:food_balance_commodities,id'],
            'items.*.produksi' => ['nullable', 'numeric', 'min:0'],
            'items.*.ketersediaan' => ['nullable', 'numeric', 'min:0'],
            'items.*.kebutuhan' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];
        $periodDate = sprintf('%04d-%02d-01', $year, $month);
        $userId = $request->user()?->id;

        $savedCount = 0;

        DB::transaction(function () use ($validated, $year, $month, $periodDate, $userId, &$savedCount) {
            foreach ($validated['items'] as $item) {
                // Only save if at least one numeric field is entered
                $hasData = (isset($item['produksi']) && $item['produksi'] !== '')
                    || (isset($item['ketersediaan']) && $item['ketersediaan'] !== '')
                    || (isset($item['kebutuhan']) && $item['kebutuhan'] !== '');

                if (! $hasData) {
                    continue;
                }

                $produksi = (float) ($item['produksi'] ?? 0);
                $ketersediaan = (float) ($item['ketersediaan'] ?? 0);
                $kebutuhan = (float) ($item['kebutuhan'] ?? 0);
                $selisih = round($ketersediaan - $kebutuhan, 2);
                $keterangan = $selisih < 0 ? 'Defisit' : 'Surplus';

                FoodBalance::updateOrCreate(
                    [
                        'food_balance_commodity_id' => $item['food_balance_commodity_id'],
                        'year' => $year,
                        'month' => $month,
                    ],
                    [
                        'period_date' => $periodDate,
                        'produksi' => $produksi,
                        'ketersediaan' => $ketersediaan,
                        'kebutuhan' => $kebutuhan,
                        'selisih' => $selisih,
                        'keterangan' => $keterangan,
                        'notes' => $item['notes'] ?? null,
                        'created_by' => $userId,
                    ]
                );

                $savedCount++;
            }
        });

        return back()->with('success', "Berhasil menyimpan {$savedCount} baris data neraca pangan bulanan.");
    }

    /**
     * Remove the specified food balance record.
     */
    public function destroy(FoodBalance $foodBalance): RedirectResponse
    {
        $commodityName = $foodBalance->commodity?->name ?? 'Komoditas';
        $period = "{$foodBalance->month}/{$foodBalance->year}";

        $foodBalance->delete();

        return back()->with('success', "Data neraca {$commodityName} periode {$period} berhasil dihapus.");
    }

    /**
     * Download template Excel or CSV for food balance.
     */
    public function downloadTemplate(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);
        $format = strtolower((string) $request->query('format', 'xlsx'));

        $commodities = FoodBalanceCommodity::where('is_active', true)
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $filenameBase = "format_neraca_pangan_{$year}_{$month}";

        if ($format === 'csv') {
            $csv = $excelService->generateFoodBalanceCsvTemplate($commodities, $year, $month);

            return response($csv, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filenameBase}.csv\"",
            ]);
        }

        $xlsx = $excelService->generateFoodBalanceXlsxTemplate($commodities, $year, $month);

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filenameBase}.xlsx\"",
        ]);
    }

    /**
     * Export current month food balance to Excel.
     */
    public function exportExcel(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $year = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        $commodities = FoodBalanceCommodity::where('is_active', true)
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $existing = FoodBalance::where('year', $year)
            ->where('month', $month)
            ->get()
            ->keyBy('food_balance_commodity_id');

        $rows = [];
        foreach ($commodities as $comm) {
            $record = $existing->get($comm->id);
            $rows[] = [
                'commodity_name' => $comm->name,
                'unit' => $comm->unit,
                'produksi' => $record ? (float) $record->produksi : 0,
                'ketersediaan' => $record ? (float) $record->ketersediaan : 0,
                'kebutuhan' => $record ? (float) $record->kebutuhan : 0,
                'notes' => $record?->notes ?? '',
            ];
        }

        $xlsx = $excelService->exportFoodBalanceXlsx($rows, $year, $month);
        $filename = "neraca_pangan_indramayu_{$year}_{$month}.xlsx";

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Import food balance from uploaded Excel or CSV.
     */
    public function import(Request $request, SimpleExcelService $excelService): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'year' => ['required', 'integer', 'min:2020', 'max:2035'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
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
            return back()->withErrors(['file' => 'Gagal membaca berkas: ' . $e->getMessage()]);
        }

        $commodities = FoodBalanceCommodity::where('is_active', true)
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $matchedResult = $excelService->matchFoodBalanceRows($rawRows, $commodities);
        $matchedRows = $matchedResult['matched'];

        if (empty($matchedRows)) {
            return back()->withErrors(['file' => 'Tidak ada baris data komoditas yang cocok ditemukan dalam berkas Excel. Pastikan nama komoditas atau urutan nomor sesuai template.']);
        }

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];
        $periodDate = sprintf('%04d-%02d-01', $year, $month);
        $userId = $request->user()?->id;

        $savedCount = 0;

        DB::transaction(function () use ($matchedRows, $year, $month, $periodDate, $userId, &$savedCount) {
            foreach ($matchedRows as $row) {
                FoodBalance::updateOrCreate(
                    [
                        'food_balance_commodity_id' => $row['food_balance_commodity_id'],
                        'year' => $year,
                        'month' => $month,
                    ],
                    [
                        'period_date' => $periodDate,
                        'produksi' => $row['produksi'],
                        'ketersediaan' => $row['ketersediaan'],
                        'kebutuhan' => $row['kebutuhan'],
                        'selisih' => $row['selisih'],
                        'keterangan' => $row['keterangan'],
                        'notes' => $row['notes'],
                        'created_by' => $userId,
                    ]
                );
                $savedCount++;
            }
        });

        return back()->with('success', "Berhasil mengimpor {$savedCount} baris data neraca pangan periode {$month}/{$year}.");
    }

    /**
     * Display public page for Neraca Pangan Bulanan.
     */
    public function publicIndex(Request $request): Response
    {
        $currentDate = now();
        $latestRecord = FoodBalance::orderByDesc('year')->orderByDesc('month')->first();

        $defaultYear = $latestRecord?->year ?? (int) $currentDate->format('Y');
        $defaultMonth = $latestRecord?->month ?? (int) $currentDate->format('n');

        $year = (int) $request->query('year', $defaultYear);
        $month = (int) $request->query('month', $defaultMonth);

        if ($month < 1 || $month > 12) {
            $month = (int) $currentDate->format('n');
        }
        if ($year < 2020 || $year > 2035) {
            $year = (int) $currentDate->format('Y');
        }

        $commodities = FoodBalanceCommodity::where('is_active', true)
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $existingBalances = FoodBalance::where('year', $year)
            ->where('month', $month)
            ->get()
            ->keyBy('food_balance_commodity_id');

        $items = $commodities->map(function (FoodBalanceCommodity $commodity) use ($existingBalances, $year, $month): array {
            $record = $existingBalances->get($commodity->id);
            $hasRecord = $record !== null;

            $produksi = $hasRecord ? (float) $record->produksi : null;
            $ketersediaan = $hasRecord ? (float) $record->ketersediaan : null;
            $kebutuhan = $hasRecord ? (float) $record->kebutuhan : null;

            $selisih = null;
            $keterangan = 'Belum Ada Data';

            if ($hasRecord) {
                $selisih = round($ketersediaan - $kebutuhan, 2);
                $keterangan = $selisih < 0 ? 'Defisit' : 'Surplus';
            }

            return [
                'id' => $commodity->id,
                'name' => $commodity->name,
                'slug' => $commodity->slug,
                'unit' => $commodity->unit,
                'order' => $commodity->order,
                'produksi' => $produksi,
                'ketersediaan' => $ketersediaan,
                'kebutuhan' => $kebutuhan,
                'selisih' => $selisih,
                'keterangan' => $keterangan,
                'notes' => $record?->notes,
                'is_recorded' => $hasRecord,
            ];
        });

        // Statistics
        $recordedItems = $items->where('is_recorded', true);
        $surplusCount = $recordedItems->where('keterangan', 'Surplus')->count();
        $defisitCount = $recordedItems->where('keterangan', 'Defisit')->count();
        $totalProduksi = (float) $recordedItems->sum('produksi');
        $totalKetersediaan = (float) $recordedItems->sum('ketersediaan');
        $totalKebutuhan = (float) $recordedItems->sum('kebutuhan');
        $totalSelisih = round($totalKetersediaan - $totalKebutuhan, 2);

        // Distinct years in DB
        $dbYears = FoodBalance::select('year')->distinct()->pluck('year')->toArray();
        $currentYearInt = (int) $currentDate->format('Y');
        $availableYears = array_values(array_unique(array_merge([$currentYearInt - 1, $currentYearInt, $currentYearInt + 1], $dbYears)));
        sort($availableYears);

        return Inertia::render('neraca-pangan', [
            'items' => $items,
            'selectedYear' => $year,
            'selectedMonth' => $month,
            'availableYears' => $availableYears,
            'statistics' => [
                'total_commodities' => $commodities->count(),
                'recorded_count' => $recordedItems->count(),
                'surplus_count' => $surplusCount,
                'defisit_count' => $defisitCount,
                'total_produksi' => $totalProduksi,
                'total_ketersediaan' => $totalKetersediaan,
                'total_kebutuhan' => $totalKebutuhan,
                'total_selisih' => $totalSelisih,
            ],
        ]);
    }
}

