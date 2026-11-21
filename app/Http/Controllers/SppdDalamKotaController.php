<?php

namespace App\Http\Controllers;

use App\Models\SppdDalamKota;
use App\Models\SppdDalamKotaParticipant;
use App\Models\SppdDpa;
use App\Models\SppdPegawai;
use App\Models\SppdPejabat;
use App\Models\SppdSubKegiatan;
use App\Models\SppdZonasi;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class SppdDalamKotaController extends Controller
{
    /**
     * Konversi angka ke kalimat Terbilang Bahasa Indonesia.
     */
    private static function terbilangKata(float|int $nilai): string
    {
        $nilai = abs((int) round($nilai));
        $huruf = [
            '', 'satu', 'dua', 'tiga', 'empat', 'lima',
            'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas',
        ];

        if ($nilai < 12) {
            return ' '.$huruf[$nilai];
        }
        if ($nilai < 20) {
            return self::terbilangKata($nilai - 10).' belas';
        }
        if ($nilai < 100) {
            return self::terbilangKata((int) floor($nilai / 10)).' puluh'.self::terbilangKata($nilai % 10);
        }
        if ($nilai < 200) {
            return ' seratus'.self::terbilangKata($nilai - 100);
        }
        if ($nilai < 1000) {
            return self::terbilangKata((int) floor($nilai / 100)).' ratus'.self::terbilangKata($nilai % 100);
        }
        if ($nilai < 2000) {
            return ' seribu'.self::terbilangKata($nilai - 1000);
        }
        if ($nilai < 1000000) {
            return self::terbilangKata((int) floor($nilai / 1000)).' ribu'.self::terbilangKata($nilai % 1000);
        }
        if ($nilai < 1000000000) {
            return self::terbilangKata((int) floor($nilai / 1000000)).' juta'.self::terbilangKata($nilai % 1000000);
        }
        if ($nilai < 1000000000000) {
            return self::terbilangKata((int) floor($nilai / 1000000000)).' miliar'.self::terbilangKata($nilai % 1000000000);
        }

        return self::terbilangKata((int) floor($nilai / 1000000000000)).' triliun'.self::terbilangKata($nilai % 1000000000000);
    }

    public static function formatTerbilangRupiah(float|int $nominal): string
    {
        $angka = (int) round($nominal);
        if ($angka <= 0) {
            return 'NOL RUPIAH';
        }

        $kata = trim(preg_replace('/\s+/', ' ', self::terbilangKata($angka)));

        return strtoupper($kata.' RUPIAH');
    }

    /**
     * Format tanggal ke Bahasa Indonesia (contoh: 27 Oktober 2026).
     */
    private static function formatIndoDate(string|Carbon|null $date): string
    {
        if (! $date) {
            return '-';
        }
        $c = $date instanceof Carbon ? $date : Carbon::parse($date);
        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        return $c->format('j').' '.($months[(int) $c->format('n')] ?? $c->format('F')).' '.$c->format('Y');
    }

    /**
     * Format nama hari ke Bahasa Indonesia (contoh: Selasa).
     */
    private static function formatIndoDayName(string|Carbon|null $date): string
    {
        if (! $date) {
            return '-';
        }
        $c = $date instanceof Carbon ? $date : Carbon::parse($date);
        $days = [
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
        ];

        return $days[(int) $c->dayOfWeek] ?? $c->format('l');
    }

    /**
     * Format NIP dengan spasi standar ASN (19700919 200701 2 009).
     */
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

    /**
     * Format Pangkat & Golongan pada laporan SPT (contoh: Pengatur - II/d).
     */
    private static function formatPangkatGol(?string $pangkat, ?string $golongan): string
    {
        $p = trim((string) $pangkat);
        $p = str_ireplace('Tingkat', 'Tk.', $p);
        $g = str_replace('.', '/', trim((string) $golongan));

        if ($p !== '' && $g !== '') {
            return "{$p} - {$g}";
        }

        return $p ?: ($g ?: '-');
    }

    /**
     * Tampilkan halaman utama SPPD Dalam Kota & 7 Master Data.
     */
    public function index(Request $request): Response
    {
        $pegawais = SppdPegawai::orderBy('nama')->get()->map(function (SppdPegawai $p): array {
            $birthDate = $p->tanggal_lahir
                ? Carbon::parse($p->tanggal_lahir)->format('Y-m-d')
                : SppdPegawai::extractBirthDateFromNip($p->nip);

            return [
                'id' => $p->id,
                'nama' => $p->nama,
                'nip' => $p->nip,
                'pangkat' => $p->pangkat,
                'golongan' => $p->golongan,
                'golongan_group' => SppdPegawai::normalizeGolonganGroup($p->golongan),
                'jabatan' => $p->jabatan,
                'tanggal_lahir' => $birthDate,
                'tanggal_lahir_formatted' => $birthDate ? self::formatIndoDate($birthDate) : '-',
                'is_active' => (bool) $p->is_active,
            ];
        })->values();

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

        $kepalaDinasList = $pejabats->where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->map($formatPejabat)->values();
        $pptkList = $pejabats->where('tipe', SppdPejabat::TIPE_PPTK)->map($formatPejabat)->values();
        $bendaharaList = $pejabats->where('tipe', SppdPejabat::TIPE_BENDAHARA)->map($formatPejabat)->values();

        $zonasis = SppdZonasi::orderBy('zona')
            ->orderBy('nama_kecamatan')
            ->orderBy('golongan')
            ->get()
            ->map(fn (SppdZonasi $z): array => [
                'id' => $z->id,
                'nama_kecamatan' => $z->nama_kecamatan,
                'zona' => $z->zona,
                'golongan' => $z->golongan,
                'uang_saku' => (float) $z->uang_saku,
            ])->values();

        $kecamatanOptions = $zonasis
            ->unique('nama_kecamatan')
            ->map(fn (array $z): array => [
                'nama_kecamatan' => $z['nama_kecamatan'],
                'zona' => $z['zona'],
            ])
            ->sortBy('nama_kecamatan')
            ->values();

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

        $dpas = SppdDpa::orderByDesc('is_active')
            ->orderByDesc('tahun_anggaran')
            ->orderByDesc('id')
            ->get()
            ->map(fn (SppdDpa $d): array => [
                'id' => $d->id,
                'nomor_dpa' => $d->nomor_dpa,
                'tanggal_dpa' => $d->tanggal_dpa ? Carbon::parse($d->tanggal_dpa)->format('Y-m-d') : null,
                'tanggal_dpa_formatted' => $d->tanggal_dpa ? self::formatIndoDate($d->tanggal_dpa) : '-',
                'tahun_anggaran' => (int) $d->tahun_anggaran,
                'keterangan' => $d->keterangan,
                'is_active' => (bool) $d->is_active,
            ])->values();

        $allSppds = SppdDalamKota::with(['subKegiatan', 'dpa', 'participants', 'kepalaDinas', 'pptk', 'bendahara'])
            ->orderByDesc('id')
            ->get();

        // Gabungkan data SPPD lama yang masih terpisah per ID (misal BATCH-YYYYMMDD-001, 002, 003) ke dalam 1 Batch berdasarkan Sub Kegiatan
        $defaultSubId = $subKegiatans->first()['id'] ?? null;
        $defaultDpaId = $dpas->first()['id'] ?? null;

        foreach ($allSppds as $item) {
            $needsUpdate = false;
            if (! $item->sub_kegiatan_id && $defaultSubId) {
                $item->sub_kegiatan_id = $defaultSubId;
                $needsUpdate = true;
            }
            if (! $item->dpa_id && $defaultDpaId) {
                $item->dpa_id = $defaultDpaId;
                $needsUpdate = true;
            }
            // Jika format batch_code lama adalah per-id (BATCH-YYYYMMDD-001) maka satukan ke BATCH-001 per sub_kegiatan
            if (! $item->batch_code || preg_match('/^BATCH-\d{8}-\d{3}$/', $item->batch_code)) {
                $skNum = str_pad((string) ($item->sub_kegiatan_id ?: 1), 2, '0', STR_PAD_LEFT);
                $item->batch_code = 'BATCH-SPPD-'.$skNum;
                $needsUpdate = true;
            }
            if ($needsUpdate) {
                $item->saveQuietly();
                $item->load(['subKegiatan', 'dpa']);
            }
        }

        // Kelompokkan ke dalam Batch
        $sppdBatches = $allSppds
            ->groupBy('batch_code')
            ->map(function ($group, string $batchCode): array {
                $sortedItems = $group->sortBy('tanggal_berangkat')->values();
                /** @var SppdDalamKota $first */
                $first = $sortedItems->first();

                $uniqueEmployees = $sortedItems
                    ->flatMap(fn (SppdDalamKota $s) => $s->participants)
                    ->unique(fn (SppdDalamKotaParticipant $pt) => $pt->pegawai_id ?: $pt->nama)
                    ->map(fn (SppdDalamKotaParticipant $pt): array => [
                        'pegawai_id' => $pt->pegawai_id,
                        'nama' => $pt->nama,
                        'nip' => $pt->nip,
                        'pangkat' => $pt->pangkat,
                        'golongan' => $pt->golongan,
                        'jabatan' => $pt->jabatan,
                    ])
                    ->values();

                $uniqueKecamatans = $sortedItems
                    ->map(fn (SppdDalamKota $s) => $s->nama_kecamatan.' ('.$s->zona.')')
                    ->unique()
                    ->values();

                $uniqueTujuans = $sortedItems
                    ->pluck('tujuan')
                    ->unique()
                    ->values();

                $itemsFormatted = $sortedItems->map(function (SppdDalamKota $sppd): array {
                    return [
                        'id' => $sppd->id,
                        'nomor_spt' => $sppd->nomor_spt ?: '800.1.11.1/          /KDP',
                        'tanggal_spt' => Carbon::parse($sppd->tanggal_spt)->format('Y-m-d'),
                        'tanggal_spt_formatted' => self::formatIndoDate($sppd->tanggal_spt),
                        'tanggal_berangkat' => Carbon::parse($sppd->tanggal_berangkat)->format('Y-m-d'),
                        'tanggal_berangkat_formatted' => self::formatIndoDayName($sppd->tanggal_berangkat).', '.self::formatIndoDate($sppd->tanggal_berangkat),
                        'tujuan' => $sppd->tujuan,
                        'nama_kecamatan' => $sppd->nama_kecamatan,
                        'zona' => $sppd->zona,
                        'total_uang_saku' => (float) $sppd->total_uang_saku,
                        'participants' => $sppd->participants->map(fn (SppdDalamKotaParticipant $pt): array => [
                            'id' => $pt->id,
                            'pegawai_id' => $pt->pegawai_id,
                            'urutan' => $pt->urutan,
                            'nama' => $pt->nama,
                            'nip' => $pt->nip,
                            'pangkat' => $pt->pangkat,
                            'golongan' => $pt->golongan,
                            'jabatan' => $pt->jabatan,
                            'uang_saku' => (float) $pt->uang_saku,
                        ])->values()->all(),
                    ];
                })->values()->all();

                $totalUangSakuBatch = (float) $sortedItems->sum('total_uang_saku');

                return [
                    'batch_code' => $batchCode,
                    'spt_count' => $sortedItems->count(),
                    'sub_kegiatan_id' => $first->sub_kegiatan_id,
                    'sub_kegiatan' => $first->subKegiatan ? [
                        'id' => $first->subKegiatan->id,
                        'no_rekening' => $first->subKegiatan->no_rekening,
                        'nama_kegiatan' => $first->subKegiatan->nama_kegiatan,
                        'sub_kegiatan' => $first->subKegiatan->sub_kegiatan,
                        'kode_sub_kegiatan' => $first->subKegiatan->kode_sub_kegiatan,
                    ] : null,
                    'dpa_id' => $first->dpa_id,
                    'dpa' => $first->dpa ? [
                        'id' => $first->dpa->id,
                        'nomor_dpa' => $first->dpa->nomor_dpa,
                        'tahun_anggaran' => $first->dpa->tahun_anggaran,
                        'keterangan' => $first->dpa->keterangan,
                    ] : null,
                    'kepala_dinas_id' => $first->kepala_dinas_id,
                    'pptk_id' => $first->pptk_id,
                    'bendahara_id' => $first->bendahara_id,
                    'kecamatan_list' => $uniqueKecamatans->all(),
                    'tujuan_list' => $uniqueTujuans->all(),
                    'primary_tujuan' => $first->tujuan,
                    'primary_kecamatan' => $first->nama_kecamatan,
                    'first_tanggal_berangkat_formatted' => self::formatIndoDate($sortedItems->first()->tanggal_berangkat),
                    'last_tanggal_berangkat_formatted' => self::formatIndoDate($sortedItems->last()->tanggal_berangkat),
                    'last_tanggal_berangkat' => Carbon::parse($sortedItems->last()->tanggal_berangkat)->format('Y-m-d'),
                    'last_tanggal_spt' => Carbon::parse($sortedItems->last()->tanggal_spt)->format('Y-m-d'),
                    'employees' => $uniqueEmployees->all(),
                    'total_uang_saku' => $totalUangSakuBatch,
                    'terbilang_uang_saku' => self::formatTerbilangRupiah($totalUangSakuBatch),
                    'created_at_formatted' => $first->created_at ? self::formatIndoDate($first->created_at) : '-',
                    'items' => $itemsFormatted,
                ];
            })
            ->values();

        return Inertia::render('sppd-dalam-kota/index', [
            'sppdBatches' => $sppdBatches,
            'lastBatchCode' => session('last_batch_code'),
            'pegawais' => $pegawais,
            'kepalaDinasList' => $kepalaDinasList,
            'pptkList' => $pptkList,
            'bendaharaList' => $bendaharaList,
            'zonasis' => $zonasis,
            'kecamatanOptions' => $kecamatanOptions,
            'subKegiatans' => $subKegiatans,
            'dpas' => $dpas,
            'statistics' => [
                'total_batches' => $sppdBatches->count(),
                'total_sppd' => $allSppds->count(),
                'total_personil_berangkat' => $allSppds->sum(fn ($s) => $s->participants->count()),
                'total_anggaran_uang_saku' => (float) $allSppds->sum('total_uang_saku'),
                'total_pegawai' => $pegawais->count(),
                'total_kecamatan_zonasi' => $kecamatanOptions->count(),
            ],
        ]);
    }

    /**
     * Download PDF Surat Tugas (SPT) menggunakan DomPDF untuk 1 Batch.
     */
    public function downloadBatchPdf(string $batchCode): SymfonyResponse
    {
        $records = SppdDalamKota::with(['subKegiatan', 'dpa', 'participants', 'kepalaDinas'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD tidak ditemukan.');
        }

        $defaultKadin = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->first();

        $logoPath = public_path('indramayu_logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $logoBase64 = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        $sppdList = $records->map(function (SppdDalamKota $sppd) use ($defaultKadin): array {
            $kadin = $sppd->kepalaDinas ?? $defaultKadin;
            $kadinJabatanRaw = trim((string) ($kadin?->jabatan ?? ''));
            $isPlt = str_starts_with(strtolower($kadinJabatanRaw), 'plt');

            $kadinPangkatGol = self::formatPangkatGol(
                $kadin?->pangkat ?? 'Pembina Tk. I',
                $kadin?->golongan ?? 'IV/b'
            );
            $kadinNipFormatted = self::formatNipSpaced($kadin?->nip);

            $rawNomor = trim((string) $sppd->nomor_spt);
            if ($rawNomor === '') {
                $nomorSptHtml = '800.1.11.1/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/KDP';
            } else {
                $nomorSptHtml = e($rawNomor);
            }

            $kegiatanUntuk = $sppd->subKegiatan?->sub_kegiatan
                ?: ($sppd->subKegiatan?->nama_kegiatan ?: 'Koordinasi dan Sinkronisasi Pemantauan Stok, Pasokan dan Harga Pangan Pokok Strategis');
            $tahunAnggaran = $sppd->dpa?->tahun_anggaran
                ?: Carbon::parse($sppd->tanggal_berangkat)->format('Y');

            $participants = $sppd->participants->map(function (SppdDalamKotaParticipant $pt): array {
                $jabatanText = trim((string) $pt->jabatan);
                if ($jabatanText !== '' && ! str_contains(strtolower($jabatanText), 'dkpp')) {
                    $jabatanText .= ' pada DKPP Kab. Indramayu';
                }

                return [
                    'nama' => strtoupper($pt->nama),
                    'pangkat_gol' => self::formatPangkatGol($pt->pangkat, $pt->golongan),
                    'nip' => self::formatNipSpaced($pt->nip),
                    'jabatan' => $jabatanText ?: 'Pelaksana Pada DKPP Kab. Indramayu',
                ];
            })->values()->all();

            return [
                'nomor_spt_html' => $nomorSptHtml,
                'kegiatan_untuk' => $kegiatanUntuk,
                'tahun_anggaran' => $tahunAnggaran,
                'hari_berangkat' => self::formatIndoDayName($sppd->tanggal_berangkat),
                'tanggal_berangkat_indo' => self::formatIndoDate($sppd->tanggal_berangkat),
                'tanggal_spt_indo' => self::formatIndoDate($sppd->tanggal_spt),
                'tujuan' => $sppd->tujuan,
                'nama_kecamatan' => $sppd->nama_kecamatan,
                'participants' => $participants,
                'kadin_prefix' => $isPlt ? 'Plt.' : '',
                'kadin_nama' => $kadin?->nama ?? 'RORY FIRMANSYAH.S.STP.M.Si',
                'kadin_pangkat_gol' => $kadinPangkatGol,
                'kadin_nip' => $kadinNipFormatted,
            ];
        })->values()->all();

        $pdf = Pdf::loadView('pdf.spt-batch', [
            'batchCode' => $batchCode,
            'logoBase64' => $logoBase64,
            'sppdList' => $sppdList,
        ])->setPaper('a4', 'portrait');

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $pdf->download("Surat_Tugas_SPT_{$safeBatch}.pdf");
    }

    /**
     * Download PDF Surat Pernyataan Tanggung Jawab Belanja (SPTJB) menggunakan DomPDF untuk 1 Batch.
     */
    public function downloadBatchSptjbPdf(string $batchCode): SymfonyResponse
    {
        $records = SppdDalamKota::with(['subKegiatan', 'dpa', 'participants', 'kepalaDinas'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD tidak ditemukan.');
        }

        /** @var SppdDalamKota $first */
        $first = $records->first();
        $defaultKadin = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->first();
        $defaultSub = SppdSubKegiatan::where('is_active', true)->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();

        $kadin = $first->kepalaDinas ?? $defaultKadin;
        $sk = $first->subKegiatan ?? $defaultSub;
        $dpa = $first->dpa ?? $defaultDpa;

        $logoPath = public_path('indramayu_logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $logoBase64 = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        $totalUangSaku = (float) $records->sum('total_uang_saku');
        $totalFormatted = number_format($totalUangSaku, 0, ',', '.');
        $terbilangText = self::formatTerbilangRupiah($totalUangSaku);

        $tglDpaStr = $dpa?->tanggal_dpa
            ? self::formatIndoDate($dpa->tanggal_dpa)
            : self::formatIndoDate($first->tanggal_spt);
        $nomorDpaStr = $dpa?->nomor_dpa ?: 'DPA/A.1/2.09.3.27.0.00.10.0000/001/2026';
        $tanggalDanNomorDpa = "{$tglDpaStr}/{$nomorDpaStr}";

        $namaKegiatan = $sk?->nama_kegiatan
            ?: 'Penyediaan dan Penyaluran Pangan Pokok atau Pangan Lainnya sesuai dengan Kebutuhan Daerah Kabupaten/Kota dalam rangka Stabilisasi Pasokan dan Harga Pangan';
        $namaSubKegiatan = $sk?->sub_kegiatan
            ?: 'Koordinasi dan Sinkronisasi Pemantauan Stok, Pasokan dan Harga Pangan Pokok Strategis';
        $kodeSubKegiatan = $sk?->kode_sub_kegiatan ?: '2.09.03.2.01.0014';
        $noRekening = $sk?->no_rekening ?: '5.1.02.04.01.0003';
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $kadinNama = $kadin?->nama ?? 'RORY FIRMANSYAH.S.STP.M.Si';
        $kadinNip = preg_replace('/\D/', '', (string) ($kadin?->nip ?? '')) ?: ($kadin?->nip ?? '197801011997031003');

        $pdf = Pdf::loadView('pdf.sptjb-batch', [
            'batchCode' => $batchCode,
            'logoBase64' => $logoBase64,
            'tanggalDanNomorDpa' => $tanggalDanNomorDpa,
            'namaKegiatan' => $namaKegiatan,
            'namaSubKegiatan' => $namaSubKegiatan,
            'kodeSubKegiatan' => $kodeSubKegiatan,
            'noRekening' => $noRekening,
            'totalFormatted' => $totalFormatted,
            'terbilangText' => $terbilangText,
            'tahunAnggaran' => $tahunAnggaran,
            'kadinNama' => $kadinNama,
            'kadinNip' => $kadinNip,
        ])->setPaper('a4', 'portrait');

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $pdf->download("SPTJB_SPPD_Dalam_Kota_{$safeBatch}.pdf");
    }

    /**
     * Download PDF Laporan C2 (Perincian Pengeluaran Menurut Tanda Bukti Terlampir) menggunakan DomPDF.
     */
    public function downloadBatchC2Pdf(string $batchCode): SymfonyResponse
    {
        $records = SppdDalamKota::with(['subKegiatan', 'dpa', 'participants', 'pptk'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD tidak ditemukan.');
        }

        /** @var SppdDalamKota $first */
        $first = $records->first();
        $defaultPptk = SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)->first();
        $defaultSub = SppdSubKegiatan::where('is_active', true)->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();

        $pptk = $first->pptk ?? $defaultPptk;
        $sk = $first->subKegiatan ?? $defaultSub;
        $dpa = $first->dpa ?? $defaultDpa;

        $totalUangSaku = (float) $records->sum('total_uang_saku');
        $totalFormatted = number_format($totalUangSaku, 0, ',', '.');
        $terbilangText = self::formatTerbilangRupiah($totalUangSaku);

        $rawNomorDpa = trim((string) ($dpa?->nomor_dpa ?: 'A.1/2.09.3.27.0.00.10.0000/001/2026'));
        $nomorDpaDisplay = preg_replace('/^DPA\//i', '', $rawNomorDpa) ?: $rawNomorDpa;

        $namaKegiatan = $sk?->nama_kegiatan
            ?: 'Penyediaan dan Penyaluran Pangan Pokok atau Pangan Lainnya sesuai dengan Kebutuhan Daerah Kabupaten/Kota dalam rangka Stabilisasi Pasokan dan Harga Pangan';
        $namaSubKegiatan = $sk?->sub_kegiatan
            ?: 'Koordinasi dan Sinkronisasi Pemantauan Stok, Pasokan dan Harga Pangan Pokok Strategis';
        $noRekening = $sk?->no_rekening ?: '5.1.02.04.01.0003';
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $rows = [];
        foreach ($records as $sppd) {
            $tglIndo = self::formatIndoDate($sppd->tanggal_berangkat);
            $rawTujuan = trim($sppd->tujuan);
            $tujuanKe = str_starts_with(strtolower($rawTujuan), 'ke ')
                ? $rawTujuan
                : 'Ke '.$rawTujuan;

            foreach ($sppd->participants as $pt) {
                $uangSaku = (float) $pt->uang_saku;
                $rows[] = [
                    'nama' => strtoupper($pt->nama),
                    'nip' => self::formatNipSpaced($pt->nip),
                    'pangkat_gol' => self::formatPangkatGol($pt->pangkat, $pt->golongan),
                    'tanggal_berangkat_indo' => $tglIndo,
                    'tujuan_ke' => $tujuanKe,
                    'nama_kecamatan' => $sppd->nama_kecamatan,
                    'uang_saku_formatted' => number_format($uangSaku, 0, ',', '.'),
                ];
            }
        }

        $pptkNama = strtoupper($pptk?->nama ?? 'DEDEH SUMIATI, S.IP');
        $pptkNip = self::formatNipSpaced($pptk?->nip ?? '197009192007012009');

        $pdf = Pdf::loadView('pdf.c2-batch', [
            'batchCode' => $batchCode,
            'namaKegiatan' => $namaKegiatan,
            'namaSubKegiatan' => $namaSubKegiatan,
            'tahunAnggaran' => $tahunAnggaran,
            'noRekening' => $noRekening,
            'nomorDpaDisplay' => $nomorDpaDisplay,
            'totalFormatted' => $totalFormatted,
            'terbilangText' => $terbilangText,
            'rows' => $rows,
            'pptkNama' => $pptkNama,
            'pptkNip' => $pptkNip,
        ])->setPaper('a4', 'portrait');

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $pdf->download("C2_SPPD_Dalam_Kota_{$safeBatch}.pdf");
    }

    /**
     * Gabungkan beberapa Batch SPPD menjadi 1 Batch.
     */
    public function mergeBatches(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'batch_codes' => ['required', 'array', 'min:2'],
            'batch_codes.*' => ['required', 'string'],
            'target_batch_code' => ['nullable', 'string', 'max:60'],
        ]);

        $codes = $validated['batch_codes'];
        $targetCode = ! empty($validated['target_batch_code'])
            ? trim($validated['target_batch_code'])
            : $codes[0];

        SppdDalamKota::whereIn('batch_code', $codes)->update([
            'batch_code' => $targetCode,
        ]);

        return back()->with(
            'success',
            'Berhasil menggabungkan '.count($codes)." Batch menjadi 1 Batch '{$targetCode}'."
        );
    }

    // =========================================================================
    // 1. MASTER DATA PEGAWAI (TANGGAL LAHIR OTOMATIS DARI NIP)
    // =========================================================================

    public function storePegawai(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:150'],
            'nip' => ['nullable', 'string', 'max:40'],
            'pangkat' => ['nullable', 'string', 'max:100'],
            'golongan' => ['required', 'string', 'max:50'],
            'jabatan' => ['required', 'string', 'max:150'],
            'tanggal_lahir' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $extractedDob = SppdPegawai::extractBirthDateFromNip($validated['nip'] ?? null);
        $tanggalLahir = $extractedDob ?? ($validated['tanggal_lahir'] ?? null);

        $pegawai = SppdPegawai::create([
            'nama' => $validated['nama'],
            'nip' => $validated['nip'] ?? null,
            'pangkat' => $validated['pangkat'] ?? null,
            'golongan' => $validated['golongan'],
            'jabatan' => $validated['jabatan'],
            'tanggal_lahir' => $tanggalLahir,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return back()->with('success', "Master Pegawai '{$pegawai->nama}' berhasil ditambahkan.");
    }

    public function updatePegawai(Request $request, SppdPegawai $pegawai): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:150'],
            'nip' => ['nullable', 'string', 'max:40'],
            'pangkat' => ['nullable', 'string', 'max:100'],
            'golongan' => ['required', 'string', 'max:50'],
            'jabatan' => ['required', 'string', 'max:150'],
            'tanggal_lahir' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $extractedDob = SppdPegawai::extractBirthDateFromNip($validated['nip'] ?? null);
        $tanggalLahir = $extractedDob ?? ($validated['tanggal_lahir'] ?? $pegawai->tanggal_lahir);

        $pegawai->update([
            'nama' => $validated['nama'],
            'nip' => $validated['nip'] ?? null,
            'pangkat' => $validated['pangkat'] ?? null,
            'golongan' => $validated['golongan'],
            'jabatan' => $validated['jabatan'],
            'tanggal_lahir' => $tanggalLahir,
            'is_active' => (bool) ($validated['is_active'] ?? $pegawai->is_active),
        ]);

        return back()->with('success', "Data Pegawai '{$pegawai->nama}' berhasil diperbarui.");
    }

    public function destroyPegawai(SppdPegawai $pegawai): RedirectResponse
    {
        $nama = $pegawai->nama;
        $pegawai->delete();

        return back()->with('success', "Master Pegawai '{$nama}' berhasil dihapus.");
    }

    // =========================================================================
    // 2, 3, 4. MASTER DATA PEJABAT (KEPALA DINAS, PPTK, BENDAHARA)
    // =========================================================================

    public function storePejabat(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tipe' => ['required', 'string', 'in:kepala_dinas,pptk,bendahara'],
            'nama' => ['required', 'string', 'max:150'],
            'nip' => ['nullable', 'string', 'max:40'],
            'pangkat' => ['nullable', 'string', 'max:100'],
            'golongan' => ['nullable', 'string', 'max:50'],
            'jabatan' => ['required', 'string', 'max:150'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $pejabat = SppdPejabat::create([
            'tipe' => $validated['tipe'],
            'nama' => $validated['nama'],
            'nip' => $validated['nip'] ?? null,
            'pangkat' => $validated['pangkat'] ?? null,
            'golongan' => $validated['golongan'] ?? null,
            'jabatan' => $validated['jabatan'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        $label = match ($pejabat->tipe) {
            'kepala_dinas' => 'Kepala Dinas',
            'pptk' => 'PPTK',
            default => 'Bendahara',
        };

        return back()->with('success', "Master {$label} '{$pejabat->nama}' berhasil ditambahkan.");
    }

    public function updatePejabat(Request $request, SppdPejabat $pejabat): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:150'],
            'nip' => ['nullable', 'string', 'max:40'],
            'pangkat' => ['nullable', 'string', 'max:100'],
            'golongan' => ['nullable', 'string', 'max:50'],
            'jabatan' => ['required', 'string', 'max:150'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $pejabat->update([
            'nama' => $validated['nama'],
            'nip' => $validated['nip'] ?? null,
            'pangkat' => $validated['pangkat'] ?? null,
            'golongan' => $validated['golongan'] ?? null,
            'jabatan' => $validated['jabatan'],
            'is_active' => (bool) ($validated['is_active'] ?? $pejabat->is_active),
        ]);

        return back()->with('success', "Data Pejabat '{$pejabat->nama}' berhasil diperbarui.");
    }

    public function destroyPejabat(SppdPejabat $pejabat): RedirectResponse
    {
        $nama = $pejabat->nama;
        $pejabat->delete();

        return back()->with('success', "Data Pejabat '{$nama}' berhasil dihapus.");
    }

    // =========================================================================
    // 5. MASTER DATA ZONASI (KECAMATAN, ZONA, GOLONGAN, UANG SAKU)
    // =========================================================================

    public function storeZonasi(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_kecamatan' => ['required', 'string', 'max:100'],
            'zona' => ['required', 'string', 'max:50'],
            'golongan' => ['required', 'string', 'max:50'],
            'uang_saku' => ['required', 'numeric', 'min:0'],
        ]);

        $zonasi = SppdZonasi::updateOrCreate(
            [
                'nama_kecamatan' => trim($validated['nama_kecamatan']),
                'golongan' => trim($validated['golongan']),
            ],
            [
                'zona' => trim($validated['zona']),
                'uang_saku' => (float) $validated['uang_saku'],
            ]
        );

        return back()->with('success', "Master Zonasi Kecamatan '{$zonasi->nama_kecamatan}' ({$zonasi->golongan}) berhasil disimpan.");
    }

    public function updateZonasi(Request $request, SppdZonasi $zonasi): RedirectResponse
    {
        $validated = $request->validate([
            'nama_kecamatan' => ['required', 'string', 'max:100'],
            'zona' => ['required', 'string', 'max:50'],
            'golongan' => ['required', 'string', 'max:50'],
            'uang_saku' => ['required', 'numeric', 'min:0'],
        ]);

        $zonasi->update([
            'nama_kecamatan' => trim($validated['nama_kecamatan']),
            'zona' => trim($validated['zona']),
            'golongan' => trim($validated['golongan']),
            'uang_saku' => (float) $validated['uang_saku'],
        ]);

        return back()->with('success', "Zonasi Kecamatan '{$zonasi->nama_kecamatan}' berhasil diperbarui.");
    }

    public function destroyZonasi(SppdZonasi $zonasi): RedirectResponse
    {
        $info = "{$zonasi->nama_kecamatan} ({$zonasi->golongan})";
        $zonasi->delete();

        return back()->with('success', "Data Zonasi '{$info}' berhasil dihapus.");
    }

    // =========================================================================
    // 6. MASTER DATA SUB KEGIATAN
    // =========================================================================

    public function storeSubKegiatan(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'no_rekening' => ['required', 'string', 'max:100'],
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'sub_kegiatan' => ['required', 'string', 'max:255'],
            'kode_sub_kegiatan' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $sk = SppdSubKegiatan::create([
            'no_rekening' => trim($validated['no_rekening']),
            'nama_kegiatan' => trim($validated['nama_kegiatan']),
            'sub_kegiatan' => trim($validated['sub_kegiatan']),
            'kode_sub_kegiatan' => trim($validated['kode_sub_kegiatan']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return back()->with('success', "Master Sub Kegiatan '{$sk->sub_kegiatan}' berhasil ditambahkan.");
    }

    public function updateSubKegiatan(Request $request, SppdSubKegiatan $subKegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'no_rekening' => ['required', 'string', 'max:100'],
            'nama_kegiatan' => ['required', 'string', 'max:255'],
            'sub_kegiatan' => ['required', 'string', 'max:255'],
            'kode_sub_kegiatan' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $subKegiatan->update([
            'no_rekening' => trim($validated['no_rekening']),
            'nama_kegiatan' => trim($validated['nama_kegiatan']),
            'sub_kegiatan' => trim($validated['sub_kegiatan']),
            'kode_sub_kegiatan' => trim($validated['kode_sub_kegiatan']),
            'is_active' => (bool) ($validated['is_active'] ?? $subKegiatan->is_active),
        ]);

        return back()->with('success', "Data Sub Kegiatan '{$subKegiatan->sub_kegiatan}' berhasil diperbarui.");
    }

    public function destroySubKegiatan(SppdSubKegiatan $subKegiatan): RedirectResponse
    {
        $nama = $subKegiatan->sub_kegiatan;
        $subKegiatan->delete();

        return back()->with('success', "Master Sub Kegiatan '{$nama}' berhasil dihapus.");
    }

    // =========================================================================
    // 7. MASTER DATA NOMOR DPA
    // =========================================================================

    public function storeDpa(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_dpa' => ['required', 'string', 'max:150'],
            'tanggal_dpa' => ['nullable', 'date'],
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2099'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $dpa = SppdDpa::create([
            'nomor_dpa' => trim($validated['nomor_dpa']),
            'tanggal_dpa' => $validated['tanggal_dpa'] ?? null,
            'tahun_anggaran' => (int) $validated['tahun_anggaran'],
            'keterangan' => ! empty($validated['keterangan']) ? trim($validated['keterangan']) : null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return back()->with('success', "Master Nomor DPA '{$dpa->nomor_dpa}' berhasil ditambahkan.");
    }

    public function updateDpa(Request $request, SppdDpa $dpa): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_dpa' => ['required', 'string', 'max:150'],
            'tanggal_dpa' => ['nullable', 'date'],
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2099'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $dpa->update([
            'nomor_dpa' => trim($validated['nomor_dpa']),
            'tanggal_dpa' => $validated['tanggal_dpa'] ?? null,
            'tahun_anggaran' => (int) $validated['tahun_anggaran'],
            'keterangan' => ! empty($validated['keterangan']) ? trim($validated['keterangan']) : null,
            'is_active' => (bool) ($validated['is_active'] ?? $dpa->is_active),
        ]);

        return back()->with('success', "Master Nomor DPA '{$dpa->nomor_dpa}' berhasil diperbarui.");
    }

    public function destroyDpa(SppdDpa $dpa): RedirectResponse
    {
        $nomor = $dpa->nomor_dpa;
        $dpa->delete();

        return back()->with('success', "Master Nomor DPA '{$nomor}' berhasil dihapus.");
    }

    // =========================================================================
    // 8. TRANSAKSI SPPD DALAM KOTA (DISIMPAN KE DALAM BATCH)
    // =========================================================================

    public function storeSppd(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'batch_code' => ['nullable', 'string', 'max:60'],
            'sub_kegiatan_id' => ['required', 'exists:sppd_sub_kegiatans,id'],
            'dpa_id' => ['nullable', 'exists:sppd_dpas,id'],
            'batches' => ['required', 'array', 'min:1'],
            'batches.*.sub_kegiatan_id' => ['nullable', 'exists:sppd_sub_kegiatans,id'],
            'batches.*.dpa_id' => ['nullable', 'exists:sppd_dpas,id'],
            'batches.*.nomor_spt' => ['nullable', 'string', 'max:100'],
            'batches.*.tanggal_berangkat' => ['required', 'date'],
            'batches.*.tanggal_spt' => ['required', 'date'],
            'batches.*.tujuan' => ['required', 'string', 'max:1000'],
            'batches.*.nama_kecamatan' => ['required', 'string', 'max:100'],
            'batches.*.kepala_dinas_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'batches.*.pptk_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'batches.*.bendahara_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'batches.*.participants' => ['required', 'array', 'min:1'],
            'batches.*.participants.*.pegawai_id' => ['required', 'exists:sppd_pegawais,id'],
            'batches.*.participants.*.tanggal_berangkat' => ['required', 'date'],
            'batches.*.participants.*.tanggal_spt' => ['required', 'date'],
            'batches.*.participants.*.tujuan' => ['required', 'string', 'max:1000'],
            'batches.*.participants.*.nama_kecamatan' => ['required', 'string', 'max:100'],
        ], [
            'sub_kegiatan_id.required' => 'Silakan pilih Sub Kegiatan terlebih dahulu sebelum menyimpan SPPD.',
            'batches.required' => 'Data SPPD wajib diisi minimal 1 perjalanan.',
            'batches.*.participants.required' => 'Pilih minimal 1 pegawai yang berangkat.',
            'batches.*.participants.*.pegawai_id.required' => 'Nama pegawai pada setiap baris wajib dipilih.',
        ]);

        $allZonasi = SppdZonasi::all();
        $allPegawai = SppdPegawai::all()->keyBy('id');

        $defaultKadin = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->where('is_active', true)->first();
        $defaultPptk = SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)->where('is_active', true)->first();
        $defaultBendahara = SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)->where('is_active', true)->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();

        $rawBatchCode = ! empty($validated['batch_code']) ? trim($validated['batch_code']) : '';
        if ($rawBatchCode === '' || $rawBatchCode === 'NEW') {
            $batchCount = SppdDalamKota::distinct('batch_code')->count('batch_code') + 1;
            $batchCode = 'BATCH-SPPD-'.str_pad((string) $batchCount, 2, '0', STR_PAD_LEFT).'-'.strtoupper(Str::random(2));
        } else {
            $batchCode = $rawBatchCode;
        }

        $createdCount = 0;
        $totalParticipantsCount = 0;

        DB::transaction(function () use (
            $validated,
            $batchCode,
            $allZonasi,
            $allPegawai,
            $defaultKadin,
            $defaultPptk,
            $defaultBendahara,
            $defaultDpa,
            &$createdCount,
            &$totalParticipantsCount
        ) {
            $globalSubKegiatanId = (int) $validated['sub_kegiatan_id'];
            $globalDpaId = isset($validated['dpa_id']) && $validated['dpa_id']
                ? (int) $validated['dpa_id']
                : $defaultDpa?->id;

            foreach ($validated['batches'] as $batch) {
                $kecName = trim($batch['nama_kecamatan']);
                $matchedZonaObj = $allZonasi->first(
                    fn (SppdZonasi $z) => strcasecmp($z->nama_kecamatan, $kecName) === 0
                );
                $zonaLabel = $matchedZonaObj?->zona ?? 'Zona I';

                $batchSubKegiatanId = ! empty($batch['sub_kegiatan_id'])
                    ? (int) $batch['sub_kegiatan_id']
                    : $globalSubKegiatanId;
                $batchDpaId = ! empty($batch['dpa_id'])
                    ? (int) $batch['dpa_id']
                    : $globalDpaId;

                $sppd = SppdDalamKota::create([
                    'batch_code' => $batchCode,
                    'sub_kegiatan_id' => $batchSubKegiatanId,
                    'dpa_id' => $batchDpaId,
                    'nomor_spt' => ! empty($batch['nomor_spt']) ? trim($batch['nomor_spt']) : null,
                    'tanggal_spt' => $batch['tanggal_spt'],
                    'tanggal_berangkat' => $batch['tanggal_berangkat'],
                    'tujuan' => trim($batch['tujuan']),
                    'nama_kecamatan' => $kecName,
                    'zona' => $zonaLabel,
                    'kepala_dinas_id' => $batch['kepala_dinas_id'] ?? $defaultKadin?->id,
                    'pptk_id' => $batch['pptk_id'] ?? $defaultPptk?->id,
                    'bendahara_id' => $batch['bendahara_id'] ?? $defaultBendahara?->id,
                    'total_uang_saku' => 0,
                ]);

                $totalUangSakuBatch = 0;
                $urutan = 1;

                foreach ($batch['participants'] as $ptData) {
                    /** @var SppdPegawai|null $pegawai */
                    $pegawai = $allPegawai->get((int) $ptData['pegawai_id']);
                    if (! $pegawai) {
                        continue;
                    }

                    $ptKec = trim($ptData['nama_kecamatan'] ?: $kecName);
                    $golNormalized = SppdPegawai::normalizeGolonganGroup($pegawai->golongan);

                    $zonasiTarif = $allZonasi->first(function (SppdZonasi $z) use ($ptKec, $pegawai, $golNormalized) {
                        $sameKec = strcasecmp($z->nama_kecamatan, $ptKec) === 0;
                        if (! $sameKec) {
                            return false;
                        }

                        return strcasecmp($z->golongan, (string) $pegawai->golongan) === 0
                            || strcasecmp($z->golongan, $golNormalized) === 0;
                    });

                    $ptZona = $zonasiTarif?->zona ?? $zonaLabel;
                    $uangSaku = $zonasiTarif ? (float) $zonasiTarif->uang_saku : 0;

                    SppdDalamKotaParticipant::create([
                        'sppd_dalam_kota_id' => $sppd->id,
                        'pegawai_id' => $pegawai->id,
                        'urutan' => $urutan++,
                        'nama' => $pegawai->nama,
                        'nip' => $pegawai->nip,
                        'pangkat' => $pegawai->pangkat,
                        'golongan' => $pegawai->golongan,
                        'jabatan' => $pegawai->jabatan,
                        'tanggal_berangkat' => $ptData['tanggal_berangkat'] ?: $batch['tanggal_berangkat'],
                        'tanggal_spt' => $ptData['tanggal_spt'] ?: $batch['tanggal_spt'],
                        'tujuan' => trim($ptData['tujuan'] ?: $batch['tujuan']),
                        'nama_kecamatan' => $ptKec,
                        'zona' => $ptZona,
                        'uang_saku' => $uangSaku,
                    ]);

                    $totalUangSakuBatch += $uangSaku;
                    $totalParticipantsCount++;
                }

                $sppd->update([
                    'total_uang_saku' => $totalUangSakuBatch,
                ]);

                $createdCount++;
            }
        });

        return back()
            ->with('last_batch_code', $batchCode)
            ->with(
                'success',
                "Berhasil menyimpan {$createdCount} SPPD ke dalam Batch '{$batchCode}' ({$totalParticipantsCount} keberangkatan personil)."
            );
    }

    public function destroyBatch(string $batchCode): RedirectResponse
    {
        SppdDalamKota::where('batch_code', $batchCode)->delete();

        return back()->with('success', "Batch SPPD '{$batchCode}' berhasil dihapus.");
    }

    public function destroySppd(SppdDalamKota $sppd): RedirectResponse
    {
        $sppd->delete();

        return back()->with('success', 'Item SPPD berhasil dihapus dari batch.');
    }
}
