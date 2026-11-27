<?php

namespace App\Http\Controllers;

use App\Models\Npd;
use App\Models\NpdItem;
use App\Models\NpdRekening;
use App\Models\RealisasiSubKegiatan;
use App\Models\SppdDalamKota;
use App\Models\SppdDpa;
use App\Models\SppdLuarKota;
use App\Models\SppdPejabat;
use App\Models\SppdSubKegiatan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Smalot\PdfParser\Parser as PdfParser;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class NpdController extends Controller
{
    private static function formatIndoDate(string|Carbon|null $date): string
    {
        if (! $date) {
            return '';
        }
        $c = $date instanceof Carbon ? $date : Carbon::parse($date);
        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        return $c->day.' '.($months[$c->month] ?? $c->format('F')).' '.$c->year;
    }

    private static function formatNipSpaced(?string $nip): string
    {
        if (! $nip) {
            return '-';
        }
        $digits = preg_replace('/\D/', '', $nip);
        if (strlen($digits) === 18) {
            return substr($digits, 0, 8).' '.substr($digits, 8, 6).' '.substr($digits, 14, 1).' '.substr($digits, 15, 3);
        }

        return $nip;
    }

    public function index(): Response
    {
        $subKegiatans = SppdSubKegiatan::orderByDesc('is_active')
            ->orderBy('kode_sub_kegiatan')
            ->get()
            ->map(fn (SppdSubKegiatan $sk): array => [
                'id' => $sk->id,
                'no_rekening' => $sk->no_rekening,
                'nama_kegiatan' => $sk->nama_kegiatan,
                'sub_kegiatan' => $sk->sub_kegiatan,
                'kode_sub_kegiatan' => $sk->kode_sub_kegiatan,
                'is_active' => (bool) $sk->is_active,
            ])->values();

        $pejabats = SppdPejabat::orderByDesc('is_active')->orderBy('id')->get();
        $formatPejabat = fn (SppdPejabat $pj): array => [
            'id' => $pj->id,
            'tipe' => $pj->tipe,
            'nama' => $pj->nama,
            'nip' => $pj->nip,
            'pangkat' => $pj->pangkat,
            'golongan' => $pj->golongan,
            'jabatan' => $pj->jabatan,
            'is_active' => (bool) $pj->is_active,
        ];

        $activeDpa = SppdDpa::where('is_active', true)->orderByDesc('tahun_anggaran')->first();
        $activeTahunAnggaran = (int) ($activeDpa?->tahun_anggaran ?: date('Y'));

        // Hitung akumulasi pencairan yang sudah tersimpan per (sub_kegiatan_id, tahun_anggaran, kode_rekening)
        $npdsAll = Npd::with(['subKegiatan', 'pptk', 'penggunaAnggaran', 'items'])
            ->orderByDesc('id')
            ->get();

        $akumulasiMap = [];
        $linkedDkMap = [];
        $linkedLkMap = [];

        foreach ($npdsAll as $npd) {
            $npdLabel = $npd->nomor_npd ?: 'NPD #'.$npd->id;
            foreach ((array) ($npd->linked_sppd_dalam_kota_batches ?? []) as $bCode) {
                $linkedDkMap[(string) $bCode] = $npdLabel;
            }
            foreach ((array) ($npd->linked_sppd_luar_kota_batches ?? []) as $bCode) {
                $linkedLkMap[(string) $bCode] = $npdLabel;
            }
            foreach ($npd->items as $it) {
                $key = $npd->sub_kegiatan_id.'|'.$npd->tahun_anggaran.'|'.trim($it->kode_rekening);
                $akumulasiMap[$key] = ($akumulasiMap[$key] ?? 0.0) + (float) $it->pencairan_saat_ini;
            }
        }

        $rekenings = NpdRekening::orderBy('sub_kegiatan_id')
            ->orderBy('tahun_anggaran')
            ->orderBy('urutan')
            ->orderBy('id')
            ->get()
            ->map(function (NpdRekening $r) use ($akumulasiMap): array {
                $key = $r->sub_kegiatan_id.'|'.$r->tahun_anggaran.'|'.trim($r->kode_rekening);
                $akum = (float) ($akumulasiMap[$key] ?? 0.0);

                return [
                    'id' => $r->id,
                    'sub_kegiatan_id' => $r->sub_kegiatan_id,
                    'tahun_anggaran' => (int) $r->tahun_anggaran,
                    'jenis_anggaran' => ($r->jenis_anggaran ?: 'murni') === 'perubahan' ? 'perubahan' : 'murni',
                    'nama_program' => $r->nama_program,
                    'kode_rekening' => $r->kode_rekening,
                    'uraian' => $r->uraian,
                    'anggaran' => (float) $r->anggaran,
                    'urutan' => (int) $r->urutan,
                    'akumulasi_tercairkan' => $akum,
                    'sisa_anggaran' => (float) $r->anggaran - $akum,
                ];
            })->values();

        // Batch SPPD Dalam Kota & Luar Kota untuk fitur 1-klik "Tarik dari Batch SPPD"
        $sppdDalamKotaBatches = SppdDalamKota::orderByDesc('id')
            ->get()
            ->groupBy('batch_code')
            ->map(function ($group, string $batchCode) use ($linkedDkMap): array {
                /** @var SppdDalamKota $first */
                $first = $group->first();

                return [
                    'batch_code' => $batchCode,
                    'sub_kegiatan_id' => $first->sub_kegiatan_id,
                    'spt_count' => $group->count(),
                    'total_biaya' => (float) $group->sum('total_uang_saku'),
                    'tanggal_label' => self::formatIndoDate($first->tanggal_berangkat),
                    'already_linked_npd' => $linkedDkMap[$batchCode] ?? null,
                ];
            })
            ->values();

        $sppdLuarKotaBatches = SppdLuarKota::orderByDesc('id')
            ->get()
            ->groupBy('batch_code')
            ->map(function ($group, string $batchCode) use ($linkedLkMap): array {
                /** @var SppdLuarKota $first */
                $first = $group->first();

                return [
                    'batch_code' => $batchCode,
                    'sub_kegiatan_id' => $first->sub_kegiatan_id,
                    'spt_count' => $group->count(),
                    'total_biaya' => (float) $group->sum('total_biaya'),
                    'tanggal_label' => self::formatIndoDate($first->tanggal_berangkat),
                    'already_linked_npd' => $linkedLkMap[$batchCode] ?? null,
                ];
            })
            ->values();

        $npdsFormatted = $npdsAll->map(fn (Npd $npd): array => [
            'id' => $npd->id,
            'nomor_npd' => $npd->nomor_npd,
            'tanggal_npd' => $npd->tanggal_npd ? Carbon::parse($npd->tanggal_npd)->format('Y-m-d') : null,
            'tanggal_npd_formatted' => $npd->tanggal_npd ? self::formatIndoDate($npd->tanggal_npd) : '-',
            'sub_kegiatan_id' => $npd->sub_kegiatan_id,
            'sub_kegiatan' => $npd->subKegiatan ? [
                'id' => $npd->subKegiatan->id,
                'kode_sub_kegiatan' => $npd->subKegiatan->kode_sub_kegiatan,
                'nama_kegiatan' => $npd->subKegiatan->nama_kegiatan,
                'sub_kegiatan' => $npd->subKegiatan->sub_kegiatan,
            ] : null,
            'tahun_anggaran' => (int) $npd->tahun_anggaran,
            'nama_program' => $npd->nama_program,
            'pptk_id' => $npd->pptk_id,
            'pptk_nama' => $npd->pptk?->nama ?? '-',
            'pengguna_anggaran_id' => $npd->pengguna_anggaran_id,
            'pengguna_anggaran_nama' => $npd->penggunaAnggaran?->nama ?? '-',
            'total_anggaran' => (float) $npd->total_anggaran,
            'total_akumulasi_sebelumnya' => (float) $npd->total_akumulasi_sebelumnya,
            'total_pencairan_saat_ini' => (float) $npd->total_pencairan_saat_ini,
            'total_sisa' => (float) $npd->total_sisa,
            'potongan_ppn' => (float) $npd->potongan_ppn,
            'potongan_pph21' => (float) $npd->potongan_pph21,
            'potongan_pph22' => (float) $npd->potongan_pph22,
            'potongan_pph23' => (float) $npd->potongan_pph23,
            'potongan_pph4_2' => (float) $npd->potongan_pph4_2,
            'total_potongan' => (float) $npd->total_potongan,
            'jumlah_dibayarkan' => (float) $npd->jumlah_dibayarkan,
            'terbilang' => SppdDalamKotaController::formatTerbilangRupiah($npd->jumlah_dibayarkan),
            'linked_sppd_dalam_kota_batches' => $npd->linked_sppd_dalam_kota_batches ?? [],
            'linked_sppd_luar_kota_batches' => $npd->linked_sppd_luar_kota_batches ?? [],
            'catatan' => $npd->catatan,
            'items' => $npd->items->map(fn (NpdItem $it): array => [
                'id' => $it->id,
                'npd_rekening_id' => $it->npd_rekening_id,
                'urutan' => (int) $it->urutan,
                'kode_rekening' => $it->kode_rekening,
                'uraian' => $it->uraian,
                'anggaran' => (float) $it->anggaran,
                'akumulasi_sebelumnya' => (float) $it->akumulasi_sebelumnya,
                'pencairan_saat_ini' => (float) $it->pencairan_saat_ini,
                'sisa' => (float) $it->sisa,
            ])->values()->all(),
        ])->values();

        $totalPagu = (float) $rekenings->where('tahun_anggaran', $activeTahunAnggaran)->sum('anggaran');
        $totalRealisasi = (float) $npdsAll->where('tahun_anggaran', $activeTahunAnggaran)->sum('total_pencairan_saat_ini');
        $totalSisa = max(0.0, $totalPagu - $totalRealisasi);
        $persenSerapan = $totalPagu > 0 ? round(($totalRealisasi / $totalPagu) * 100, 1) : 0.0;

        return Inertia::render('npd/index', [
            'subKegiatans' => $subKegiatans,
            'pptkList' => $pejabats->where('tipe', SppdPejabat::TIPE_PPTK)->map($formatPejabat)->values(),
            'kepalaDinasList' => $pejabats->where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->map($formatPejabat)->values(),
            'activeTahunAnggaran' => $activeTahunAnggaran,
            'rekenings' => $rekenings,
            'npds' => $npdsFormatted,
            'sppdDalamKotaBatches' => $sppdDalamKotaBatches,
            'sppdLuarKotaBatches' => $sppdLuarKotaBatches,
            'statistics' => [
                'tahun_anggaran' => $activeTahunAnggaran,
                'total_pagu' => $totalPagu,
                'total_realisasi' => $totalRealisasi,
                'total_sisa' => $totalSisa,
                'persen_serapan' => $persenSerapan,
                'total_npd' => $npdsAll->count(),
            ],
        ]);
    }

    // =========================================================================
    // MASTER PAGU REKENING PER SUB KEGIATAN (SATUAN / BULK PASTE EXCEL)
    // =========================================================================

    public function storeRekening(Request $request): RedirectResponse
    {
        if ($request->has('items') && is_array($request->input('items'))) {
            $validated = $request->validate([
                'sub_kegiatan_id' => ['required', 'exists:sppd_sub_kegiatans,id'],
                'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2100'],
                'jenis_anggaran' => ['nullable', 'in:murni,perubahan'],
                'nama_program' => ['nullable', 'string', 'max:255'],
                'items' => ['required', 'array', 'min:1'],
                'items.*.kode_rekening' => ['required', 'string', 'max:60'],
                'items.*.uraian' => ['required', 'string', 'max:255'],
                'items.*.anggaran' => ['required', 'numeric', 'min:0'],
            ]);

            $jenisAnggaran = ($validated['jenis_anggaran'] ?? 'murni') === 'perubahan' ? 'perubahan' : 'murni';

            $maxUrutan = (int) NpdRekening::where('sub_kegiatan_id', $validated['sub_kegiatan_id'])
                ->where('tahun_anggaran', $validated['tahun_anggaran'])
                ->where('jenis_anggaran', $jenisAnggaran)
                ->max('urutan');

            $createdCount = 0;
            $updatedCount = 0;

            DB::transaction(function () use ($validated, $jenisAnggaran, $maxUrutan, &$createdCount, &$updatedCount): void {
                $urutan = $maxUrutan + 1;
                foreach ($validated['items'] as $row) {
                    $kode = trim($row['kode_rekening']);
                    $existing = NpdRekening::where('sub_kegiatan_id', (int) $validated['sub_kegiatan_id'])
                        ->where('tahun_anggaran', (int) $validated['tahun_anggaran'])
                        ->where('jenis_anggaran', $jenisAnggaran)
                        ->where('kode_rekening', $kode)
                        ->first();

                    if ($existing) {
                        $existing->update([
                            'nama_program' => ! empty($validated['nama_program']) ? trim($validated['nama_program']) : $existing->nama_program,
                            'uraian' => trim($row['uraian']),
                            'anggaran' => (float) $row['anggaran'],
                        ]);
                        $updatedCount++;
                    } else {
                        NpdRekening::create([
                            'sub_kegiatan_id' => (int) $validated['sub_kegiatan_id'],
                            'tahun_anggaran' => (int) $validated['tahun_anggaran'],
                            'jenis_anggaran' => $jenisAnggaran,
                            'nama_program' => ! empty($validated['nama_program']) ? trim($validated['nama_program']) : null,
                            'kode_rekening' => $kode,
                            'uraian' => trim($row['uraian']),
                            'anggaran' => (float) $row['anggaran'],
                            'urutan' => $urutan++,
                        ]);
                        $createdCount++;
                    }
                }
            });

            $parts = [];
            if ($createdCount > 0) {
                $parts[] = $createdCount.' rekening baru ditambahkan';
            }
            if ($updatedCount > 0) {
                $parts[] = $updatedCount.' rekening diperbarui';
            }

            return back()->with('success', implode(', ', $parts).'.');
        }

        $validated = $request->validate([
            'sub_kegiatan_id' => ['required', 'exists:sppd_sub_kegiatans,id'],
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2100'],
            'jenis_anggaran' => ['nullable', 'in:murni,perubahan'],
            'nama_program' => ['nullable', 'string', 'max:255'],
            'kode_rekening' => ['required', 'string', 'max:60'],
            'uraian' => ['required', 'string', 'max:255'],
            'anggaran' => ['required', 'numeric', 'min:0'],
        ]);

        $jenisAnggaran = ($validated['jenis_anggaran'] ?? 'murni') === 'perubahan' ? 'perubahan' : 'murni';

        $maxUrutan = (int) NpdRekening::where('sub_kegiatan_id', $validated['sub_kegiatan_id'])
            ->where('tahun_anggaran', $validated['tahun_anggaran'])
            ->where('jenis_anggaran', $jenisAnggaran)
            ->max('urutan');

        NpdRekening::create([
            'sub_kegiatan_id' => (int) $validated['sub_kegiatan_id'],
            'tahun_anggaran' => (int) $validated['tahun_anggaran'],
            'jenis_anggaran' => $jenisAnggaran,
            'nama_program' => ! empty($validated['nama_program']) ? trim($validated['nama_program']) : null,
            'kode_rekening' => trim($validated['kode_rekening']),
            'uraian' => trim($validated['uraian']),
            'anggaran' => (float) $validated['anggaran'],
            'urutan' => $maxUrutan + 1,
        ]);

        return back()->with('success', 'Rekening pagu anggaran berhasil ditambahkan.');
    }

    /**
     * Sinkronisasi Master Pagu Rekening NPD langsung dari modul Realisasi Anggaran (Murni / Perubahan).
     */
    public function syncFromRealisasi(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2100'],
            'jenis_anggaran' => ['required', 'in:murni,perubahan'],
            'sub_kegiatan_id' => ['nullable', 'exists:sppd_sub_kegiatans,id'],
        ]);

        $tahun = (int) $validated['tahun_anggaran'];
        $jenis = $validated['jenis_anggaran'];
        $jenisLabel = $jenis === 'perubahan' ? 'Anggaran Perubahan' : 'Anggaran Murni';

        $realisasiSks = RealisasiSubKegiatan::with('rekenings')
            ->where('tahun_anggaran', $tahun)
            ->where('jenis_anggaran', $jenis)
            ->get();

        if ($realisasiSks->isEmpty()) {
            return back()->withErrors([
                'sync' => "Belum ada data {$jenisLabel} untuk Tahun Anggaran {$tahun} di modul Realisasi Anggaran.",
            ]);
        }

        $targetSppdSks = ! empty($validated['sub_kegiatan_id'])
            ? SppdSubKegiatan::where('id', (int) $validated['sub_kegiatan_id'])->get()
            : SppdSubKegiatan::all();

        $normalizeCode = static fn (?string $c): string => (string) preg_replace('/\D/', '', (string) $c);
        $realisasiByNormCode = [];
        foreach ($realisasiSks as $rsk) {
            $realisasiByNormCode[$normalizeCode($rsk->kode_sub_kegiatan)] = $rsk;
        }

        $syncedSkCount = 0;
        $syncedRekCount = 0;

        DB::transaction(function () use ($targetSppdSks, $realisasiByNormCode, $normalizeCode, $tahun, $jenis, &$syncedSkCount, &$syncedRekCount): void {
            foreach ($targetSppdSks as $sppdSk) {
                $rsk = $realisasiByNormCode[$normalizeCode($sppdSk->kode_sub_kegiatan)] ?? null;
                if (! $rsk || $rsk->rekenings->isEmpty()) {
                    continue;
                }

                $syncedSkCount++;
                $urutan = 1;
                $cleanProgram = $rsk->program
                    ? trim((string) preg_replace('/^[\d.]+\s+/', '', trim($rsk->program)))
                    : null;

                foreach ($rsk->rekenings as $rrek) {
                    $kode = trim($rrek->kode_rekening);
                    $existing = NpdRekening::where('sub_kegiatan_id', $sppdSk->id)
                        ->where('tahun_anggaran', $tahun)
                        ->where('jenis_anggaran', $jenis)
                        ->where('kode_rekening', $kode)
                        ->first();

                    if ($existing) {
                        $existing->update([
                            'nama_program' => $cleanProgram ?: $existing->nama_program,
                            'uraian' => trim($rrek->uraian),
                            'anggaran' => (float) $rrek->pagu_anggaran,
                        ]);
                    } else {
                        NpdRekening::create([
                            'sub_kegiatan_id' => $sppdSk->id,
                            'tahun_anggaran' => $tahun,
                            'jenis_anggaran' => $jenis,
                            'nama_program' => $cleanProgram,
                            'kode_rekening' => $kode,
                            'uraian' => trim($rrek->uraian),
                            'anggaran' => (float) $rrek->pagu_anggaran,
                            'urutan' => $urutan++,
                        ]);
                    }
                    $syncedRekCount++;
                }
            }
        });

        if ($syncedRekCount === 0) {
            return back()->withErrors([
                'sync' => "Kode Sub Kegiatan yang dipilih belum ditemukan pada data {$jenisLabel} TA {$tahun}. Pastikan Kode Sub Kegiatan di Master SPPD sama dengan di RKA {$jenisLabel}.",
            ]);
        }

        return back()->with(
            'success',
            "Berhasil menyinkronkan {$syncedRekCount} rekening dari {$syncedSkCount} Sub Kegiatan ({$jenisLabel} TA {$tahun})."
        );
    }

    public function updateRekening(Request $request, NpdRekening $npdRekening): RedirectResponse
    {
        $validated = $request->validate([
            'nama_program' => ['nullable', 'string', 'max:255'],
            'kode_rekening' => ['required', 'string', 'max:60'],
            'uraian' => ['required', 'string', 'max:255'],
            'anggaran' => ['required', 'numeric', 'min:0'],
        ]);

        $npdRekening->update([
            'nama_program' => ! empty($validated['nama_program']) ? trim($validated['nama_program']) : $npdRekening->nama_program,
            'kode_rekening' => trim($validated['kode_rekening']),
            'uraian' => trim($validated['uraian']),
            'anggaran' => (float) $validated['anggaran'],
        ]);

        return back()->with('success', 'Pagu rekening berhasil diperbarui.');
    }

    public function destroyRekening(NpdRekening $npdRekening): RedirectResponse
    {
        $npdRekening->delete();

        return back()->with('success', 'Rekening pagu berhasil dihapus.');
    }

    public function parseSipdPdf(Request $request): JsonResponse
    {
        $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        try {
            $parser = new PdfParser;
            $pdf = $parser->parseFile($request->file('pdf')->getRealPath());
            $rawText = $pdf->getText();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Gagal membaca file PDF. Pastikan file adalah PDF teks asli dari SIPD-RI (bukan hasil scan gambar).',
            ], 422);
        }

        $parsed = self::extractSipdRkaData($rawText);

        if (count($parsed['items']) === 0) {
            return response()->json([
                'message' => 'Tidak ditemukan baris kode rekening belanja (6 segmen, misal 5.1.02.xx.xxx.xxxxx) pada PDF ini. Pastikan file merupakan Formulir RKA-BELANJA / DPA-BELANJA SKPD dari SIPD-RI.',
            ], 422);
        }

        $matchedSubId = null;
        if (! empty($parsed['kode_sub_kegiatan'])) {
            $kodeNormalized = trim($parsed['kode_sub_kegiatan']);
            $matched = SppdSubKegiatan::where('kode_sub_kegiatan', $kodeNormalized)->first();
            if (! $matched) {
                $digitsOnly = preg_replace('/\D/', '', $kodeNormalized);
                $matched = SppdSubKegiatan::all()->first(
                    fn (SppdSubKegiatan $sk) => preg_replace('/\D/', '', (string) $sk->kode_sub_kegiatan) === $digitsOnly
                );
            }
            $matchedSubId = $matched?->id;
        }

        return response()->json([
            'tahun_anggaran' => $parsed['tahun_anggaran'],
            'nama_program' => $parsed['nama_program'],
            'kode_sub_kegiatan' => $parsed['kode_sub_kegiatan'],
            'nama_sub_kegiatan' => $parsed['nama_sub_kegiatan'],
            'matched_sub_kegiatan_id' => $matchedSubId,
            'total_anggaran' => $parsed['total_anggaran'],
            'items' => $parsed['items'],
        ]);
    }

    /**
     * Ekstrak metadata & daftar rekening belanja (level sub rincian objek, 6 segmen)
     * dari teks PDF RKA-BELANJA / DPA-BELANJA SKPD SIPD-RI.
     *
     * @return array{
     *     tahun_anggaran: ?int,
     *     nama_program: ?string,
     *     kode_sub_kegiatan: ?string,
     *     nama_sub_kegiatan: ?string,
     *     total_anggaran: float,
     *     items: array<int, array{kode_rekening: string, uraian: string, anggaran: float}>
     * }
     */
    public static function extractSipdRkaData(string $rawText): array
    {
        $text = str_replace(["\r\n", "\r"], "\n", $rawText);

        $tahunAnggaran = null;
        if (preg_match('/Tahun\s+Anggaran\s+(\d{4})/i', $text, $m)) {
            $tahunAnggaran = (int) $m[1];
        }

        $namaProgram = null;
        if (preg_match('/^Program\s*:\s*(?:[\d.]+\s+)?(.+)$/mi', $text, $m)) {
            $namaProgram = trim(preg_replace('/\s+/', ' ', $m[1]));
        }

        $kodeSubKegiatan = null;
        $namaSubKegiatan = null;
        if (preg_match('/^Sub\s+Kegiatan\s*:\s*([\d.]+)\s+(.+)$/mi', $text, $m)) {
            $kodeSubKegiatan = trim($m[1]);
            $namaSubKegiatan = trim(preg_replace('/\s+/', ' ', $m[2]));
        }

        $lines = explode("\n", $text);
        $lineCount = count($lines);
        $itemsByKode = [];

        $parseIdr = static function (string $val): float {
            $cleaned = preg_replace('/[^\d.,]/', '', $val);
            $cleaned = str_replace('.', '', $cleaned);
            $cleaned = str_replace(',', '.', $cleaned);

            return round((float) $cleaned, 2);
        };

        $extractTrailingAmount = static function (string $segment) use ($parseIdr): ?array {
            // 1. Format 2-kolom SIPD-RI (Sebelum | Sesudah | Bertambah/(Berkurang)) -> ambil Sesudah
            if (preg_match('/^(.*?)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+\(?-?[\d.]+,\d{2}\)?\s*$/', $segment, $rm)) {
                return [trim($rm[1]), $parseIdr($rm[3])];
            }
            // 2. Format 1-kolom SIPD-RI dengan prefix Rp.
            if (preg_match('/^(.*?)\s*Rp\.?\s*([\d.]+(?:,\d{1,2})?)\s*$/i', $segment, $rm)) {
                return [trim($rm[1]), $parseIdr($rm[2])];
            }
            // 3. Fallback angka desimal Indonesia tanpa Rp.
            if (preg_match('/^(.*?)\s+([\d.]+,\d{2})\s*$/', $segment, $rm)) {
                return [trim($rm[1]), $parseIdr($rm[2])];
            }

            return null;
        };

        for ($i = 0; $i < $lineCount; $i++) {
            $line = trim($lines[$i]);
            if ($line === '') {
                continue;
            }

            // Cocokkan kode rekening level 6 (Sub Rincian Objek), termasuk jika menempel tanpa spasi pada cetakan 2-kolom SIPD-RI
            if (! preg_match('/^(\d+\.\d+\.\d+\.\d+\.\d+\.\d+)(?=\s|[A-Za-z]|$)\s*(.+)$/', $line, $m)) {
                continue;
            }

            $kode = trim($m[1]);
            $rest = trim($m[2]);
            $uraianParts = [];
            $anggaran = null;

            $sameLineMatch = $extractTrailingAmount($rest);
            if ($sameLineMatch !== null) {
                $uraianParts[] = $sameLineMatch[0];
                $anggaran = $sameLineMatch[1];
            } else {
                $uraianParts[] = $rest;
                // Cek maksimal 3 baris berikutnya jika uraian terpotong multi-baris
                for ($j = $i + 1; $j < min($lineCount, $i + 4); $j++) {
                    $nextLine = trim($lines[$j]);
                    if ($nextLine === '') {
                        continue;
                    }
                    if (
                        preg_match('/^\d+\.\d+/', $nextLine) ||
                        str_starts_with($nextLine, '[ # ]') ||
                        str_starts_with($nextLine, '[ - ]') ||
                        stripos($nextLine, 'SIPD-RI:') === 0
                    ) {
                        break;
                    }
                    $nextLineMatch = $extractTrailingAmount($nextLine);
                    if ($nextLineMatch !== null) {
                        if ($nextLineMatch[0] !== '') {
                            $uraianParts[] = $nextLineMatch[0];
                        }
                        $anggaran = $nextLineMatch[1];
                        $i = $j;
                        break;
                    }
                    $uraianParts[] = $nextLine;
                }
            }

            if ($anggaran === null) {
                continue;
            }

            $uraian = trim(preg_replace('/\s+/', ' ', implode(' ', $uraianParts)));
            if ($uraian === '') {
                continue;
            }

            $itemsByKode[$kode] = [
                'kode_rekening' => $kode,
                'uraian' => $uraian,
                'anggaran' => $anggaran,
            ];
        }

        $items = array_values($itemsByKode);
        $totalAnggaran = array_reduce($items, fn (float $carry, array $it) => $carry + $it['anggaran'], 0.0);

        return [
            'tahun_anggaran' => $tahunAnggaran,
            'nama_program' => $namaProgram,
            'kode_sub_kegiatan' => $kodeSubKegiatan,
            'nama_sub_kegiatan' => $namaSubKegiatan,
            'total_anggaran' => round($totalAnggaran, 2),
            'items' => $items,
        ];
    }

    // =========================================================================
    // CRUD NOTA PENCAIRAN DANA (NPD)
    // =========================================================================

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_npd' => ['nullable', 'string', 'max:80'],
            'tanggal_npd' => ['nullable', 'date'],
            'sub_kegiatan_id' => ['required', 'exists:sppd_sub_kegiatans,id'],
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2100'],
            'nama_program' => ['required', 'string', 'max:255'],
            'pptk_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'pengguna_anggaran_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'potongan_ppn' => ['nullable', 'numeric', 'min:0'],
            'potongan_pph21' => ['nullable', 'numeric', 'min:0'],
            'potongan_pph22' => ['nullable', 'numeric', 'min:0'],
            'potongan_pph23' => ['nullable', 'numeric', 'min:0'],
            'potongan_pph4_2' => ['nullable', 'numeric', 'min:0'],
            'linked_sppd_dalam_kota_batches' => ['nullable', 'array'],
            'linked_sppd_luar_kota_batches' => ['nullable', 'array'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.npd_rekening_id' => ['nullable', 'exists:npd_rekenings,id'],
            'items.*.kode_rekening' => ['required', 'string', 'max:60'],
            'items.*.uraian' => ['required', 'string', 'max:255'],
            'items.*.anggaran' => ['required', 'numeric', 'min:0'],
            'items.*.akumulasi_sebelumnya' => ['required', 'numeric', 'min:0'],
            'items.*.pencairan_saat_ini' => ['required', 'numeric', 'min:0'],
        ]);

        // Validasi anti over-budget
        foreach ($validated['items'] as $idx => $row) {
            $sisa = (float) $row['anggaran'] - (float) $row['akumulasi_sebelumnya'] - (float) $row['pencairan_saat_ini'];
            if ($sisa < -0.01) {
                $no = $idx + 1;

                return back()->withErrors([
                    'items' => "Baris #{$no} ({$row['kode_rekening']}) melebihi sisa pagu anggaran.",
                ]);
            }
        }

        $totalPencairan = collect($validated['items'])->sum(fn ($r) => (float) $r['pencairan_saat_ini']);
        if ($totalPencairan <= 0) {
            return back()->withErrors([
                'items' => 'Minimal satu rekening harus memiliki nominal Pencairan Saat Ini lebih dari 0.',
            ]);
        }

        DB::transaction(function () use ($validated): void {
            $totalAnggaran = 0.0;
            $totalAkumulasi = 0.0;
            $totalPencairan = 0.0;
            $totalSisa = 0.0;

            foreach ($validated['items'] as $row) {
                $ang = (float) $row['anggaran'];
                $akum = (float) $row['akumulasi_sebelumnya'];
                $cair = (float) $row['pencairan_saat_ini'];
                $sisa = $ang - $akum - $cair;

                $totalAnggaran += $ang;
                $totalAkumulasi += $akum;
                $totalPencairan += $cair;
                $totalSisa += $sisa;
            }

            $ppn = (float) ($validated['potongan_ppn'] ?? 0);
            $pph21 = (float) ($validated['potongan_pph21'] ?? 0);
            $pph22 = (float) ($validated['potongan_pph22'] ?? 0);
            $pph23 = (float) ($validated['potongan_pph23'] ?? 0);
            $pph42 = (float) ($validated['potongan_pph4_2'] ?? 0);
            $totalPotongan = $ppn + $pph21 + $pph22 + $pph23 + $pph42;
            $jumlahDibayarkan = max(0.0, $totalPencairan - $totalPotongan);

            $npdCount = Npd::where('tahun_anggaran', $validated['tahun_anggaran'])->count() + 1;
            $nomorNpd = ! empty($validated['nomor_npd'])
                ? trim($validated['nomor_npd'])
                : 'NPD-'.str_pad((string) $npdCount, 3, '0', STR_PAD_LEFT).'/'.$validated['tahun_anggaran'];

            $npd = Npd::create([
                'nomor_npd' => $nomorNpd,
                'tanggal_npd' => $validated['tanggal_npd'] ?? null,
                'sub_kegiatan_id' => (int) $validated['sub_kegiatan_id'],
                'tahun_anggaran' => (int) $validated['tahun_anggaran'],
                'nama_program' => trim($validated['nama_program']),
                'pptk_id' => $validated['pptk_id'] ?? null,
                'pengguna_anggaran_id' => $validated['pengguna_anggaran_id'] ?? null,
                'total_anggaran' => $totalAnggaran,
                'total_akumulasi_sebelumnya' => $totalAkumulasi,
                'total_pencairan_saat_ini' => $totalPencairan,
                'total_sisa' => $totalSisa,
                'potongan_ppn' => $ppn,
                'potongan_pph21' => $pph21,
                'potongan_pph22' => $pph22,
                'potongan_pph23' => $pph23,
                'potongan_pph4_2' => $pph42,
                'total_potongan' => $totalPotongan,
                'jumlah_dibayarkan' => $jumlahDibayarkan,
                'linked_sppd_dalam_kota_batches' => array_values(array_unique($validated['linked_sppd_dalam_kota_batches'] ?? [])),
                'linked_sppd_luar_kota_batches' => array_values(array_unique($validated['linked_sppd_luar_kota_batches'] ?? [])),
                'catatan' => ! empty($validated['catatan']) ? trim($validated['catatan']) : null,
            ]);

            $urutan = 1;
            foreach ($validated['items'] as $row) {
                $ang = (float) $row['anggaran'];
                $akum = (float) $row['akumulasi_sebelumnya'];
                $cair = (float) $row['pencairan_saat_ini'];

                NpdItem::create([
                    'npd_id' => $npd->id,
                    'npd_rekening_id' => $row['npd_rekening_id'] ?? null,
                    'urutan' => $urutan++,
                    'kode_rekening' => trim($row['kode_rekening']),
                    'uraian' => trim($row['uraian']),
                    'anggaran' => $ang,
                    'akumulasi_sebelumnya' => $akum,
                    'pencairan_saat_ini' => $cair,
                    'sisa' => $ang - $akum - $cair,
                ]);
            }
        });

        return back()->with('success', 'Nota Pencairan Dana (NPD) berhasil disimpan.');
    }

    public function destroy(Npd $npd): RedirectResponse
    {
        $npd->delete();

        return back()->with('success', 'Nota Pencairan Dana (NPD) berhasil dihapus.');
    }

    /**
     * Preview / Download PDF Nota Pencairan Dana (NPD) 1 halaman A4 presisi.
     */
    public function downloadPdf(Request $request, Npd $npd): SymfonyResponse
    {
        $npd->load(['subKegiatan', 'pptk', 'penggunaAnggaran', 'items']);

        $defaultKadin = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->first();
        $defaultPptk = SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)->first();

        $pa = $npd->penggunaAnggaran ?? $defaultKadin;
        $pptk = $npd->pptk ?? $defaultPptk;

        $tahunCetak = (int) date('Y');
        $tanggalIndramayu = 'Indramayu, &nbsp;............................. '.$tahunCetak;

        $safeNomor = preg_replace('/[^A-Za-z0-9\-_]/', '_', $npd->nomor_npd ?: 'NPD_'.$npd->id);

        $pdf = Pdf::loadView('pdf.npd', [
            'npd' => $npd,
            'paNama' => strtoupper($pa?->nama ?? '-'),
            'paNip' => self::formatNipSpaced($pa?->nip),
            'pptkNama' => strtoupper($pptk?->nama ?? '-'),
            'pptkNip' => self::formatNipSpaced($pptk?->nip),
            'tanggalIndramayuHtml' => $tanggalIndramayu,
            'terbilangDiminta' => SppdDalamKotaController::formatTerbilangRupiah($npd->total_pencairan_saat_ini),
            'terbilangDibayarkan' => SppdDalamKotaController::formatTerbilangRupiah($npd->jumlah_dibayarkan),
        ])->setPaper('a4', 'portrait');

        if ($request->boolean('download')) {
            return $pdf->download("NPD_{$safeNomor}.pdf");
        }

        return $pdf->stream("NPD_{$safeNomor}.pdf");
    }
}
