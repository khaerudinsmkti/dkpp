<?php

namespace App\Http\Controllers;

use App\Models\RealisasiBulanan;
use App\Models\RealisasiPergeseran;
use App\Models\RealisasiPergeseranItem;
use App\Models\RealisasiRekening;
use App\Models\RealisasiSubKegiatan;
use App\Services\RkaPdfParserService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

class RealisasiAnggaranController extends Controller
{
    public function index(Request $request): Response
    {
        $availableYears = RealisasiSubKegiatan::select('tahun_anggaran')
            ->distinct()
            ->orderByDesc('tahun_anggaran')
            ->pluck('tahun_anggaran')
            ->map(fn ($y) => (int) $y)
            ->values()
            ->all();

        $currentYear = (int) date('Y');
        $selectedYear = $request->integer('tahun')
            ?: ($availableYears[0] ?? $currentYear);

        if (! in_array($selectedYear, $availableYears, true)) {
            $availableYears = array_values(array_unique(array_merge([$selectedYear, $currentYear, $currentYear + 1], $availableYears)));
            rsort($availableYears);
        }

        $subKegiatans = RealisasiSubKegiatan::with(['rekenings.bulanans'])
            ->where('tahun_anggaran', $selectedYear)
            ->orderBy('kode_sub_kegiatan')
            ->orderBy('id')
            ->get()
            ->map(function (RealisasiSubKegiatan $sk): array {
                $monthlyTotals = array_fill(1, 12, 0.0);
                $monthlyAkbTotals = array_fill(1, 12, 0.0);
                $totalPagu = 0.0;
                $totalPaguMurni = 0.0;
                $totalRealisasi = 0.0;
                $totalAkb = 0.0;

                $rekenings = $sk->rekenings->map(function (RealisasiRekening $rek) use (&$monthlyTotals, &$monthlyAkbTotals, &$totalPagu, &$totalPaguMurni, &$totalRealisasi, &$totalAkb): array {
                    $bulanMap = array_fill(1, 12, 0.0);
                    $akbMap = array_fill(1, 12, 0.0);
                    foreach ($rek->bulanans as $bln) {
                        $m = (int) $bln->bulan;
                        if ($m >= 1 && $m <= 12) {
                            $bulanMap[$m] = (float) $bln->nominal;
                            $akbMap[$m] = (float) ($bln->akb ?? 0);
                            $monthlyTotals[$m] += (float) $bln->nominal;
                            $monthlyAkbTotals[$m] += (float) ($bln->akb ?? 0);
                        }
                    }

                    $pagu = (float) $rek->pagu_anggaran;
                    $paguMurni = $rek->pagu_murni !== null ? (float) $rek->pagu_murni : $pagu;
                    $realisasi = array_sum($bulanMap);
                    $rekAkb = array_sum($akbMap);
                    $sisa = $pagu - $realisasi;
                    $persen = $pagu > 0 ? round(($realisasi / $pagu) * 100, 2) : 0.0;

                    $totalPagu += $pagu;
                    $totalPaguMurni += $paguMurni;
                    $totalRealisasi += $realisasi;
                    $totalAkb += $rekAkb;

                    return [
                        'id' => $rek->id,
                        'kode_rekening' => $rek->kode_rekening,
                        'uraian' => $rek->uraian,
                        'jenis_pencairan' => strtoupper((string) ($rek->jenis_pencairan ?: 'GU')),
                        'pagu_anggaran' => $pagu,
                        'pagu_murni' => $paguMurni,
                        'selisih_perubahan' => $pagu - $paguMurni,
                        'urutan' => (int) $rek->urutan,
                        'bulanan' => $bulanMap,
                        'akb_bulanan' => $akbMap,
                        'total_akb' => $rekAkb,
                        'total_realisasi' => $realisasi,
                        'sisa' => $sisa,
                        'persen' => $persen,
                    ];
                })->values()->all();

                $effectivePagu = $totalPagu > 0 ? $totalPagu : (float) $sk->total_anggaran;
                $sisaSk = $effectivePagu - $totalRealisasi;
                $persenSk = $effectivePagu > 0 ? round(($totalRealisasi / $effectivePagu) * 100, 2) : 0.0;

                return [
                    'id' => $sk->id,
                    'tahun_anggaran' => (int) $sk->tahun_anggaran,
                    'urusan' => $sk->urusan,
                    'bidang' => $sk->bidang,
                    'unit_organisasi' => $sk->unit_organisasi,
                    'sub_unit_organisasi' => $sk->sub_unit_organisasi,
                    'program' => $sk->program,
                    'kegiatan' => $sk->kegiatan,
                    'kode_sub_kegiatan' => $sk->kode_sub_kegiatan,
                    'nama_sub_kegiatan' => $sk->nama_sub_kegiatan,
                    'sumber_pendanaan' => $sk->sumber_pendanaan,
                    'lokasi' => $sk->lokasi,
                    'waktu_pelaksanaan' => $sk->waktu_pelaksanaan,
                    'keterangan' => $sk->keterangan,
                    'total_anggaran' => $effectivePagu,
                    'total_pagu_murni' => $totalPaguMurni,
                    'selisih_perubahan' => $effectivePagu - $totalPaguMurni,
                    'total_akb' => $totalAkb,
                    'total_realisasi' => $totalRealisasi,
                    'total_sisa' => $sisaSk,
                    'persen_realisasi' => $persenSk,
                    'monthly_totals' => $monthlyTotals,
                    'monthly_akb_totals' => $monthlyAkbTotals,
                    'rka_file_url' => $sk->rka_file_path ? '/'.ltrim($sk->rka_file_path, '/') : null,
                    'rekenings' => $rekenings,
                ];
            })->values()->all();

        $pergeserans = RealisasiPergeseran::with('items')
            ->where('tahun_anggaran', $selectedYear)
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get()
            ->map(function (RealisasiPergeseran $p): array {
                return [
                    'id' => $p->id,
                    'tahun_anggaran' => (int) $p->tahun_anggaran,
                    'nama_tahap' => $p->nama_tahap,
                    'jenis' => $p->jenis,
                    'tanggal' => $p->tanggal?->format('Y-m-d') ?? '',
                    'nomor_dokumen' => $p->nomor_dokumen,
                    'keterangan' => $p->keterangan,
                    'total_sebelum' => (float) $p->total_sebelum,
                    'total_sesudah' => (float) $p->total_sesudah,
                    'total_selisih' => (float) $p->total_selisih,
                    'items' => $p->items->map(fn (RealisasiPergeseranItem $it) => [
                        'id' => $it->id,
                        'realisasi_sub_kegiatan_id' => $it->realisasi_sub_kegiatan_id,
                        'kode_sub_kegiatan' => $it->kode_sub_kegiatan,
                        'nama_sub_kegiatan' => $it->nama_sub_kegiatan,
                        'kode_rekening' => $it->kode_rekening,
                        'uraian' => $it->uraian,
                        'pagu_sebelum' => (float) $it->pagu_sebelum,
                        'pagu_sesudah' => (float) $it->pagu_sesudah,
                        'selisih' => (float) $it->selisih,
                    ])->values()->all(),
                ];
            })->values()->all();

        return Inertia::render('realisasi-anggaran/index', [
            'selectedYear' => $selectedYear,
            'availableYears' => $availableYears,
            'subKegiatans' => $subKegiatans,
            'pergeserans' => $pergeserans,
        ]);
    }

    /**
     * Upload sementara & parse PDF RKA-Belanja SIPD-RI untuk ditampilkan sebagai preview verifikasi.
     */
    public function parseRkaPdf(Request $request, RkaPdfParserService $parserService): JsonResponse
    {
        $request->validate([
            'rka_pdf' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ], [
            'rka_pdf.required' => 'Silakan pilih file PDF RKA-Belanja terlebih dahulu.',
            'rka_pdf.mimes' => 'File yang diupload harus berformat PDF.',
            'rka_pdf.max' => 'Ukuran file PDF maksimal 10 MB.',
        ]);

        try {
            $file = $request->file('rka_pdf');
            $parsed = $parserService->parse($file->getRealPath());

            return response()->json([
                'success' => true,
                'data' => $parsed,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membaca PDF RKA: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Simpan Sub Kegiatan & daftar Kode Rekening hasil upload RKA (atau input manual).
     * Jika Tahun + Kode Sub Kegiatan sudah ada, lakukan update pagu & merge kode rekening
     * tanpa menghapus data realisasi bulanan yang sudah terinput.
     */
    public function storeSubKegiatan(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2100'],
            'urusan' => ['nullable', 'string', 'max:255'],
            'bidang' => ['nullable', 'string', 'max:255'],
            'unit_organisasi' => ['nullable', 'string', 'max:255'],
            'sub_unit_organisasi' => ['nullable', 'string', 'max:255'],
            'program' => ['nullable', 'string', 'max:500'],
            'kegiatan' => ['nullable', 'string', 'max:2000'],
            'kode_sub_kegiatan' => ['required', 'string', 'max:100'],
            'nama_sub_kegiatan' => ['required', 'string', 'max:2000'],
            'sumber_pendanaan' => ['nullable', 'string', 'max:255'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'waktu_pelaksanaan' => ['nullable', 'string', 'max:150'],
            'keterangan' => ['nullable', 'string', 'max:5000'],
            'rka_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'rekenings' => ['required', 'array', 'min:1'],
            'rekenings.*.kode_rekening' => ['required', 'string', 'max:80'],
            'rekenings.*.uraian' => ['required', 'string', 'max:500'],
            'rekenings.*.jenis_pencairan' => ['nullable', 'in:GU,LS'],
            'rekenings.*.pagu_anggaran' => ['required', 'numeric', 'min:0'],
        ], [
            'kode_sub_kegiatan.required' => 'Kode Sub Kegiatan wajib diisi.',
            'nama_sub_kegiatan.required' => 'Nama Sub Kegiatan wajib diisi.',
            'rekenings.required' => 'Minimal 1 Kode Rekening Belanja wajib tersedia.',
        ]);

        $rkaFilePath = null;
        if ($request->hasFile('rka_pdf')) {
            $file = $request->file('rka_pdf');
            $dir = public_path('uploads/rka-pdf');
            if (! File::exists($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            $safeKode = preg_replace('/[^A-Za-z0-9\-_]/', '_', $validated['kode_sub_kegiatan']);
            $filename = 'rka_'.$validated['tahun_anggaran'].'_'.$safeKode.'_'.date('YmdHis').'.pdf';
            $file->move($dir, $filename);
            $rkaFilePath = 'uploads/rka-pdf/'.$filename;
        }

        $totalAnggaran = array_reduce(
            $validated['rekenings'],
            fn (float $carry, array $r) => $carry + (float) $r['pagu_anggaran'],
            0.0
        );

        DB::transaction(function () use ($validated, $rkaFilePath, $totalAnggaran): void {
            $subKegiatan = RealisasiSubKegiatan::updateOrCreate(
                [
                    'tahun_anggaran' => (int) $validated['tahun_anggaran'],
                    'kode_sub_kegiatan' => trim($validated['kode_sub_kegiatan']),
                ],
                [
                    'urusan' => $validated['urusan'] ?? null,
                    'bidang' => $validated['bidang'] ?? null,
                    'unit_organisasi' => $validated['unit_organisasi'] ?? null,
                    'sub_unit_organisasi' => $validated['sub_unit_organisasi'] ?? null,
                    'program' => $validated['program'] ?? null,
                    'kegiatan' => $validated['kegiatan'] ?? null,
                    'nama_sub_kegiatan' => trim($validated['nama_sub_kegiatan']),
                    'sumber_pendanaan' => $validated['sumber_pendanaan'] ?? null,
                    'lokasi' => $validated['lokasi'] ?? null,
                    'waktu_pelaksanaan' => $validated['waktu_pelaksanaan'] ?? null,
                    'keterangan' => isset($validated['keterangan']) && trim($validated['keterangan']) !== '' ? trim($validated['keterangan']) : null,
                    'total_anggaran' => $totalAnggaran,
                    ...($rkaFilePath ? ['rka_file_path' => $rkaFilePath] : []),
                ]
            );

            $keptCodes = [];
            $urutan = 1;
            foreach ($validated['rekenings'] as $rekData) {
                $kodeRek = trim($rekData['kode_rekening']);
                $keptCodes[] = $kodeRek;

                $existingRek = RealisasiRekening::where('realisasi_sub_kegiatan_id', $subKegiatan->id)
                    ->where('kode_rekening', $kodeRek)
                    ->first();

                if ($existingRek) {
                    $existingRek->update([
                        'uraian' => trim($rekData['uraian']),
                        'jenis_pencairan' => strtoupper((string) ($rekData['jenis_pencairan'] ?? 'GU')),
                        'pagu_anggaran' => (float) $rekData['pagu_anggaran'],
                        'pagu_murni' => $existingRek->pagu_murni ?? (float) $rekData['pagu_anggaran'],
                        'urutan' => $urutan++,
                    ]);
                } else {
                    RealisasiRekening::create([
                        'realisasi_sub_kegiatan_id' => $subKegiatan->id,
                        'kode_rekening' => $kodeRek,
                        'uraian' => trim($rekData['uraian']),
                        'jenis_pencairan' => strtoupper((string) ($rekData['jenis_pencairan'] ?? 'GU')),
                        'pagu_anggaran' => (float) $rekData['pagu_anggaran'],
                        'pagu_murni' => (float) $rekData['pagu_anggaran'],
                        'urutan' => $urutan++,
                    ]);
                }
            }

            // Hapus rekening yang tidak lagi ada di RKA baru hanya jika belum punya realisasi > 0
            $subKegiatan->rekenings()
                ->whereNotIn('kode_rekening', $keptCodes)
                ->whereDoesntHave('bulanans', fn ($q) => $q->where('nominal', '>', 0))
                ->delete();
        });

        return redirect()
            ->route('realisasi-anggaran.index', ['tahun' => (int) $validated['tahun_anggaran']])
            ->with('success', 'Data Sub Kegiatan & Kode Rekening RKA berhasil disimpan ke database.');
    }

    /**
     * Edit Program, Kegiatan, Sub Kegiatan, serta tambah/ubah/hapus Kode Rekening, Uraian, & Pagu
     * pada data RKA yang sudah tersimpan tanpa menghilangkan realisasi bulanan rekening yang dipertahankan.
     */
    public function updateSubKegiatan(Request $request, RealisasiSubKegiatan $subKegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2100'],
            'urusan' => ['nullable', 'string', 'max:255'],
            'bidang' => ['nullable', 'string', 'max:255'],
            'unit_organisasi' => ['nullable', 'string', 'max:255'],
            'sub_unit_organisasi' => ['nullable', 'string', 'max:255'],
            'program' => ['nullable', 'string', 'max:500'],
            'kegiatan' => ['nullable', 'string', 'max:2000'],
            'kode_sub_kegiatan' => ['required', 'string', 'max:100'],
            'nama_sub_kegiatan' => ['required', 'string', 'max:2000'],
            'sumber_pendanaan' => ['nullable', 'string', 'max:255'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'waktu_pelaksanaan' => ['nullable', 'string', 'max:150'],
            'keterangan' => ['nullable', 'string', 'max:5000'],
            'rka_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'rekenings' => ['required', 'array', 'min:1'],
            'rekenings.*.id' => ['nullable', 'integer'],
            'rekenings.*.kode_rekening' => ['required', 'string', 'max:80'],
            'rekenings.*.uraian' => ['required', 'string', 'max:500'],
            'rekenings.*.jenis_pencairan' => ['nullable', 'in:GU,LS'],
            'rekenings.*.pagu_anggaran' => ['required', 'numeric', 'min:0'],
        ], [
            'kode_sub_kegiatan.required' => 'Kode Sub Kegiatan wajib diisi.',
            'nama_sub_kegiatan.required' => 'Nama Sub Kegiatan wajib diisi.',
            'rekenings.required' => 'Minimal 1 Kode Rekening Belanja wajib tersedia.',
        ]);

        $tahun = (int) $validated['tahun_anggaran'];
        $kodeSubKegiatan = trim($validated['kode_sub_kegiatan']);

        $duplicateSubKegiatan = RealisasiSubKegiatan::where('tahun_anggaran', $tahun)
            ->where('kode_sub_kegiatan', $kodeSubKegiatan)
            ->where('id', '!=', $subKegiatan->id)
            ->exists();

        if ($duplicateSubKegiatan) {
            return back()->withErrors([
                'kode_sub_kegiatan' => "Sub Kegiatan dengan kode {$kodeSubKegiatan} untuk Tahun {$tahun} sudah terdaftar.",
            ]);
        }

        $normalizedCodes = array_map(
            fn (array $r) => trim($r['kode_rekening']),
            $validated['rekenings']
        );
        if (count($normalizedCodes) !== count(array_unique($normalizedCodes))) {
            return back()->withErrors([
                'rekenings' => 'Terdapat Kode Rekening yang duplikat dalam satu Sub Kegiatan. Pastikan setiap kode rekening unik.',
            ]);
        }

        $rkaFilePath = null;
        if ($request->hasFile('rka_pdf')) {
            if ($subKegiatan->rka_file_path) {
                $oldPath = public_path(ltrim($subKegiatan->rka_file_path, '/'));
                if (File::exists($oldPath)) {
                    File::delete($oldPath);
                }
            }
            $file = $request->file('rka_pdf');
            $dir = public_path('uploads/rka-pdf');
            if (! File::exists($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            $safeKode = preg_replace('/[^A-Za-z0-9\-_]/', '_', $kodeSubKegiatan);
            $filename = 'rka_'.$tahun.'_'.$safeKode.'_'.date('YmdHis').'.pdf';
            $file->move($dir, $filename);
            $rkaFilePath = 'uploads/rka-pdf/'.$filename;
        }

        $totalAnggaran = array_reduce(
            $validated['rekenings'],
            fn (float $carry, array $r) => $carry + (float) $r['pagu_anggaran'],
            0.0
        );

        DB::transaction(function () use ($subKegiatan, $validated, $tahun, $kodeSubKegiatan, $rkaFilePath, $totalAnggaran): void {
            $subKegiatan->update([
                'tahun_anggaran' => $tahun,
                'urusan' => $validated['urusan'] ?? null,
                'bidang' => $validated['bidang'] ?? null,
                'unit_organisasi' => $validated['unit_organisasi'] ?? null,
                'sub_unit_organisasi' => $validated['sub_unit_organisasi'] ?? null,
                'program' => $validated['program'] ?? null,
                'kegiatan' => $validated['kegiatan'] ?? null,
                'kode_sub_kegiatan' => $kodeSubKegiatan,
                'nama_sub_kegiatan' => trim($validated['nama_sub_kegiatan']),
                'sumber_pendanaan' => $validated['sumber_pendanaan'] ?? null,
                'lokasi' => $validated['lokasi'] ?? null,
                'waktu_pelaksanaan' => $validated['waktu_pelaksanaan'] ?? null,
                'keterangan' => isset($validated['keterangan']) && trim($validated['keterangan']) !== '' ? trim($validated['keterangan']) : null,
                'total_anggaran' => $totalAnggaran,
                ...($rkaFilePath ? ['rka_file_path' => $rkaFilePath] : []),
            ]);

            $existingRekenings = $subKegiatan->rekenings()->get()->keyBy('id');
            $submittedIds = [];
            foreach ($validated['rekenings'] as $rekData) {
                $rekId = ! empty($rekData['id']) ? (int) $rekData['id'] : null;
                if ($rekId && $existingRekenings->has($rekId)) {
                    $submittedIds[] = $rekId;
                }
            }

            // Hapus rekening yang dihapus user dari daftar
            $idsToDelete = $existingRekenings->keys()->diff($submittedIds)->values()->all();
            if (! empty($idsToDelete)) {
                $subKegiatan->rekenings()->whereIn('id', $idsToDelete)->delete();
            }

            // Hindari benturan sementara unique (realisasi_sub_kegiatan_id, kode_rekening) bila kode ditukar
            foreach ($submittedIds as $rekId) {
                $existingRekenings->get($rekId)->update([
                    'kode_rekening' => '__tmp__'.$rekId.'_'.Str::random(6),
                ]);
            }

            $urutan = 1;
            foreach ($validated['rekenings'] as $rekData) {
                $rekId = ! empty($rekData['id']) ? (int) $rekData['id'] : null;
                $payload = [
                    'kode_rekening' => trim($rekData['kode_rekening']),
                    'uraian' => trim($rekData['uraian']),
                    'jenis_pencairan' => strtoupper((string) ($rekData['jenis_pencairan'] ?? 'GU')),
                    'pagu_anggaran' => (float) $rekData['pagu_anggaran'],
                    'urutan' => $urutan++,
                ];

                if ($rekId && $existingRekenings->has($rekId)) {
                    $existingRekenings->get($rekId)->update($payload);
                } else {
                    $subKegiatan->rekenings()->create($payload);
                }
            }
        });

        return redirect()
            ->route('realisasi-anggaran.index', ['tahun' => $tahun])
            ->with('success', 'Perubahan data RKA Sub Kegiatan & Kode Rekening berhasil disimpan.');
    }

    /**
     * Simpan AKB (Anggaran Kas Belanja) bulanan (Jan–Des) untuk seluruh kode rekening dalam 1 Sub Kegiatan.
     */
    public function saveAkb(Request $request, RealisasiSubKegiatan $subKegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.rekening_id' => ['required', 'integer'],
            'items.*.akb' => ['required', 'array'],
            'items.*.akb.*' => ['nullable', 'numeric', 'min:0'],
        ]);

        $rekenings = $subKegiatan->rekenings()->with('bulanans')->get()->keyBy('id');
        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        // Validasi: Total AKB <= Pagu, dan AKB kumulatif >= Realisasi kumulatif yang sudah ada
        foreach ($validated['items'] as $item) {
            $rekId = (int) $item['rekening_id'];
            $rek = $rekenings->get($rekId);
            if (! $rek) {
                continue;
            }

            $existingByMonth = $rek->bulanans->keyBy('bulan');
            $totalAkb = 0.0;
            $cumAkb = 0.0;
            $cumReal = 0.0;

            for ($m = 1; $m <= 12; $m++) {
                $akbVal = max(0.0, (float) ($item['akb'][$m] ?? $item['akb'][(string) $m] ?? 0));
                $realVal = (float) ($existingByMonth->get($m)?->nominal ?? 0);
                $totalAkb += $akbVal;
                $cumAkb += $akbVal;
                $cumReal += $realVal;

                if ($cumReal > $cumAkb + 0.01) {
                    return back()->withErrors([
                        'items' => "AKB kumulatif s.d. {$monthNames[$m]} pada rekening {$rek->kode_rekening} (Rp ".number_format($cumAkb, 0, ',', '.').') tidak boleh lebih kecil dari realisasi kumulatif yang sudah diinput (Rp '.number_format($cumReal, 0, ',', '.').').',
                    ]);
                }
            }

            if ($totalAkb > (float) $rek->pagu_anggaran + 0.01) {
                return back()->withErrors([
                    'items' => "Total AKB pada rekening {$rek->kode_rekening} (Rp ".number_format($totalAkb, 0, ',', '.').') melebihi Pagu Anggaran (Rp '.number_format((float) $rek->pagu_anggaran, 0, ',', '.').').',
                ]);
            }
        }

        DB::transaction(function () use ($validated, $rekenings): void {
            foreach ($validated['items'] as $item) {
                $rekId = (int) $item['rekening_id'];
                $rek = $rekenings->get($rekId);
                if (! $rek) {
                    continue;
                }

                $existingByMonth = $rek->bulanans->keyBy('bulan');

                for ($m = 1; $m <= 12; $m++) {
                    $akbVal = max(0.0, (float) ($item['akb'][$m] ?? $item['akb'][(string) $m] ?? 0));
                    $existing = $existingByMonth->get($m);
                    $existingNominal = (float) ($existing?->nominal ?? 0);

                    if ($akbVal > 0 || $existingNominal > 0) {
                        RealisasiBulanan::updateOrCreate(
                            [
                                'realisasi_rekening_id' => $rekId,
                                'bulan' => $m,
                            ],
                            [
                                'akb' => $akbVal,
                            ]
                        );
                    } elseif ($existing) {
                        $existing->delete();
                    }
                }
            }
        });

        return back()->with('success', 'AKB (Anggaran Kas Belanja) berhasil disimpan.');
    }

    /**
     * Simpan input manual Realisasi Pencairan Bulanan (Jan–Des) untuk seluruh kode rekening dalam 1 Sub Kegiatan.
     * Menerapkan validasi AKB Kumulatif s.d. Bulan Berjalan (Standar SIPD-RI).
     */
    public function saveMatrix(Request $request, RealisasiSubKegiatan $subKegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.rekening_id' => ['required', 'integer'],
            'items.*.jenis_pencairan' => ['nullable', 'in:GU,LS'],
            'items.*.bulanan' => ['required', 'array'],
            'items.*.bulanan.*' => ['nullable', 'numeric', 'min:0'],
        ]);

        $rekenings = $subKegiatan->rekenings()->with('bulanans')->get()->keyBy('id');
        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        // Validasi Kumulatif AKB s.d. Bulan Berjalan (wajib input AKB terlebih dahulu)
        foreach ($validated['items'] as $item) {
            $rekId = (int) $item['rekening_id'];
            $rek = $rekenings->get($rekId);
            if (! $rek) {
                continue;
            }

            $existingByMonth = $rek->bulanans->keyBy('bulan');
            $cumAkb = 0.0;
            $cumReal = 0.0;

            for ($m = 1; $m <= 12; $m++) {
                $akbVal = (float) ($existingByMonth->get($m)?->akb ?? 0);
                $nomVal = max(0.0, (float) ($item['bulanan'][$m] ?? $item['bulanan'][(string) $m] ?? 0));
                $cumAkb += $akbVal;
                $cumReal += $nomVal;

                if ($nomVal > 0 && $cumReal > $cumAkb + 0.01) {
                    $maksBulanIni = max(0.0, $cumAkb - ($cumReal - $nomVal));

                    return back()->withErrors([
                        'items' => "Pencairan bulan {$monthNames[$m]} pada rekening {$rek->kode_rekening} melebihi batas AKB kumulatif s.d. {$monthNames[$m]} (Maksimal bulan ini: Rp ".number_format($maksBulanIni, 0, ',', '.').'). Silakan input AKB terlebih dahulu.',
                    ]);
                }
            }
        }

        DB::transaction(function () use ($validated, $rekenings): void {
            foreach ($validated['items'] as $item) {
                $rekId = (int) $item['rekening_id'];
                $rek = $rekenings->get($rekId);
                if (! $rek) {
                    continue;
                }

                if (! empty($item['jenis_pencairan'])) {
                    RealisasiRekening::where('id', $rekId)->update([
                        'jenis_pencairan' => strtoupper((string) $item['jenis_pencairan']),
                    ]);
                }

                $existingByMonth = $rek->bulanans->keyBy('bulan');

                for ($m = 1; $m <= 12; $m++) {
                    $nominal = max(0.0, (float) ($item['bulanan'][$m] ?? $item['bulanan'][(string) $m] ?? 0));
                    $existing = $existingByMonth->get($m);
                    $existingAkb = (float) ($existing?->akb ?? 0);

                    if ($nominal > 0 || $existingAkb > 0) {
                        RealisasiBulanan::updateOrCreate(
                            [
                                'realisasi_rekening_id' => $rekId,
                                'bulan' => $m,
                            ],
                            [
                                'nominal' => $nominal,
                            ]
                        );
                    } elseif ($existing) {
                        $existing->delete();
                    }
                }
            }
        });

        return back()->with('success', 'Realisasi pencairan bulanan berhasil disimpan.');
    }

    public function destroySubKegiatan(RealisasiSubKegiatan $subKegiatan): RedirectResponse
    {
        if ($subKegiatan->rka_file_path) {
            $fullPath = public_path(ltrim($subKegiatan->rka_file_path, '/'));
            if (File::exists($fullPath)) {
                File::delete($fullPath);
            }
        }

        $subKegiatan->delete();

        return back()->with('success', 'Data Sub Kegiatan realisasi anggaran berhasil dihapus.');
    }

    /**
     * Preview / Download PDF Matriks Realisasi Pencairan Bulanan (A4 Landscape) sesuai format Lampiran 2.
     */
    public function downloadPdf(Request $request, RealisasiSubKegiatan $subKegiatan): SymfonyResponse
    {
        $subKegiatan->load(['rekenings.bulanans']);

        $monthlyTotals = array_fill(1, 12, 0.0);
        $totalAnggaran = 0.0;
        $totalRealisasi = 0.0;

        $rows = $subKegiatan->rekenings->map(function (RealisasiRekening $rek, int $idx) use (&$monthlyTotals, &$totalAnggaran, &$totalRealisasi): array {
            $bulanMap = array_fill(1, 12, 0.0);
            foreach ($rek->bulanans as $bln) {
                $m = (int) $bln->bulan;
                if ($m >= 1 && $m <= 12) {
                    $bulanMap[$m] = (float) $bln->nominal;
                    $monthlyTotals[$m] += (float) $bln->nominal;
                }
            }

            $pagu = (float) $rek->pagu_anggaran;
            $rowTotal = array_sum($bulanMap);
            $sisa = $pagu - $rowTotal;

            $totalAnggaran += $pagu;
            $totalRealisasi += $rowTotal;

            return [
                'no' => $idx + 1,
                'kode_rekening' => $rek->kode_rekening,
                'uraian' => $rek->uraian,
                'pagu' => $pagu,
                'bulanan' => $bulanMap,
                'total' => $rowTotal,
                'sisa' => $sisa,
            ];
        })->values()->all();

        $totalSisa = $totalAnggaran - $totalRealisasi;
        $terbilangAnggaran = ucfirst(strtolower(SppdDalamKotaController::formatTerbilangRupiah($totalAnggaran)));

        $safeKode = Str::slug($subKegiatan->kode_sub_kegiatan ?: 'sub_kegiatan_'.$subKegiatan->id, '_');
        $filename = "Realisasi_Anggaran_{$subKegiatan->tahun_anggaran}_{$safeKode}.pdf";

        $pdf = Pdf::loadView('pdf.realisasi-anggaran', [
            'subKegiatan' => $subKegiatan,
            'rows' => $rows,
            'monthlyTotals' => $monthlyTotals,
            'totalAnggaran' => $totalAnggaran,
            'totalRealisasi' => $totalRealisasi,
            'totalSisa' => $totalSisa,
            'terbilangAnggaran' => $terbilangAnggaran,
        ])->setPaper('a4', 'landscape');

        return $request->boolean('download')
            ? $pdf->download($filename)
            : $pdf->stream($filename);
    }

    /**
     * Simpan / perbarui kolom Keterangan manual per Sub Kegiatan secara langsung dari tabel.
     */
    public function updateKeterangan(Request $request, RealisasiSubKegiatan $subKegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'keterangan' => ['nullable', 'string', 'max:5000'],
        ]);

        $text = isset($validated['keterangan']) ? trim($validated['keterangan']) : '';
        $subKegiatan->update([
            'keterangan' => $text !== '' ? $text : null,
        ]);

        return back()->with('success', 'Keterangan sub kegiatan berhasil disimpan.');
    }

    /**
     * Preview / Download PDF Rekap Program, Kegiatan, Sub Kegiatan, Pagu, Realisasi, Sisa, Persen, & Keterangan (A4 Landscape)
     * dengan kolom dinamis sesuai pilihan user (?cols=program,kegiatan,sub_kegiatan,pagu,realisasi,sisa,persen,keterangan).
     */
    public function downloadProgramKegiatanPdf(Request $request): SymfonyResponse
    {
        $tahun = $request->integer('tahun') ?: (int) date('Y');

        $allowedCols = [
            'program',
            'kegiatan',
            'sub_kegiatan',
            'pagu',
            'realisasi',
            'sisa',
            'persen',
            'keterangan',
        ];
        $defaultCols = ['program', 'kegiatan', 'sub_kegiatan', 'pagu', 'keterangan'];

        $colsParam = trim((string) $request->query('cols', ''));
        if ($colsParam !== '') {
            $requested = array_map('trim', explode(',', $colsParam));
            $selectedCols = array_values(array_intersect($allowedCols, $requested));
        } else {
            $selectedCols = $defaultCols;
        }
        if (empty($selectedCols)) {
            $selectedCols = $defaultCols;
        }

        $baseWeights = [
            'program' => 16,
            'kegiatan' => 16,
            'sub_kegiatan' => 20,
            'pagu' => 11,
            'realisasi' => 11,
            'sisa' => 11,
            'persen' => 7,
            'keterangan' => 24,
        ];
        $totalWeight = array_reduce(
            $selectedCols,
            fn (int $carry, string $c) => $carry + ($baseWeights[$c] ?? 10),
            0
        );
        $colWidths = [];
        foreach ($selectedCols as $c) {
            $colWidths[$c] = round((($baseWeights[$c] ?? 10) / max(1, $totalWeight)) * 100, 2);
        }

        $subKegiatans = RealisasiSubKegiatan::with(['rekenings.bulanans'])
            ->where('tahun_anggaran', $tahun)
            ->orderBy('program')
            ->orderBy('kegiatan')
            ->orderBy('kode_sub_kegiatan')
            ->orderBy('id')
            ->get();

        $rawRows = [];
        $grandTotalPagu = 0.0;
        $grandTotalRealisasi = 0.0;

        foreach ($subKegiatans as $sk) {
            $sumRek = (float) $sk->rekenings->sum('pagu_anggaran');
            $pagu = $sumRek > 0 ? $sumRek : (float) $sk->total_anggaran;
            $realisasi = 0.0;
            foreach ($sk->rekenings as $rek) {
                $realisasi += (float) $rek->bulanans->sum('nominal');
            }
            $sisa = $pagu - $realisasi;
            $persen = $pagu > 0 ? round(($realisasi / $pagu) * 100, 2) : 0.0;

            $grandTotalPagu += $pagu;
            $grandTotalRealisasi += $realisasi;

            $cleanProgram = trim((string) ($sk->program ?: '-'));
            $cleanProgram = trim((string) preg_replace('/\s*Kegiatan\s*:.*$/is', '', $cleanProgram));
            $cleanKegiatan = trim((string) ($sk->kegiatan ?: '-'));
            $cleanKegiatan = trim((string) preg_replace('/\s*Sub\s+Kegiatan\s*:.*$/is', '', $cleanKegiatan));

            $rawRows[] = [
                'program' => $cleanProgram !== '' ? $cleanProgram : '-',
                'kegiatan' => $cleanKegiatan !== '' ? $cleanKegiatan : '-',
                'sub_kegiatan' => trim($sk->kode_sub_kegiatan.' '.$sk->nama_sub_kegiatan),
                'pagu' => $pagu,
                'realisasi' => $realisasi,
                'sisa' => $sisa,
                'persen' => $persen,
                'keterangan' => $sk->keterangan,
                'program_first' => true,
                'program_last' => true,
                'kegiatan_first' => true,
                'kegiatan_last' => true,
            ];
        }

        $grandTotalSisa = $grandTotalPagu - $grandTotalRealisasi;
        $grandPersen = $grandTotalPagu > 0 ? round(($grandTotalRealisasi / $grandTotalPagu) * 100, 2) : 0.0;

        // Tandai baris awal & akhir tiap grup Program dan Kegiatan (tanpa rowspan agar aman lintas halaman di DomPDF)
        $count = count($rawRows);
        for ($i = 0; $i < $count; $i++) {
            $prevSameProgram = $i > 0 && $rawRows[$i]['program'] === $rawRows[$i - 1]['program'];
            $nextSameProgram = $i + 1 < $count && $rawRows[$i]['program'] === $rawRows[$i + 1]['program'];
            $rawRows[$i]['program_first'] = ! $prevSameProgram;
            $rawRows[$i]['program_last'] = ! $nextSameProgram;

            $prevSameKegiatan = $prevSameProgram && $rawRows[$i]['kegiatan'] === $rawRows[$i - 1]['kegiatan'];
            $nextSameKegiatan = $nextSameProgram && $rawRows[$i]['kegiatan'] === $rawRows[$i + 1]['kegiatan'];
            $rawRows[$i]['kegiatan_first'] = ! $prevSameKegiatan;
            $rawRows[$i]['kegiatan_last'] = ! $nextSameKegiatan;
        }

        $customTitle = trim((string) $request->query('judul', ''));
        $docTitle = $customTitle !== ''
            ? $customTitle
            : "PROGRAM DAN KEGIATAN BIDANG KDP TAHUN {$tahun}";

        $filename = "Program_dan_Kegiatan_Bidang_KDP_Tahun_{$tahun}.pdf";

        $pdf = Pdf::loadView('pdf.realisasi-program-kegiatan', [
            'tahun' => $tahun,
            'docTitle' => $docTitle,
            'selectedCols' => $selectedCols,
            'colWidths' => $colWidths,
            'rows' => $rawRows,
            'grandTotalPagu' => $grandTotalPagu,
            'grandTotalRealisasi' => $grandTotalRealisasi,
            'grandTotalSisa' => $grandTotalSisa,
            'grandPersen' => $grandPersen,
        ])->setPaper('a4', 'landscape');

        return $request->boolean('download')
            ? $pdf->download($filename)
            : $pdf->stream($filename);
    }

    /**
     * Terapkan Pergeseran Anggaran Manual (dalam 1 sub kegiatan maupun antar sub kegiatan)
     * serta simpan riwayat pergeseran tanpa menghilangkan data realisasi bulanan & AKB.
     */
    public function storePergeseranManual(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2100'],
            'nama_tahap' => ['required', 'string', 'max:150'],
            'tanggal' => ['required', 'date'],
            'nomor_dokumen' => ['nullable', 'string', 'max:150'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.rekening_id' => ['required', 'integer', 'exists:realisasi_rekenings,id'],
            'items.*.pagu_sesudah' => ['required', 'numeric', 'min:0'],
        ], [
            'nama_tahap.required' => 'Nama tahap pergeseran wajib diisi (misal: Pergeseran 1).',
            'items.required' => 'Minimal 1 kode rekening harus dipilih untuk pergeseran.',
        ]);

        $rekIds = array_unique(array_map(fn (array $it) => (int) $it['rekening_id'], $validated['items']));
        $rekenings = RealisasiRekening::with(['subKegiatan', 'bulanans'])
            ->whereIn('id', $rekIds)
            ->get()
            ->keyBy('id');

        $changes = [];
        foreach ($validated['items'] as $item) {
            $rekId = (int) $item['rekening_id'];
            $rek = $rekenings->get($rekId);
            if (! $rek || ! $rek->subKegiatan) {
                continue;
            }
            if ((int) $rek->subKegiatan->tahun_anggaran !== (int) $validated['tahun_anggaran']) {
                return back()->withErrors([
                    'items' => "Rekening {$rek->kode_rekening} bukan milik Tahun Anggaran {$validated['tahun_anggaran']}.",
                ]);
            }

            $paguSebelum = (float) $rek->pagu_anggaran;
            $paguSesudah = max(0.0, (float) $item['pagu_sesudah']);
            $sudahCair = (float) $rek->bulanans->sum('nominal');

            if ($paguSesudah + 0.01 < $sudahCair) {
                return back()->withErrors([
                    'items' => "Pagu baru rekening {$rek->kode_rekening} (Rp ".number_format($paguSesudah, 0, ',', '.').') tidak boleh lebih kecil dari total realisasi yang sudah cair (Rp '.number_format($sudahCair, 0, ',', '.').').',
                ]);
            }

            if (abs($paguSesudah - $paguSebelum) >= 0.01) {
                $changes[$rekId] = [
                    'rek' => $rek,
                    'pagu_sebelum' => $paguSebelum,
                    'pagu_sesudah' => $paguSesudah,
                    'selisih' => $paguSesudah - $paguSebelum,
                ];
            }
        }

        if (empty($changes)) {
            return back()->withErrors([
                'items' => 'Tidak ada perubahan nominal pagu. Pastikan minimal satu rekening memiliki Pagu Baru yang berbeda dari Pagu Saat Ini.',
            ]);
        }

        DB::transaction(function () use ($validated, $changes): void {
            $totalSebelum = 0.0;
            $totalSesudah = 0.0;
            foreach ($changes as $c) {
                $totalSebelum += $c['pagu_sebelum'];
                $totalSesudah += $c['pagu_sesudah'];
            }

            $pergeseran = RealisasiPergeseran::create([
                'tahun_anggaran' => (int) $validated['tahun_anggaran'],
                'nama_tahap' => trim($validated['nama_tahap']),
                'jenis' => 'pergeseran_manual',
                'tanggal' => $validated['tanggal'],
                'nomor_dokumen' => isset($validated['nomor_dokumen']) && trim($validated['nomor_dokumen']) !== '' ? trim($validated['nomor_dokumen']) : null,
                'keterangan' => isset($validated['keterangan']) && trim($validated['keterangan']) !== '' ? trim($validated['keterangan']) : null,
                'total_sebelum' => $totalSebelum,
                'total_sesudah' => $totalSesudah,
                'total_selisih' => $totalSesudah - $totalSebelum,
            ]);

            $affectedSubKegiatanIds = [];
            foreach ($changes as $c) {
                /** @var RealisasiRekening $rek */
                $rek = $c['rek'];
                $sk = $rek->subKegiatan;
                $affectedSubKegiatanIds[$sk->id] = $sk;

                $rek->update([
                    'pagu_murni' => $rek->pagu_murni ?? $c['pagu_sebelum'],
                    'pagu_anggaran' => $c['pagu_sesudah'],
                ]);

                $pergeseran->items()->create([
                    'realisasi_sub_kegiatan_id' => $sk->id,
                    'realisasi_rekening_id' => $rek->id,
                    'kode_sub_kegiatan' => $sk->kode_sub_kegiatan,
                    'nama_sub_kegiatan' => $sk->nama_sub_kegiatan,
                    'kode_rekening' => $rek->kode_rekening,
                    'uraian' => $rek->uraian,
                    'pagu_sebelum' => $c['pagu_sebelum'],
                    'pagu_sesudah' => $c['pagu_sesudah'],
                    'selisih' => $c['selisih'],
                ]);
            }

            foreach ($affectedSubKegiatanIds as $sk) {
                $newTotal = (float) $sk->rekenings()->sum('pagu_anggaran');
                $sk->update(['total_anggaran' => $newTotal]);
            }
        });

        return back()->with('success', 'Pergeseran anggaran berhasil diterapkan & dicatat dalam riwayat.');
    }

    /**
     * Terapkan RKA Perubahan dari hasil parsing PDF RKA Perubahan (SIPD-RI) untuk 1 Sub Kegiatan
     * tanpa menghilangkan realisasi bulanan & AKB yang sudah terinput.
     */
    public function storePergeseranPdf(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'realisasi_sub_kegiatan_id' => ['required', 'integer', 'exists:realisasi_sub_kegiatans,id'],
            'nama_tahap' => ['required', 'string', 'max:150'],
            'tanggal' => ['required', 'date'],
            'nomor_dokumen' => ['nullable', 'string', 'max:150'],
            'keterangan' => ['nullable', 'string', 'max:2000'],
            'rka_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'rekenings' => ['required', 'array', 'min:1'],
            'rekenings.*.kode_rekening' => ['required', 'string', 'max:80'],
            'rekenings.*.uraian' => ['required', 'string', 'max:500'],
            'rekenings.*.jenis_pencairan' => ['nullable', 'in:GU,LS'],
            'rekenings.*.pagu_anggaran' => ['required', 'numeric', 'min:0'],
        ]);

        $subKegiatan = RealisasiSubKegiatan::with(['rekenings.bulanans'])
            ->findOrFail((int) $validated['realisasi_sub_kegiatan_id']);

        $existingByCode = $subKegiatan->rekenings->keyBy(fn (RealisasiRekening $r) => trim($r->kode_rekening));
        $submittedByCode = [];
        foreach ($validated['rekenings'] as $rekData) {
            $code = trim($rekData['kode_rekening']);
            $submittedByCode[$code] = [
                'kode_rekening' => $code,
                'uraian' => trim($rekData['uraian']),
                'jenis_pencairan' => strtoupper((string) ($rekData['jenis_pencairan'] ?? 'GU')),
                'pagu_sesudah' => max(0.0, (float) $rekData['pagu_anggaran']),
            ];
        }

        $diffRows = [];
        // 1. Cek rekening yang ada di PDF perubahan (existing berubah atau baru)
        foreach ($submittedByCode as $code => $sub) {
            $existing = $existingByCode->get($code);
            if ($existing) {
                $paguSebelum = (float) $existing->pagu_anggaran;
                $sudahCair = (float) $existing->bulanans->sum('nominal');
                if ($sub['pagu_sesudah'] + 0.01 < $sudahCair) {
                    return back()->withErrors([
                        'rekenings' => "Pagu RKA Perubahan rekening {$code} (Rp ".number_format($sub['pagu_sesudah'], 0, ',', '.').') lebih kecil dari realisasi yang sudah cair (Rp '.number_format($sudahCair, 0, ',', '.').').',
                    ]);
                }
                if (abs($sub['pagu_sesudah'] - $paguSebelum) >= 0.01) {
                    $diffRows[] = [
                        'existing' => $existing,
                        'kode_rekening' => $code,
                        'uraian' => $sub['uraian'],
                        'jenis_pencairan' => $sub['jenis_pencairan'],
                        'pagu_sebelum' => $paguSebelum,
                        'pagu_sesudah' => $sub['pagu_sesudah'],
                        'selisih' => $sub['pagu_sesudah'] - $paguSebelum,
                    ];
                }
            } else {
                $diffRows[] = [
                    'existing' => null,
                    'kode_rekening' => $code,
                    'uraian' => $sub['uraian'],
                    'jenis_pencairan' => $sub['jenis_pencairan'],
                    'pagu_sebelum' => 0.0,
                    'pagu_sesudah' => $sub['pagu_sesudah'],
                    'selisih' => $sub['pagu_sesudah'],
                ];
            }
        }

        // 2. Cek rekening lama yang hilang dari PDF perubahan -> set pagu jadi 0 (jika belum cair)
        foreach ($existingByCode as $code => $existing) {
            if (! isset($submittedByCode[$code])) {
                $paguSebelum = (float) $existing->pagu_anggaran;
                $sudahCair = (float) $existing->bulanans->sum('nominal');
                if ($sudahCair > 0.01) {
                    return back()->withErrors([
                        'rekenings' => "Rekening {$code} tidak ada di RKA Perubahan namun sudah memiliki realisasi cair Rp ".number_format($sudahCair, 0, ',', '.').'. Pertahankan rekening tersebut dengan pagu minimal sebesar realisasi.',
                    ]);
                }
                if ($paguSebelum > 0.01) {
                    $diffRows[] = [
                        'existing' => $existing,
                        'kode_rekening' => $code,
                        'uraian' => $existing->uraian,
                        'jenis_pencairan' => $existing->jenis_pencairan ?: 'GU',
                        'pagu_sebelum' => $paguSebelum,
                        'pagu_sesudah' => 0.0,
                        'selisih' => -$paguSebelum,
                    ];
                }
            }
        }

        if (empty($diffRows)) {
            return back()->withErrors([
                'rekenings' => 'Tidak ditemukan perbedaan pagu antara RKA Perubahan dengan data saat ini.',
            ]);
        }

        $rkaFilePath = null;
        if ($request->hasFile('rka_pdf')) {
            $file = $request->file('rka_pdf');
            $dir = public_path('uploads/rka-pdf');
            if (! File::exists($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            $safeKode = preg_replace('/[^A-Za-z0-9\-_]/', '_', $subKegiatan->kode_sub_kegiatan);
            $filename = 'rka_perubahan_'.$subKegiatan->tahun_anggaran.'_'.$safeKode.'_'.date('YmdHis').'.pdf';
            $file->move($dir, $filename);
            $rkaFilePath = 'uploads/rka-pdf/'.$filename;
        }

        DB::transaction(function () use ($validated, $subKegiatan, $diffRows, $rkaFilePath): void {
            $totalSebelum = 0.0;
            $totalSesudah = 0.0;
            foreach ($diffRows as $d) {
                $totalSebelum += $d['pagu_sebelum'];
                $totalSesudah += $d['pagu_sesudah'];
            }

            $pergeseran = RealisasiPergeseran::create([
                'tahun_anggaran' => (int) $subKegiatan->tahun_anggaran,
                'nama_tahap' => trim($validated['nama_tahap']),
                'jenis' => 'rka_perubahan_pdf',
                'tanggal' => $validated['tanggal'],
                'nomor_dokumen' => isset($validated['nomor_dokumen']) && trim($validated['nomor_dokumen']) !== '' ? trim($validated['nomor_dokumen']) : null,
                'keterangan' => isset($validated['keterangan']) && trim($validated['keterangan']) !== '' ? trim($validated['keterangan']) : null,
                'total_sebelum' => $totalSebelum,
                'total_sesudah' => $totalSesudah,
                'total_selisih' => $totalSesudah - $totalSebelum,
            ]);

            $maxUrutan = (int) $subKegiatan->rekenings()->max('urutan');

            foreach ($diffRows as $d) {
                /** @var RealisasiRekening|null $existing */
                $existing = $d['existing'];
                if ($existing) {
                    $existing->update([
                        'uraian' => $d['uraian'],
                        'pagu_murni' => $existing->pagu_murni ?? $d['pagu_sebelum'],
                        'pagu_anggaran' => $d['pagu_sesudah'],
                    ]);
                    $rekId = $existing->id;
                } else {
                    $created = $subKegiatan->rekenings()->create([
                        'kode_rekening' => $d['kode_rekening'],
                        'uraian' => $d['uraian'],
                        'jenis_pencairan' => $d['jenis_pencairan'],
                        'pagu_anggaran' => $d['pagu_sesudah'],
                        'pagu_murni' => 0.0,
                        'urutan' => ++$maxUrutan,
                    ]);
                    $rekId = $created->id;
                }

                $pergeseran->items()->create([
                    'realisasi_sub_kegiatan_id' => $subKegiatan->id,
                    'realisasi_rekening_id' => $rekId,
                    'kode_sub_kegiatan' => $subKegiatan->kode_sub_kegiatan,
                    'nama_sub_kegiatan' => $subKegiatan->nama_sub_kegiatan,
                    'kode_rekening' => $d['kode_rekening'],
                    'uraian' => $d['uraian'],
                    'pagu_sebelum' => $d['pagu_sebelum'],
                    'pagu_sesudah' => $d['pagu_sesudah'],
                    'selisih' => $d['selisih'],
                ]);
            }

            $newTotal = (float) $subKegiatan->rekenings()->sum('pagu_anggaran');
            $subKegiatan->update([
                'total_anggaran' => $newTotal,
                ...($rkaFilePath ? ['rka_file_path' => $rkaFilePath] : []),
            ]);
        });

        return back()->with('success', 'RKA Perubahan berhasil diterapkan & dicatat dalam riwayat pergeseran.');
    }

    public function destroyPergeseran(RealisasiPergeseran $pergeseran): RedirectResponse
    {
        $pergeseran->delete();

        return back()->with('success', 'Catatan riwayat pergeseran berhasil dihapus.');
    }
}
