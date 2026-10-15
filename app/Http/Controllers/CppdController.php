<?php

namespace App\Http\Controllers;

use App\Models\Cppd;
use App\Models\CppdInitialStock;
use App\Services\IndramayuTerritoryService;
use App\Services\SimpleExcelService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CppdController extends Controller
{
    /**
     * Display public CPPD monitoring page with interactive map, summary cards, and recipient list.
     */
    public function publicIndex(Request $request): Response
    {
        $yearsFromTransactions = Cppd::pluck('tanggal')
            ->map(fn ($d) => (int) Carbon::parse($d)->year)
            ->unique();
        $yearsFromInitialStock = CppdInitialStock::pluck('year');
        $availableYears = $yearsFromTransactions
            ->merge($yearsFromInitialStock)
            ->filter()
            ->map(fn ($y) => (int) $y)
            ->unique()
            ->sortDesc()
            ->values()
            ->all();

        if (empty($availableYears)) {
            $availableYears = [(int) now()->year];
        }

        $requestedYear = $request->filled('year') ? (int) $request->query('year') : null;
        if ($requestedYear && ! in_array($requestedYear, $availableYears, true)) {
            $availableYears[] = $requestedYear;
            rsort($availableYears);
        }

        $defaultYear = $availableYears[0];
        $selectedYear = $requestedYear ?? $defaultYear;

        // Summary calculations
        $initialStockRecord = CppdInitialStock::where('year', $selectedYear)->first();
        $stokAwal = (float) ($initialStockRecord?->amount ?? 0);

        $totalPengadaan = (float) Cppd::whereYear('tanggal', $selectedYear)
            ->where('status', Cppd::STATUS_PENGADAAN)
            ->sum('jumlah');

        $totalPenyaluran = (float) Cppd::whereYear('tanggal', $selectedYear)
            ->where('status', Cppd::STATUS_PENYALURAN)
            ->sum('jumlah');

        $totalAddendum = (float) Cppd::whereYear('tanggal', $selectedYear)
            ->where('status', Cppd::STATUS_ADDENDUM)
            ->sum('jumlah');

        $stokAkhir = $stokAwal + $totalPengadaan + $totalAddendum - $totalPenyaluran;

        // Group penyaluran by kecamatan & desa for map markers and recipient list
        $penyaluranQuery = Cppd::whereYear('tanggal', $selectedYear)
            ->where('status', Cppd::STATUS_PENYALURAN)
            ->orderBy('tanggal', 'desc')
            ->get();

        $allCentroids = IndramayuTerritoryService::getCentroids();

        $recipientGroups = [];
        foreach ($penyaluranQuery as $row) {
            $kec = strtoupper(trim($row->kecamatan));
            $des = strtoupper(trim($row->desa));
            $key = $kec.'___'.$des;

            if (! isset($recipientGroups[$key])) {
                $coords = $allCentroids[$kec][$des] ?? null;

                $recipientGroups[$key] = [
                    'key' => $key,
                    'kecamatan' => $kec,
                    'desa' => $des,
                    'total_penyaluran' => 0.0,
                    'transaksi_count' => 0,
                    'latest_tanggal' => $row->tanggal->format('Y-m-d'),
                    'keterangan_list' => [],
                    'coordinates' => $coords,
                ];
            }

            $recipientGroups[$key]['total_penyaluran'] += (float) $row->jumlah;
            $recipientGroups[$key]['transaksi_count']++;
            if ($row->keterangan) {
                $recipientGroups[$key]['keterangan_list'][] = [
                    'tanggal' => $row->tanggal->format('Y-m-d'),
                    'jumlah' => (float) $row->jumlah,
                    'keterangan' => $row->keterangan,
                ];
            }
        }

        // Sort recipient villages descending by total penyaluran
        $recipientVillages = array_values($recipientGroups);
        usort($recipientVillages, fn ($a, $b) => $b['total_penyaluran'] <=> $a['total_penyaluran']);

        // Recent transactions log (all statuses)
        $recentTransactions = Cppd::whereYear('tanggal', $selectedYear)
            ->orderBy('tanggal', 'desc')
            ->limit(100)
            ->get()
            ->map(fn (Cppd $item) => [
                'id' => $item->id,
                'tanggal' => $item->tanggal->format('Y-m-d'),
                'status' => $item->status,
                'status_label' => Cppd::STATUSES[$item->status] ?? ucfirst($item->status),
                'kecamatan' => $item->kecamatan,
                'desa' => $item->desa,
                'jumlah' => (float) $item->jumlah,
                'keterangan' => $item->keterangan,
            ]);

        return Inertia::render('cppd', [
            'selectedYear' => $selectedYear,
            'availableYears' => $availableYears,
            'summary' => [
                'stok_awal' => $stokAwal,
                'total_pengadaan' => $totalPengadaan,
                'total_penyaluran' => $totalPenyaluran,
                'total_addendum' => $totalAddendum,
                'stok_akhir' => $stokAkhir,
                'initial_stock_note' => $initialStockRecord?->keterangan,
            ],
            'recipientVillages' => $recipientVillages,
            'recentTransactions' => $recentTransactions,
            'territory' => [
                'kecamatanList' => IndramayuTerritoryService::getKecamatanList(),
                'desaByKecamatan' => IndramayuTerritoryService::getDesaByKecamatan(),
            ],
        ]);
    }

    /**
     * Display admin CPPD CRUD management panel.
     */
    public function index(Request $request): Response
    {
        $yearsFromTransactions = Cppd::pluck('tanggal')
            ->map(fn ($d) => (int) Carbon::parse($d)->year)
            ->unique();
        $yearsFromInitialStock = CppdInitialStock::pluck('year');
        $availableYears = $yearsFromTransactions
            ->merge($yearsFromInitialStock)
            ->filter()
            ->map(fn ($y) => (int) $y)
            ->unique()
            ->sortDesc()
            ->values()
            ->all();

        if (empty($availableYears)) {
            $availableYears = [(int) now()->year];
        }

        $requestedYear = $request->filled('year') ? (int) $request->query('year') : null;
        if ($requestedYear && ! in_array($requestedYear, $availableYears, true)) {
            $availableYears[] = $requestedYear;
            rsort($availableYears);
        }

        $defaultYear = $availableYears[0];
        $selectedYear = $requestedYear ?? $defaultYear;

        $selectedStatus = $request->query('status');
        $selectedKecamatan = $request->query('kecamatan');
        $search = trim((string) $request->query('search', ''));

        // Query transactions
        $query = Cppd::with('createdBy:id,name');

        if ($selectedYear) {
            $query->whereYear('tanggal', $selectedYear);
        }

        if ($selectedStatus && in_array($selectedStatus, [Cppd::STATUS_PENGADAAN, Cppd::STATUS_PENYALURAN, Cppd::STATUS_ADDENDUM], true)) {
            $query->where('status', $selectedStatus);
        }

        if ($selectedKecamatan) {
            $query->where('kecamatan', strtoupper($selectedKecamatan));
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('desa', 'like', "%{$search}%")
                    ->orWhere('kecamatan', 'like', "%{$search}%")
                    ->orWhere('keterangan', 'like', "%{$search}%")
                    ->orWhere('jumlah', 'like', "%{$search}%");
            });
        }

        $records = $query->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Cppd $item) => [
                'id' => $item->id,
                'tanggal' => $item->tanggal->format('Y-m-d'),
                'status' => $item->status,
                'status_label' => Cppd::STATUSES[$item->status] ?? ucfirst($item->status),
                'kecamatan' => $item->kecamatan,
                'desa' => $item->desa,
                'jumlah' => (float) $item->jumlah,
                'keterangan' => $item->keterangan,
                'created_by_name' => $item->createdBy?->name,
                'created_at' => $item->created_at?->format('d/m/Y H:i'),
            ]);

        // Initial stock for selected year
        $initialStockRecord = CppdInitialStock::where('year', $selectedYear)->first();
        $stokAwal = (float) ($initialStockRecord?->amount ?? 0);

        // Summaries for selected year
        $totalPengadaan = (float) Cppd::whereYear('tanggal', $selectedYear)
            ->where('status', Cppd::STATUS_PENGADAAN)
            ->sum('jumlah');

        $totalPenyaluran = (float) Cppd::whereYear('tanggal', $selectedYear)
            ->where('status', Cppd::STATUS_PENYALURAN)
            ->sum('jumlah');

        $totalAddendum = (float) Cppd::whereYear('tanggal', $selectedYear)
            ->where('status', Cppd::STATUS_ADDENDUM)
            ->sum('jumlah');

        $stokAkhir = $stokAwal + $totalPengadaan + $totalAddendum - $totalPenyaluran;

        return Inertia::render('cppd/index', [
            'records' => $records,
            'selectedYear' => $selectedYear,
            'availableYears' => $availableYears,
            'filters' => [
                'status' => $selectedStatus,
                'kecamatan' => $selectedKecamatan,
                'search' => $search,
            ],
            'summary' => [
                'stok_awal' => $stokAwal,
                'total_pengadaan' => $totalPengadaan,
                'total_penyaluran' => $totalPenyaluran,
                'total_addendum' => $totalAddendum,
                'stok_akhir' => $stokAkhir,
            ],
            'initialStock' => $initialStockRecord ? [
                'id' => $initialStockRecord->id,
                'year' => $initialStockRecord->year,
                'amount' => (float) $initialStockRecord->amount,
                'keterangan' => $initialStockRecord->keterangan,
            ] : null,
            'territory' => [
                'kecamatanList' => IndramayuTerritoryService::getKecamatanList(),
                'desaByKecamatan' => IndramayuTerritoryService::getDesaByKecamatan(),
            ],
            'statuses' => Cppd::STATUSES,
        ]);
    }

    /**
     * Store a newly created CPPD record.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'string', 'in:pengadaan,penyaluran,addendum'],
            'kecamatan' => ['required', 'string', 'max:100'],
            'desa' => ['required', 'string', 'max:100'],
            'jumlah' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['kecamatan'] = strtoupper(trim($validated['kecamatan']));
        $validated['desa'] = strtoupper(trim($validated['desa']));
        $validated['status'] = Cppd::normalizeStatus($validated['status']);
        $validated['created_by'] = Auth::id();

        Cppd::create($validated);

        return redirect()->back()->with('success', 'Data CPPD berhasil ditambahkan.');
    }

    /**
     * Update an existing CPPD record.
     */
    public function update(Request $request, Cppd $cppd): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal' => ['required', 'date'],
            'status' => ['required', 'string', 'in:pengadaan,penyaluran,addendum'],
            'kecamatan' => ['required', 'string', 'max:100'],
            'desa' => ['required', 'string', 'max:100'],
            'jumlah' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'keterangan' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['kecamatan'] = strtoupper(trim($validated['kecamatan']));
        $validated['desa'] = strtoupper(trim($validated['desa']));
        $validated['status'] = Cppd::normalizeStatus($validated['status']);

        $cppd->update($validated);

        return redirect()->back()->with('success', 'Data CPPD berhasil diperbarui.');
    }

    /**
     * Delete an existing CPPD record.
     */
    public function destroy(Cppd $cppd): RedirectResponse
    {
        $cppd->delete();

        return redirect()->back()->with('success', 'Data CPPD berhasil dihapus.');
    }

    /**
     * Set or update initial stock for a specific year.
     */
    public function setInitialStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2099'],
            'amount' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'keterangan' => ['nullable', 'string', 'max:500'],
        ]);

        CppdInitialStock::updateOrCreate(
            ['year' => (int) $validated['year']],
            [
                'amount' => $validated['amount'],
                'keterangan' => $validated['keterangan'] ?? null,
                'created_by' => Auth::id(),
            ]
        );

        return redirect()->back()->with('success', 'Stok awal tahun '.$validated['year'].' berhasil disimpan.');
    }

    /**
     * Export CPPD transactions history to Excel (.xlsx) for a given year.
     */
    public function exportExcel(Request $request, SimpleExcelService $excelService): SymfonyResponse
    {
        $year = (int) $request->query('year', now()->year);

        $initialStockRecord = CppdInitialStock::where('year', $year)->first();
        $stokAwal = (float) ($initialStockRecord?->amount ?? 0);

        $totalPengadaan = (float) Cppd::whereYear('tanggal', $year)
            ->where('status', Cppd::STATUS_PENGADAAN)
            ->sum('jumlah');

        $totalPenyaluran = (float) Cppd::whereYear('tanggal', $year)
            ->where('status', Cppd::STATUS_PENYALURAN)
            ->sum('jumlah');

        $totalAddendum = (float) Cppd::whereYear('tanggal', $year)
            ->where('status', Cppd::STATUS_ADDENDUM)
            ->sum('jumlah');

        $stokAkhir = $stokAwal + $totalPengadaan + $totalAddendum - $totalPenyaluran;

        $summary = [
            'stok_awal' => $stokAwal,
            'total_pengadaan' => $totalPengadaan,
            'total_penyaluran' => $totalPenyaluran,
            'total_addendum' => $totalAddendum,
            'stok_akhir' => $stokAkhir,
        ];

        $transactions = Cppd::whereYear('tanggal', $year)
            ->orderBy('tanggal', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn (Cppd $item) => [
                'id' => $item->id,
                'tanggal' => $item->tanggal->format('Y-m-d'),
                'status' => $item->status,
                'status_label' => Cppd::STATUSES[$item->status] ?? ucfirst($item->status),
                'kecamatan' => $item->kecamatan,
                'desa' => $item->desa,
                'jumlah' => (float) $item->jumlah,
                'keterangan' => $item->keterangan,
            ])
            ->all();

        $xlsx = $excelService->exportCppdXlsx($transactions, $year, $summary);
        $filename = "Riwayat_Transaksi_CPPD_Indramayu_{$year}.xlsx";

        return response($xlsx, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
