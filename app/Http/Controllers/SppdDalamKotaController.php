<?php

namespace App\Http\Controllers;

use App\Models\RealisasiSubKegiatan;
use App\Models\SppdDalamKota;
use App\Models\SppdDalamKotaParticipant;
use App\Models\SppdDpa;
use App\Models\SppdPegawai;
use App\Models\SppdPejabat;
use App\Models\SppdSubKegiatan;
use App\Models\SppdZonasi;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Smalot\PdfParser\Parser as PdfParser;
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
        $pegawais = SppdPegawai::orderBy('nama')
            ->get()
            ->sortBy([
                [fn (SppdPegawai $p) => SppdPegawai::golonganRank($p->golongan, $p->pangkat), 'desc'],
                ['nama', 'asc'],
            ])
            ->map(function (SppdPegawai $p): array {
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
                        'raw_nomor_spt' => $sppd->nomor_spt,
                        'tanggal_spt' => Carbon::parse($sppd->tanggal_spt)->format('Y-m-d'),
                        'tanggal_spt_formatted' => self::formatIndoDate($sppd->tanggal_spt),
                        'tanggal_berangkat' => Carbon::parse($sppd->tanggal_berangkat)->format('Y-m-d'),
                        'tanggal_berangkat_formatted' => self::formatIndoDayName($sppd->tanggal_berangkat).', '.self::formatIndoDate($sppd->tanggal_berangkat),
                        'tujuan' => $sppd->tujuan,
                        'nama_desa' => $sppd->nama_desa,
                        'nama_kecamatan' => $sppd->nama_kecamatan,
                        'zona' => $sppd->zona,
                        'kepala_dinas_id' => $sppd->kepala_dinas_id,
                        'pptk_id' => $sppd->pptk_id,
                        'bendahara_id' => $sppd->bendahara_id,
                        'total_uang_saku' => (float) $sppd->total_uang_saku,
                        'lhpd_type' => $sppd->lhpd_type,
                        'lhpd_content' => $sppd->lhpd_content,
                        'lhpd_table_data' => $sppd->lhpd_table_data,
                        'lhpd_keterangan' => $sppd->lhpd_keterangan,
                        'has_lhpd' => (bool) ($sppd->lhpd_type && (
                            ($sppd->lhpd_type === 'paragraf' && trim((string) $sppd->lhpd_content) !== '') ||
                            ($sppd->lhpd_type !== 'paragraf' && ! empty($sppd->lhpd_table_data))
                        )),
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
                    'primary_desa' => $first->nama_desa,
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
     * Render dokumen laporan SPPD sebagai PDF (default) atau Microsoft Word (.doc) jika ?format=word.
     *
     * @param  array<string, mixed>  $data
     */
    private function renderDocumentResponse(
        Request $request,
        string $view,
        array $data,
        string $baseFilename
    ): SymfonyResponse {
        if (strtolower((string) $request->query('format', 'pdf')) === 'word') {
            $wordData = $data;

            // Hitung ukuran proporsional logo & perkecil resolusi gambar untuk Word agar tidak membesar
            $logoWidthPx = 68;
            $logoHeightPx = 75;
            $logoPath = public_path('indramayu_logo.png');
            if (file_exists($logoPath)) {
                $imgInfo = @getimagesize($logoPath);
                if (is_array($imgInfo) && $imgInfo[0] > 0 && $imgInfo[1] > 0) {
                    $logoHeightPx = (int) round(($imgInfo[1] / $imgInfo[0]) * $logoWidthPx);
                }

                // Perkecil resolusi PNG ke 2x ukuran cetak (136px) agar Word tidak merender ukuran asli ribuan piksel
                if (function_exists('imagecreatefrompng') && function_exists('imagecreatetruecolor')) {
                    $src = @imagecreatefrompng($logoPath);
                    if ($src !== false) {
                        $srcW = imagesx($src);
                        $srcH = imagesy($src);
                        $targetW = $logoWidthPx;
                        $targetH = $logoHeightPx;
                        $dst = imagecreatetruecolor($targetW, $targetH);
                        imagealphablending($dst, false);
                        imagesavealpha($dst, true);
                        $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
                        imagefilledrectangle($dst, 0, 0, $targetW, $targetH, $transparent);
                        imagecopyresampled($dst, $src, 0, 0, 0, 0, $targetW, $targetH, $srcW, $srcH);
                        ob_start();
                        imagepng($dst);
                        $resizedPng = ob_get_clean();
                        imagedestroy($src);
                        imagedestroy($dst);
                        if (is_string($resizedPng) && $resizedPng !== '') {
                            $wordData['logoBase64'] = 'data:image/png;base64,'.base64_encode($resizedPng);
                        }
                    }
                }
            }

            $logoWidthPt = round($logoWidthPx * 0.75, 1);
            $logoHeightPt = round($logoHeightPx * 0.75, 1);

            $html = view($view, $wordData)->render();

            $wordHeader = <<<'HTML'
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
HTML;
            $html = preg_replace('/<html[^>]*>/i', $wordHeader, $html, 1) ?? $html;

            $wordXml = <<<HTML
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page WordSection1 {
    size: 21.0cm 29.7cm;
    margin: 0.9cm 1.3cm 1.0cm 1.3cm;
    mso-header-margin: 0.4cm;
    mso-footer-margin: 0.4cm;
  }
  div.WordSection1 {
    page: WordSection1;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
  }
  p, div {
    margin-top: 0;
    margin-bottom: 0;
    mso-margin-top-alt: 0pt;
    mso-margin-bottom-alt: 0pt;
  }
  table {
    border-collapse: collapse;
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  img.kop-logo {
    width: {$logoWidthPt}pt !important;
    height: {$logoHeightPt}pt !important;
  }
  /* Kompak khusus halaman SPD (SPPD) di Word agar 1 lembar pas termasuk tanda tangan */
  .meta-right-table {
    margin-bottom: 4pt !important;
    font-size: 9pt !important;
  }
  .meta-right-table td {
    padding: 0 !important;
    line-height: 1.15 !important;
  }
  .spd-table {
    font-size: 9pt !important;
    margin-bottom: 6pt !important;
  }
  .spd-table td {
    padding: 2pt 5pt !important;
    line-height: 1.15 !important;
  }
  .inner-list-table td {
    padding: 0 !important;
    line-height: 1.15 !important;
  }
  .footer-table {
    font-size: 9pt !important;
    margin-top: 4pt !important;
  }
  .footer-table td {
    line-height: 1.18 !important;
  }
  .lhpd-page {
    position: static !important;
    height: auto !important;
  }
  .lhpd-page .ttd-wrapper {
    position: static !important;
    margin-top: 240pt !important;
    padding-left: 32pt !important;
  }
</style>
</head>
HTML;
            $html = str_ireplace('</head>', $wordXml, $html);

            // Bungkus isi <body> di dalam <div class="WordSection1"> agar margin & ukuran kertas A4 terbaca Word
            $html = preg_replace('/<body[^>]*>/i', '$0<div class="WordSection1">', $html, 1) ?? $html;
            $html = str_ireplace('</body>', '</div></body>', $html);

            // Paksa atribut width & height eksplisit pada tag <img> logo agar Word tidak membesarkan gambar
            $html = preg_replace(
                '/<img([^>]*class="kop-logo"[^>]*)>/i',
                '<img$1 width="'.$logoWidthPx.'" height="'.$logoHeightPx.'" style="width:'.$logoWidthPt.'pt;height:'.$logoHeightPt.'pt;">',
                $html
            ) ?? $html;

            // Pastikan tabel full-width punya atribut HTML width="100%" yang dipatuhi Word
            $fullWidthClasses = 'kop-table|section-table|meta-table|belanja-table|c2-table|rincian-table|kwitansi-table|spd-table|rekap-table|ttd-table|ttd-3col|footer-table|header-row-table|content-table|info-table|meta-right-table';
            $html = preg_replace(
                '/<table([^>]*class="[^"]*(?:'.$fullWidthClasses.')[^"]*"[^>]*)>/i',
                '<table width="100%"$1>',
                $html
            ) ?? $html;

            // Garis kop surat pakai tabel agar tajam & rata penuh di Word
            $kopLineWord = '<table width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-top:4pt;margin-bottom:10pt;"><tr><td style="border-top:2.25pt solid #000000;font-size:1pt;line-height:1pt;height:2pt;">&nbsp;</td></tr></table>';
            $html = str_replace('<div class="kop-line-thick"></div>', $kopLineWord, $html);

            // Pastikan ruang tanda tangan tidak kolaps di Word
            $html = str_replace('<div class="ttd-space"></div>', '<div class="ttd-space"><br><br><br></div>', $html);

            // Hard Page Break resmi Microsoft Word (mso-special-character:line-break + page-break-before:always di dalam <p>)
            $wordPageBreak = '<p style="margin:0;padding:0;line-height:1pt;font-size:1pt;page-break-after:always;"><span style="font-size:1pt;"><br clear="all" style="mso-special-character:line-break;page-break-before:always" /></span></p>';
            $html = str_replace('<div class="page-break"></div>', $wordPageBreak, $html);

            return response("\xEF\xBB\xBF".$html, 200, [
                'Content-Type' => 'application/msword; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$baseFilename}.doc\"",
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
            ]);
        }

        $pdf = Pdf::loadView($view, $data)->setPaper('a4', 'portrait');

        if ($request->boolean('download')) {
            return $pdf->download("{$baseFilename}.pdf");
        }

        return $pdf->stream("{$baseFilename}.pdf");
    }

    /**
     * Download PDF / Word Surat Tugas (SPT) untuk 1 Batch.
     */
    public function downloadBatchPdf(Request $request, string $batchCode): SymfonyResponse
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

            // Poin 1 Untuk: Melaksanakan Kegiatan (dinamis sesuai inputan tujuan) Tahun Anggaran (tahun ini)
            $rawTujuanInput = trim((string) $sppd->tujuan);
            if ($rawTujuanInput !== '') {
                $kegiatanUntuk = str_starts_with(strtolower($rawTujuanInput), 'kegiatan ')
                    ? $rawTujuanInput
                    : 'Kegiatan '.$rawTujuanInput;
            } else {
                $kegiatanUntuk = 'Kegiatan '.($sppd->subKegiatan?->sub_kegiatan ?: 'Koordinasi dan Sinkronisasi Pemantauan Stok, Pasokan dan Harga Pangan Pokok Strategis');
            }
            $tahunAnggaran = date('Y');

            // Poin 2 Untuk: bertempat di (inputan desa), Kecamatan (dinamis)
            $tempatDesa = trim((string) ($sppd->nama_desa ?? ''));
            if ($tempatDesa === '') {
                $tempatDesa = 'Desa/Kelurahan Kec. '.$sppd->nama_kecamatan;
            }

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
                'tempat_desa' => $tempatDesa,
                'nama_kecamatan' => $sppd->nama_kecamatan,
                'participants' => $participants,
                'kadin_prefix' => $isPlt ? 'Plt.' : '',
                'kadin_nama' => $kadin?->nama ?? 'RORY FIRMANSYAH.S.STP.M.Si',
                'kadin_pangkat_gol' => $kadinPangkatGol,
                'kadin_nip' => $kadinNipFormatted,
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);
        $withBlokParaf = $request->boolean('paraf');
        $filePrefix = $withBlokParaf ? 'SPT_Blok_Paraf' : 'Surat_Tugas_SPT';

        return $this->renderDocumentResponse($request, 'pdf.spt-batch', [
            'batchCode' => $batchCode,
            'logoBase64' => $logoBase64,
            'sppdList' => $sppdList,
            'withBlokParaf' => $withBlokParaf,
        ], "{$filePrefix}_{$safeBatch}");
    }

    /**
     * Download PDF / Word Surat Pernyataan Tanggung Jawab Belanja (SPTJB) untuk 1 Batch.
     */
    public function downloadBatchSptjbPdf(Request $request, string $batchCode): SymfonyResponse
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

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $this->renderDocumentResponse($request, 'pdf.sptjb-batch', [
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
        ], "SPTJB_SPPD_Dalam_Kota_{$safeBatch}");
    }

    /**
     * Download PDF / Word Laporan C2 (Perincian Pengeluaran Menurut Tanda Bukti Terlampir).
     */
    public function downloadBatchC2Pdf(Request $request, string $batchCode): SymfonyResponse
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

            foreach ($sppd->participants as $pt) {
                $uangSaku = (float) $pt->uang_saku;
                $rows[] = [
                    'nama' => strtoupper($pt->nama),
                    'nip' => self::formatNipSpaced($pt->nip),
                    'pangkat_gol' => self::formatPangkatGol($pt->pangkat, $pt->golongan),
                    'tanggal_berangkat_indo' => $tglIndo,
                    'tujuan' => $rawTujuan,
                    'nama_kecamatan' => $sppd->nama_kecamatan,
                    'uang_saku_formatted' => number_format($uangSaku, 0, ',', '.'),
                ];
            }
        }

        $jumlahTandaBuktiCount = count($rows);
        $jumlahTandaBuktiKata = $jumlahTandaBuktiCount > 0
            ? strtolower(trim((string) preg_replace('/\s+/', ' ', self::terbilangKata($jumlahTandaBuktiCount))))
            : 'nol';
        $jumlahTandaBuktiDisplay = "{$jumlahTandaBuktiCount} ({$jumlahTandaBuktiKata})";

        $pptkNama = strtoupper($pptk?->nama ?? 'DEDEH SUMIATI, S.IP');
        $pptkNip = self::formatNipSpaced($pptk?->nip ?? '197009192007012009');

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $this->renderDocumentResponse($request, 'pdf.c2-batch', [
            'batchCode' => $batchCode,
            'namaKegiatan' => $namaKegiatan,
            'namaSubKegiatan' => $namaSubKegiatan,
            'tahunAnggaran' => $tahunAnggaran,
            'noRekening' => $noRekening,
            'nomorDpaDisplay' => $nomorDpaDisplay,
            'totalFormatted' => $totalFormatted,
            'terbilangText' => $terbilangText,
            'jumlahTandaBuktiDisplay' => $jumlahTandaBuktiDisplay,
            'rows' => $rows,
            'pptkNama' => $pptkNama,
            'pptkNip' => $pptkNip,
        ], "C2_SPPD_Dalam_Kota_{$safeBatch}");
    }

    /**
     * Download PDF / Word Rincian Biaya Perjalanan Dinas untuk 1 Batch (1 halaman per SPPD).
     */
    public function downloadBatchRincianPdf(Request $request, string $batchCode): SymfonyResponse
    {
        $records = SppdDalamKota::with(['participants', 'bendahara'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD tidak ditemukan.');
        }

        $defaultBendahara = SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)->first();

        $logoPath = public_path('indramayu_logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $logoBase64 = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        $sppdList = $records->map(function (SppdDalamKota $sppd) use ($defaultBendahara): array {
            $bendahara = $sppd->bendahara ?? $defaultBendahara;
            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            /** @var SppdDalamKotaParticipant|null $firstParticipant */
            $firstParticipant = $sortedParticipants->first();

            $grouped = [];
            foreach ($sortedParticipants as $pt) {
                $golNorm = SppdPegawai::normalizeGolonganGroup($pt->golongan);
                if ($golNorm === 'Golongan IV') {
                    $label = 'Eselon II/III / Gol IV';
                    $priority = 1;
                } elseif ($golNorm === 'Golongan III') {
                    $label = 'Eselon IV/Gol III';
                    $priority = 2;
                } else {
                    $label = 'Gol II, I dan P3K';
                    $priority = 3;
                }

                $rate = (float) $pt->uang_saku;
                $key = $priority.'|'.$label.'|'.$rate;

                if (! isset($grouped[$key])) {
                    $grouped[$key] = [
                        'priority' => $priority,
                        'label' => $label,
                        'count' => 0,
                        'rate' => $rate,
                        'subtotal' => 0.0,
                    ];
                }

                $grouped[$key]['count']++;
                $grouped[$key]['subtotal'] += $rate;
            }

            usort($grouped, fn (array $a, array $b) => $a['priority'] <=> $b['priority']);

            $groupsFormatted = array_map(fn (array $g): array => [
                'label' => $g['label'],
                'count' => $g['count'],
                'rate_formatted' => number_format($g['rate'], 0, ',', '.'),
                'subtotal_formatted' => number_format($g['subtotal'], 0, ',', '.'),
            ], $grouped);

            $totalUangSaku = (float) $sppd->total_uang_saku;
            $tempatTujuan = ! empty($sppd->nama_desa) ? trim($sppd->nama_desa) : trim($sppd->tujuan);

            return [
                'nomor_spt' => trim((string) ($sppd->nomor_spt ?? '')),
                'tanggal_berangkat_indo' => self::formatIndoDate($sppd->tanggal_berangkat),
                'zona' => $sppd->zona ?: 'Zona I',
                'tempat_tujuan' => $tempatTujuan,
                'nama_kecamatan' => $sppd->nama_kecamatan,
                'groups' => $groupsFormatted,
                'total_formatted' => number_format($totalUangSaku, 0, ',', '.'),
                'terbilang_text' => self::formatTerbilangRupiah($totalUangSaku),
                'bendahara_nama' => strtoupper($bendahara?->nama ?? 'UFI NAJARUDIN LUTFI'),
                'bendahara_nip' => self::formatNipSpaced($bendahara?->nip ?? '197401092009011003'),
                'penerima_nama' => strtoupper($firstParticipant?->nama ?? '-'),
                'penerima_nip' => self::formatNipSpaced($firstParticipant?->nip ?? ''),
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $this->renderDocumentResponse($request, 'pdf.rincian-batch', [
            'batchCode' => $batchCode,
            'logoBase64' => $logoBase64,
            'sppdList' => $sppdList,
        ], "Rincian_Biaya_SPPD_{$safeBatch}");
    }

    /**
     * Download PDF / Word Kwitansi (Tanda Terima Uang Harian Perjalanan Dinas Dalam Kota) untuk 1 Batch.
     */
    public function downloadBatchKwitansiPdf(Request $request, string $batchCode): SymfonyResponse
    {
        $records = SppdDalamKota::with(['subKegiatan', 'dpa', 'participants', 'kepalaDinas', 'pptk', 'bendahara'])
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
        $defaultPptk = SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)->first();
        $defaultBendahara = SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)->first();
        $defaultSub = SppdSubKegiatan::where('is_active', true)->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();

        $sk = $first->subKegiatan ?? $defaultSub;
        $dpa = $first->dpa ?? $defaultDpa;

        $kodeSubKegiatan = $sk?->kode_sub_kegiatan ?: '2.09.03.2.01.0014';
        $noRekening = $sk?->no_rekening ?: '5.1.02.04.01.0003';
        $namaSubKegiatan = $sk?->sub_kegiatan
            ?: 'Koordinasi dan Sinkronisasi Pemantauan Stok, Pasokan dan Harga Pangan Pokok Strategis';
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $sppdList = $records->map(function (SppdDalamKota $sppd) use ($defaultKadin, $defaultPptk, $defaultBendahara): array {
            $kadin = $sppd->kepalaDinas ?? $defaultKadin;
            $pptk = $sppd->pptk ?? $defaultPptk;
            $bendahara = $sppd->bendahara ?? $defaultBendahara;

            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            $participants = $sortedParticipants->map(fn (SppdDalamKotaParticipant $pt): array => [
                'nama' => strtoupper($pt->nama),
                'nip' => self::formatNipSpaced($pt->nip),
                'pangkat_gol' => self::formatPangkatGol($pt->pangkat, $pt->golongan),
                'jabatan' => $pt->jabatan,
                'uang_saku_formatted' => number_format((float) $pt->uang_saku, 0, ',', '.'),
            ])->values()->all();

            $totalUangSaku = (float) $sppd->total_uang_saku;
            $tempatTujuan = ! empty($sppd->nama_desa) ? trim($sppd->nama_desa) : trim($sppd->tujuan);
            $kadinNipCompact = preg_replace('/\D/', '', (string) ($kadin?->nip ?? '')) ?: ($kadin?->nip ?? '197801011997031003');

            return [
                'nomor_spt' => trim((string) ($sppd->nomor_spt ?? '')),
                'tanggal_berangkat_indo' => self::formatIndoDate($sppd->tanggal_berangkat),
                'tempat_tujuan' => $tempatTujuan,
                'nama_kecamatan' => $sppd->nama_kecamatan,
                'total_formatted' => number_format($totalUangSaku, 0, ',', '.'),
                'terbilang_text' => self::formatTerbilangRupiah($totalUangSaku),
                'participants' => $participants,
                'kadin_nama' => strtoupper($kadin?->nama ?? 'RORY FIRMANSYAH.S.STP.M.Si'),
                'kadin_nip' => $kadinNipCompact,
                'pptk_nama' => strtoupper($pptk?->nama ?? 'DEDEH SUMIATI, S.IP'),
                'pptk_nip' => self::formatNipSpaced($pptk?->nip ?? '197009192007012009'),
                'bendahara_nama' => strtoupper($bendahara?->nama ?? 'UFI NAJARUDIN LUTFI'),
                'bendahara_nip' => self::formatNipSpaced($bendahara?->nip ?? '197401092009011003'),
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $this->renderDocumentResponse($request, 'pdf.kwitansi-batch', [
            'batchCode' => $batchCode,
            'kodeSubKegiatan' => $kodeSubKegiatan,
            'noRekening' => $noRekening,
            'namaSubKegiatan' => $namaSubKegiatan,
            'tahunAnggaran' => $tahunAnggaran,
            'sppdList' => $sppdList,
        ], "Kwitansi_SPPD_Dalam_Kota_{$safeBatch}");
    }

    /**
     * Download PDF / Word Kwitansi 2 untuk 1 Batch (1 halaman per SPPD).
     */
    public function downloadBatchKwitansi2Pdf(Request $request, string $batchCode): SymfonyResponse
    {
        $records = SppdDalamKota::with(['subKegiatan', 'dpa', 'participants', 'kepalaDinas', 'bendahara'])
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
        $defaultBendahara = SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)->first();
        $defaultSub = SppdSubKegiatan::where('is_active', true)->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();

        $sk = $first->subKegiatan ?? $defaultSub;
        $dpa = $first->dpa ?? $defaultDpa;

        $logoPath = public_path('indramayu_logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $logoBase64 = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        $namaSubKegiatan = $sk?->sub_kegiatan
            ?: 'Koordinasi dan Sinkronisasi Pemantauan Stok, Pasokan dan Harga Pangan Pokok Strategis';
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $sppdList = $records->map(function (SppdDalamKota $sppd) use ($defaultKadin, $defaultBendahara): array {
            $kadin = $sppd->kepalaDinas ?? $defaultKadin;
            $bendahara = $sppd->bendahara ?? $defaultBendahara;

            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            /** @var SppdDalamKotaParticipant|null $firstParticipant */
            $firstParticipant = $sortedParticipants->first();

            $totalUangSaku = (float) $sppd->total_uang_saku;
            $tujuanInput = trim($sppd->tujuan);
            $desaInput = trim((string) ($sppd->nama_desa ?? ''));
            $lokasiDesaKecamatan = $desaInput !== ''
                ? "{$desaInput}, Kecamatan {$sppd->nama_kecamatan}"
                : "Kecamatan {$sppd->nama_kecamatan}";
            $terbilangTitle = ucwords(strtolower(self::formatTerbilangRupiah($totalUangSaku)));
            $kadinNipCompact = preg_replace('/\D/', '', (string) ($kadin?->nip ?? '')) ?: ($kadin?->nip ?? '197801011997031003');

            return [
                'tanggal_berangkat_indo' => self::formatIndoDate($sppd->tanggal_berangkat),
                'tujuan' => $tujuanInput,
                'lokasi_desa_kecamatan' => $lokasiDesaKecamatan,
                'total_formatted' => number_format($totalUangSaku, 0, ',', '.'),
                'terbilang_title' => $terbilangTitle,
                'penerima_nama' => strtoupper($firstParticipant?->nama ?? '-'),
                'penerima_nip' => self::formatNipSpaced($firstParticipant?->nip ?? ''),
                'kadin_nama' => strtoupper($kadin?->nama ?? 'RORY FIRMANSYAH.S.STP.M.Si'),
                'kadin_nip' => $kadinNipCompact,
                'bendahara_nama' => strtoupper($bendahara?->nama ?? 'UFI NAJARUDIN LUTFI'),
                'bendahara_nip' => self::formatNipSpaced($bendahara?->nip ?? '197401092009011003'),
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $this->renderDocumentResponse($request, 'pdf.kwitansi2-batch', [
            'batchCode' => $batchCode,
            'logoBase64' => $logoBase64,
            'namaSubKegiatan' => $namaSubKegiatan,
            'tahunAnggaran' => $tahunAnggaran,
            'sppdList' => $sppdList,
        ], "Kwitansi_2_SPPD_Dalam_Kota_{$safeBatch}");
    }

    /**
     * Download PDF / Word SPPD (Surat Perjalanan Dinas / SPD) untuk 1 Batch (1 halaman per SPPD).
     */
    public function downloadBatchSppdPdf(Request $request, string $batchCode): SymfonyResponse
    {
        $records = SppdDalamKota::with(['subKegiatan', 'dpa', 'participants.pegawai', 'kepalaDinas'])
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

        $sk = $first->subKegiatan ?? $defaultSub;
        $dpa = $first->dpa ?? $defaultDpa;

        $logoPath = public_path('indramayu_logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $logoBase64 = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        $namaSubKegiatan = $sk?->sub_kegiatan
            ?: 'Koordinasi dan Sinkronisasi Pemantauan Stok, Pasokan dan Harga Pangan Pokok Strategis';
        $noRekening = $sk?->no_rekening ?: '5.1.02.04.01.0003';
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $sppdList = $records->map(function (SppdDalamKota $sppd) use ($defaultKadin): array {
            $kadin = $sppd->kepalaDinas ?? $defaultKadin;

            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            /** @var SppdDalamKotaParticipant|null $leader */
            $leader = $sortedParticipants->first();

            // Jika pegawai pertama jabatannya Kepala Bidang -> Tingkat C, selain itu -> Tingkat D
            $isLeaderKepalaBidang = stripos((string) ($leader?->jabatan ?? ''), 'kepala bidang') !== false;
            $tingkatBiaya = $isLeaderKepalaBidang ? 'Tingkat C' : 'Tingkat D';

            $followers = $sortedParticipants->slice(1)->map(function (SppdDalamKotaParticipant $pt): array {
                $tglLahirRaw = $pt->pegawai?->tanggal_lahir
                    ? Carbon::parse($pt->pegawai->tanggal_lahir)->format('Y-m-d')
                    : SppdPegawai::extractBirthDateFromNip($pt->nip);

                return [
                    'nama' => strtoupper($pt->nama),
                    'tanggal_lahir_indo' => $tglLahirRaw ? self::formatIndoDate($tglLahirRaw) : '-',
                ];
            })->values()->all();

            $desaInput = trim((string) ($sppd->nama_desa ?? ''));
            $tempatTujuanDisplay = $desaInput !== ''
                ? "{$desaInput}, Kec. {$sppd->nama_kecamatan}"
                : trim($sppd->tujuan).", Kec. {$sppd->nama_kecamatan}";

            $kadinNipCompact = preg_replace('/\D/', '', (string) ($kadin?->nip ?? '')) ?: ($kadin?->nip ?? '197801011997031003');
            $kadinPangkatGol = trim(implode(' - ', array_filter([
                trim((string) ($kadin?->pangkat ?? 'Pembina Utama Muda')),
                trim((string) ($kadin?->golongan ?? 'IV/c')),
            ])));

            return [
                'nomor_spt' => trim((string) ($sppd->nomor_spt ?? '')),
                'tanggal_berangkat_indo' => self::formatIndoDate($sppd->tanggal_berangkat),
                'tujuan' => trim($sppd->tujuan),
                'leader_nama' => strtoupper($leader?->nama ?? '-'),
                'leader_nip' => self::formatNipSpaced($leader?->nip ?? ''),
                'leader_pangkat_gol' => self::formatPangkatGol($leader?->pangkat, $leader?->golongan),
                'leader_jabatan' => $leader?->jabatan ?? '-',
                'tingkat_biaya' => $tingkatBiaya,
                'tempat_tujuan_display' => $tempatTujuanDisplay,
                'followers' => $followers,
                'kadin_nama' => strtoupper($kadin?->nama ?? 'RORY FIRMANSYAH.S.STP.M.Si'),
                'kadin_pangkat_gol' => $kadinPangkatGol,
                'kadin_nip' => $kadinNipCompact,
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $this->renderDocumentResponse($request, 'pdf.sppd-batch', [
            'batchCode' => $batchCode,
            'logoBase64' => $logoBase64,
            'namaSubKegiatan' => $namaSubKegiatan,
            'noRekening' => $noRekening,
            'tahunAnggaran' => $tahunAnggaran,
            'sppdList' => $sppdList,
        ], "SPPD_Dalam_Kota_{$safeBatch}");
    }

    /**
     * Download PDF / Word Rekapitulasi Perjalanan Dinas untuk 1 Batch.
     */
    public function downloadBatchRekapPdf(Request $request, string $batchCode): SymfonyResponse
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

        $kadin = $first->kepalaDinas ?? $defaultKadin;
        $sk = $first->subKegiatan ?? $defaultSub;

        $logoPath = public_path('indramayu_logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $logoBase64 = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        $noRekening = $sk?->no_rekening ?: '5.1.02.04.01.0003';
        $totalUangSaku = (float) $records->sum('total_uang_saku');
        $totalFormatted = number_format($totalUangSaku, 0, ',', '.');
        $terbilangText = self::formatTerbilangRupiah($totalUangSaku);

        $rows = [];
        foreach ($records as $sppd) {
            $tglIndo = self::formatIndoDate($sppd->tanggal_berangkat);
            $tujuanLokasi = ! empty($sppd->nama_desa) ? trim($sppd->nama_desa) : trim($sppd->tujuan);
            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            foreach ($sortedParticipants as $pt) {
                $golDisplay = str_replace('/', '.', trim((string) ($pt->golongan ?? '')));
                $rows[] = [
                    'nama' => strtoupper($pt->nama),
                    'golongan' => $golDisplay,
                    'tujuan_lokasi' => $tujuanLokasi,
                    'tanggal_berangkat_indo' => $tglIndo,
                    'uang_saku_formatted' => number_format((float) $pt->uang_saku, 0, ',', '.'),
                ];
            }
        }

        $kadinNama = strtoupper($kadin?->nama ?? 'RORY FIRMANSYAH.S.STP.M.Si');
        $kadinNip = preg_replace('/\D/', '', (string) ($kadin?->nip ?? '')) ?: ($kadin?->nip ?? '197801011997031003');

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $this->renderDocumentResponse($request, 'pdf.rekap-batch', [
            'batchCode' => $batchCode,
            'logoBase64' => $logoBase64,
            'noRekening' => $noRekening,
            'rows' => $rows,
            'totalFormatted' => $totalFormatted,
            'terbilangText' => $terbilangText,
            'kadinNama' => $kadinNama,
            'kadinNip' => $kadinNip,
        ], "Rekap_SPPD_Dalam_Kota_{$safeBatch}");
    }

    /**
     * Download PDF / Word LHPD (Laporan Hasil Perjalanan Dinas) untuk 1 Batch (1 halaman per SPPD).
     */
    public function downloadBatchLhpdPdf(Request $request, string $batchCode): SymfonyResponse
    {
        $records = SppdDalamKota::with(['dpa', 'participants'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD tidak ditemukan.');
        }

        /** @var SppdDalamKota $first */
        $first = $records->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();
        $dpa = $first->dpa ?? $defaultDpa;
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $sppdList = $records->map(function (SppdDalamKota $sppd): array {
            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            $participants = $sortedParticipants->map(fn (SppdDalamKotaParticipant $pt): array => [
                'nama' => strtoupper($pt->nama),
                'nip' => self::formatNipSpaced($pt->nip),
            ])->values()->all();

            $desaInput = trim((string) ($sppd->nama_desa ?? ''));
            $lokasiDesaKecamatan = $desaInput !== ''
                ? "{$desaInput}, Kecamatan {$sppd->nama_kecamatan}"
                : "Kecamatan {$sppd->nama_kecamatan}";

            $rawTujuan = trim($sppd->tujuan);
            $maksudTujuan = preg_match('/^kegiatan\s+/i', $rawTujuan)
                ? $rawTujuan
                : "kegiatan {$rawTujuan}";

            return [
                'tanggal_berangkat_indo' => self::formatIndoDate($sppd->tanggal_berangkat),
                'lokasi_desa_kecamatan' => $lokasiDesaKecamatan,
                'maksud_tujuan' => $maksudTujuan,
                'participants' => $participants,
                'lhpd_type' => $sppd->lhpd_type,
                'lhpd_content' => $sppd->lhpd_content,
                'lhpd_table_data' => $sppd->lhpd_table_data,
                'lhpd_keterangan' => $sppd->lhpd_keterangan,
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        return $this->renderDocumentResponse($request, 'pdf.lhpd-batch', [
            'batchCode' => $batchCode,
            'tahunAnggaran' => $tahunAnggaran,
            'sppdList' => $sppdList,
        ], "LHPD_SPPD_Dalam_Kota_{$safeBatch}");
    }

    /**
     * Simpan / perbarui isi Laporan Hasil Perjalanan Dinas (LHPD) untuk 1 SPPD Dalam Kota.
     */
    public function updateLhpd(Request $request, SppdDalamKota $sppd): RedirectResponse
    {
        $validated = $request->validate([
            'lhpd_type' => ['required', 'in:paragraf,tabel_harga,tabel_custom'],
            'lhpd_content' => ['nullable', 'string', 'max:10000'],
            'lhpd_table_data' => ['nullable', 'array'],
            'lhpd_keterangan' => ['nullable', 'string', 'max:500'],
        ]);

        $sppd->update([
            'lhpd_type' => $validated['lhpd_type'],
            'lhpd_content' => $validated['lhpd_type'] === 'paragraf'
                ? trim((string) ($validated['lhpd_content'] ?? ''))
                : null,
            'lhpd_table_data' => $validated['lhpd_type'] !== 'paragraf'
                ? ($validated['lhpd_table_data'] ?? null)
                : null,
            'lhpd_keterangan' => trim((string) ($validated['lhpd_keterangan'] ?? '')) ?: null,
        ]);

        return back()->with('success', 'Laporan Hasil Perjalanan Dinas (LHPD) berhasil disimpan.');
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
            'batches.*.nama_desa' => ['nullable', 'string', 'max:150'],
            'batches.*.nama_kecamatan' => ['required', 'string', 'max:100'],
            'batches.*.kepala_dinas_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'batches.*.pptk_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'batches.*.bendahara_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'batches.*.participants' => ['required', 'array', 'min:1'],
            'batches.*.participants.*.pegawai_id' => ['required', 'exists:sppd_pegawais,id'],
            'batches.*.participants.*.tanggal_berangkat' => ['required', 'date'],
            'batches.*.participants.*.tanggal_spt' => ['required', 'date'],
            'batches.*.participants.*.tujuan' => ['required', 'string', 'max:1000'],
            'batches.*.participants.*.nama_desa' => ['nullable', 'string', 'max:150'],
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

                $desaName = ! empty($batch['nama_desa']) ? trim($batch['nama_desa']) : null;

                $sppd = SppdDalamKota::create([
                    'batch_code' => $batchCode,
                    'sub_kegiatan_id' => $batchSubKegiatanId,
                    'dpa_id' => $batchDpaId,
                    'nomor_spt' => ! empty($batch['nomor_spt']) ? trim($batch['nomor_spt']) : null,
                    'tanggal_spt' => $batch['tanggal_spt'],
                    'tanggal_berangkat' => $batch['tanggal_berangkat'],
                    'tujuan' => trim($batch['tujuan']),
                    'nama_desa' => $desaName,
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

                    $ptDesa = ! empty($ptData['nama_desa']) ? trim($ptData['nama_desa']) : $desaName;

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
                        'nama_desa' => $ptDesa,
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

    public function updateSppd(Request $request, SppdDalamKota $sppd): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_spt' => ['nullable', 'string', 'max:100'],
            'tanggal_berangkat' => ['required', 'date'],
            'tanggal_spt' => ['required', 'date'],
            'tujuan' => ['required', 'string', 'max:1000'],
            'nama_desa' => ['nullable', 'string', 'max:150'],
            'nama_kecamatan' => ['required', 'string', 'max:100'],
            'kepala_dinas_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'pptk_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'bendahara_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'participant_pegawai_ids' => ['required', 'array', 'min:1'],
            'participant_pegawai_ids.*' => ['required', 'exists:sppd_pegawais,id'],
        ], [
            'tanggal_berangkat.required' => 'Tanggal berangkat wajib diisi.',
            'tanggal_spt.required' => 'Tanggal SPT wajib diisi.',
            'tujuan.required' => 'Tujuan perjalanan wajib diisi.',
            'nama_kecamatan.required' => 'Kecamatan tujuan wajib dipilih.',
            'participant_pegawai_ids.required' => 'Pilih minimal 1 pegawai yang berangkat.',
            'participant_pegawai_ids.*.required' => 'Nama pegawai pada setiap baris wajib dipilih.',
        ]);

        $allZonasi = SppdZonasi::all();
        $allPegawai = SppdPegawai::all()->keyBy('id');

        DB::transaction(function () use ($validated, $sppd, $allZonasi, $allPegawai) {
            $kecName = trim($validated['nama_kecamatan']);
            $matchedZonaObj = $allZonasi->first(
                fn (SppdZonasi $z) => strcasecmp($z->nama_kecamatan, $kecName) === 0
            );
            $zonaLabel = $matchedZonaObj?->zona ?? 'Zona I';
            $desaName = ! empty($validated['nama_desa']) ? trim($validated['nama_desa']) : null;
            $tujuanText = trim($validated['tujuan']);

            $sppd->update([
                'nomor_spt' => ! empty($validated['nomor_spt']) ? trim($validated['nomor_spt']) : null,
                'tanggal_spt' => $validated['tanggal_spt'],
                'tanggal_berangkat' => $validated['tanggal_berangkat'],
                'tujuan' => $tujuanText,
                'nama_desa' => $desaName,
                'nama_kecamatan' => $kecName,
                'zona' => $zonaLabel,
                'kepala_dinas_id' => $validated['kepala_dinas_id'] ?? $sppd->kepala_dinas_id,
                'pptk_id' => $validated['pptk_id'] ?? $sppd->pptk_id,
                'bendahara_id' => $validated['bendahara_id'] ?? $sppd->bendahara_id,
            ]);

            $sppd->participants()->delete();

            $totalUangSaku = 0;
            $urutan = 1;

            foreach ($validated['participant_pegawai_ids'] as $pegawaiId) {
                /** @var SppdPegawai|null $pegawai */
                $pegawai = $allPegawai->get((int) $pegawaiId);
                if (! $pegawai) {
                    continue;
                }

                $golNormalized = SppdPegawai::normalizeGolonganGroup($pegawai->golongan);

                $zonasiTarif = $allZonasi->first(function (SppdZonasi $z) use ($kecName, $pegawai, $golNormalized) {
                    $sameKec = strcasecmp($z->nama_kecamatan, $kecName) === 0;
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
                    'tanggal_berangkat' => $validated['tanggal_berangkat'],
                    'tanggal_spt' => $validated['tanggal_spt'],
                    'tujuan' => $tujuanText,
                    'nama_desa' => $desaName,
                    'nama_kecamatan' => $kecName,
                    'zona' => $ptZona,
                    'uang_saku' => $uangSaku,
                ]);

                $totalUangSaku += $uangSaku;
            }

            $sppd->update([
                'total_uang_saku' => $totalUangSaku,
            ]);
        });

        return back()->with('success', 'Data keberangkatan SPPD dalam batch berhasil diperbarui.');
    }

    public function destroySppd(SppdDalamKota $sppd): RedirectResponse
    {
        $sppd->delete();

        return back()->with('success', 'Item SPPD berhasil dihapus dari batch.');
    }

    // =========================================================================
    // IMPOR MASTER DATA SPPD DARI PDF RKA-BELANJA SIPD-RI & REALISASI ANGGARAN
    // =========================================================================

    public function parseRkaPdf(Request $request): JsonResponse
    {
        $request->validate([
            'pdfs' => ['required', 'array', 'min:1'],
            'pdfs.*' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ], [
            'pdfs.required' => 'Pilih minimal 1 file PDF RKA-Belanja SIPD-RI.',
            'pdfs.*.mimes' => 'Semua file harus berformat PDF.',
        ]);

        $parser = new PdfParser;
        $subKegiatansMap = [];
        $zonasiRatesMap = [];
        $pejabatKadin = null;
        $tahunAnggaran = null;
        $errors = [];

        foreach ($request->file('pdfs') as $file) {
            try {
                $pdf = $parser->parseFile($file->getRealPath());
                $extracted = self::extractSppdMasterFromRkaText($pdf->getText());

                if ($extracted['tahun_anggaran'] && ! $tahunAnggaran) {
                    $tahunAnggaran = $extracted['tahun_anggaran'];
                }

                if ($extracted['sub_kegiatan']) {
                    $sk = $extracted['sub_kegiatan'];
                    $sk['source_file'] = $file->getClientOriginalName();
                    $subKegiatansMap[$sk['kode_sub_kegiatan']] = $sk;
                }

                foreach ($extracted['zonasi_rates'] as $rate) {
                    $key = $rate['zona'].'|'.$rate['golongan'];
                    $zonasiRatesMap[$key] = $rate;
                }

                if ($extracted['pejabat_kadin'] && ! $pejabatKadin) {
                    $pejabatKadin = $extracted['pejabat_kadin'];
                }
            } catch (\Throwable $e) {
                $errors[] = $file->getClientOriginalName().': gagal membaca PDF.';
            }
        }

        if (empty($subKegiatansMap) && empty($zonasiRatesMap) && ! $pejabatKadin) {
            return response()->json([
                'message' => 'Tidak ditemukan data Sub Kegiatan maupun Tarif Zonasi SPPD pada file PDF yang diunggah. Pastikan file merupakan PDF teks asli RKA-BELANJA SKPD dari SIPD-RI.',
                'errors' => $errors,
            ], 422);
        }

        // Bandingkan dengan data Master saat ini agar UI dapat menampilkan status Baru / Update & Tarif Lama -> Baru
        $existingSubCodes = SppdSubKegiatan::pluck('kode_sub_kegiatan')
            ->map(fn ($c) => trim((string) $c))
            ->all();

        $subKegiatans = array_values(array_map(function (array $sk) use ($existingSubCodes): array {
            $sk['exists_in_master'] = in_array(trim($sk['kode_sub_kegiatan']), $existingSubCodes, true);

            return $sk;
        }, $subKegiatansMap));

        $currentZonasiTarif = [];
        foreach (SppdZonasi::select('zona', 'golongan', 'uang_saku')->distinct()->get() as $z) {
            $currentZonasiTarif[$z->zona.'|'.$z->golongan] = (float) $z->uang_saku;
        }

        $zonaOrder = ['Zona I' => 1, 'Zona II' => 2, 'Zona III' => 3];
        $golOrder = ['Golongan IV' => 1, 'Golongan III' => 2, 'Golongan II' => 3, 'Golongan I' => 4];
        $zonasiRates = array_values(array_map(function (array $rate) use ($currentZonasiTarif): array {
            $key = $rate['zona'].'|'.$rate['golongan'];
            $oldTarif = $currentZonasiTarif[$key] ?? null;
            $rate['uang_saku_lama'] = $oldTarif;
            $rate['is_changed'] = $oldTarif === null || abs($oldTarif - (float) $rate['uang_saku']) >= 1;

            return $rate;
        }, $zonasiRatesMap));

        usort($zonasiRates, function (array $a, array $b) use ($zonaOrder, $golOrder): int {
            $za = $zonaOrder[$a['zona']] ?? 99;
            $zb = $zonaOrder[$b['zona']] ?? 99;
            if ($za !== $zb) {
                return $za <=> $zb;
            }

            return ($golOrder[$a['golongan']] ?? 99) <=> ($golOrder[$b['golongan']] ?? 99);
        });

        return response()->json([
            'tahun_anggaran' => $tahunAnggaran,
            'sub_kegiatans' => $subKegiatans,
            'zonasi_rates' => $zonasiRates,
            'pejabat_kadin' => $pejabatKadin,
            'warnings' => $errors,
        ]);
    }

    /**
     * Ekstrak Sub Kegiatan, Tarif Zonasi SPPD Dalam Kota, dan Pejabat Kepala Dinas
     * dari teks PDF RKA-BELANJA SKPD SIPD-RI.
     *
     * @return array{
     *     tahun_anggaran: ?int,
     *     sub_kegiatan: ?array{kode_sub_kegiatan: string, sub_kegiatan: string, nama_kegiatan: string, no_rekening: string},
     *     zonasi_rates: array<int, array{zona: string, golongan: string, uang_saku: float}>,
     *     pejabat_kadin: ?array{nama: string, nip: string, jabatan: string}
     * }
     */
    public static function extractSppdMasterFromRkaText(string $rawText): array
    {
        $text = str_replace(["\r\n", "\r"], "\n", $rawText);

        $tahunAnggaran = null;
        if (preg_match('/Tahun\s+Anggaran\s+(\d{4})/i', $text, $m)) {
            $tahunAnggaran = (int) $m[1];
        }

        // 1. Nama Kegiatan (bisa multi-baris di antara "Kegiatan :" dan "Sub Kegiatan :")
        $namaKegiatan = '';
        if (preg_match('/Kegiatan\s*:\s*(.*?)(?=\n\s*Sub\s+Kegiatan\s*:)/is', $text, $m)) {
            $rawKeg = trim(preg_replace('/\s+/', ' ', $m[1]));
            $namaKegiatan = trim((string) preg_replace('/^[\d.]+\s+/', '', $rawKeg));
        }

        // 2. Kode & Nama Sub Kegiatan
        $kodeSubKegiatan = '';
        $namaSubKegiatan = '';
        if (preg_match('/^Sub\s+Kegiatan\s*:\s*([\d.]+)\s+(.+)$/mi', $text, $m)) {
            $kodeSubKegiatan = trim($m[1]);
            $namaSubKegiatan = trim(preg_replace('/\s+/', ' ', $m[2]));
        }

        // 3. No Rekening Perjalanan Dinas (prioritaskan Dalam Kota 5.1.02.04.001.00003 / 5.1.02.04.01.0003)
        $noRekening = '5.1.02.04.01.0003';
        if (preg_match('/^(5\.1\.02\.04\.\d{2,3}\.000?03)\b/mi', $text, $m)) {
            $noRekening = trim($m[1]);
        } elseif (preg_match('/^(5\.1\.02\.04\.\d{2,3}\.\d{4,5})\b/mi', $text, $m)) {
            $noRekening = trim($m[1]);
        }

        $subKegiatan = $kodeSubKegiatan !== '' ? [
            'kode_sub_kegiatan' => $kodeSubKegiatan,
            'sub_kegiatan' => $namaSubKegiatan,
            'nama_kegiatan' => $namaKegiatan ?: $namaSubKegiatan,
            'no_rekening' => $noRekening,
        ] : null;

        // 4. Ekstrak Tarif Zonasi (Wilayah Zona I / II / III) beserta Harga Satuan per Golongan
        $parseIdr = static function (string $val): float {
            $cleaned = preg_replace('/[^\d.,]/', '', $val);
            $cleaned = str_replace('.', '', $cleaned);
            $cleaned = str_replace(',', '.', $cleaned);

            return round((float) $cleaned, 2);
        };

        $zonasiRatesMap = [];
        if (preg_match_all('/Wilayah\s+Zona\s+(III|II|I)\b(.*?)(?=Wilayah\s+Zona\s+(?:III|II|I)\b|Jumlah\s*:|SIPD-RI:|\z)/is', $text, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $block) {
                $zonaRomawi = strtoupper(trim($block[1]));
                $zonaLabel = 'Zona '.$zonaRomawi;
                $body = $block[2];

                // Tentukan golongan dari teks Spesifikasi
                $golongans = [];
                if (preg_match('/Gol(?:ongan)?\.?\s*IV\b|Eselon\s*III\b|Fungsional\s+Madya/i', $body)) {
                    $golongans[] = 'Golongan IV';
                } elseif (preg_match('/Gol(?:ongan)?\.?\s*III\b|Eselon\s*IV\b|Fungsional\s+Muda/i', $body)) {
                    $golongans[] = 'Golongan III';
                } elseif (preg_match('/Gol(?:ongan)?\.?\s*II\s*,\s*I\b|Gol(?:ongan)?\.?\s*I\s*,\s*II\b/i', $body)) {
                    $golongans[] = 'Golongan II';
                    $golongans[] = 'Golongan I';
                } elseif (preg_match('/Gol(?:ongan)?\.?\s*II\b/i', $body)) {
                    $golongans[] = 'Golongan II';
                } elseif (preg_match('/Gol(?:ongan)?\.?\s*I\b/i', $body)) {
                    $golongans[] = 'Golongan I';
                }

                if (empty($golongans)) {
                    continue;
                }

                // Ambil Harga Satuan (angka berformat ribuan seperti 150.000,00 tepat sebelum "0 %" dan "Rp.")
                $harga = null;
                if (preg_match('/([\d.]+,\d{2})\s+\d+\s*%\s*Rp\./i', $body, $hm)) {
                    $harga = $parseIdr($hm[1]);
                } elseif (preg_match('/(?:Hari|OH|Orang)\s+([\d.]+(?:,\d{2})?)\s+\d+\s*%/is', $body, $hm)) {
                    $harga = $parseIdr($hm[1]);
                }

                if ($harga !== null && $harga > 0) {
                    foreach ($golongans as $gol) {
                        $zonasiRatesMap[$zonaLabel.'|'.$gol] = [
                            'zona' => $zonaLabel,
                            'golongan' => $gol,
                            'uang_saku' => $harga,
                        ];
                    }
                }
            }
        }

        // 5. Ekstrak Pejabat Kepala Dinas dari blok tanda tangan halaman akhir
        $pejabatKadin = null;
        if (preg_match('/((?:Plt\.\s*)?Kepala\s+DINAS[^\n]+)\n+([A-Z][^\n]+)\n+NIP\.?\s*([\d\s]+)/i', $text, $pm)) {
            $jabatan = trim(preg_replace('/\s+/', ' ', $pm[1]));
            $nama = trim(preg_replace('/\s+/', ' ', $pm[2]));
            $nip = preg_replace('/\D/', '', $pm[3]);
            if ($nama !== '' && $nip !== '') {
                $pejabatKadin = [
                    'nama' => $nama,
                    'nip' => $nip,
                    'jabatan' => $jabatan,
                ];
            }
        }

        return [
            'tahun_anggaran' => $tahunAnggaran,
            'sub_kegiatan' => $subKegiatan,
            'zonasi_rates' => array_values($zonasiRatesMap),
            'pejabat_kadin' => $pejabatKadin,
        ];
    }

    public function importFromRka(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sub_kegiatans' => ['nullable', 'array'],
            'sub_kegiatans.*.kode_sub_kegiatan' => ['required', 'string', 'max:100'],
            'sub_kegiatans.*.sub_kegiatan' => ['required', 'string', 'max:500'],
            'sub_kegiatans.*.nama_kegiatan' => ['required', 'string', 'max:500'],
            'sub_kegiatans.*.no_rekening' => ['required', 'string', 'max:100'],
            'zonasi_rates' => ['nullable', 'array'],
            'zonasi_rates.*.zona' => ['required', 'string', 'max:50'],
            'zonasi_rates.*.golongan' => ['required', 'string', 'max:50'],
            'zonasi_rates.*.uang_saku' => ['required', 'numeric', 'min:0'],
            'pejabat_kadin' => ['nullable', 'array'],
            'pejabat_kadin.nama' => ['required_with:pejabat_kadin', 'string', 'max:150'],
            'pejabat_kadin.nip' => ['nullable', 'string', 'max:50'],
            'pejabat_kadin.jabatan' => ['nullable', 'string', 'max:255'],
        ]);

        $subCreated = 0;
        $subUpdated = 0;
        $zonasiRowsUpdated = 0;
        $pejabatSaved = false;

        DB::transaction(function () use ($validated, &$subCreated, &$subUpdated, &$zonasiRowsUpdated, &$pejabatSaved): void {
            foreach ($validated['sub_kegiatans'] ?? [] as $sk) {
                $kode = trim($sk['kode_sub_kegiatan']);
                $existing = SppdSubKegiatan::where('kode_sub_kegiatan', $kode)->first();
                if ($existing) {
                    $existing->update([
                        'no_rekening' => trim($sk['no_rekening']),
                        'nama_kegiatan' => trim($sk['nama_kegiatan']),
                        'sub_kegiatan' => trim($sk['sub_kegiatan']),
                        'is_active' => true,
                    ]);
                    $subUpdated++;
                } else {
                    SppdSubKegiatan::create([
                        'kode_sub_kegiatan' => $kode,
                        'no_rekening' => trim($sk['no_rekening']),
                        'nama_kegiatan' => trim($sk['nama_kegiatan']),
                        'sub_kegiatan' => trim($sk['sub_kegiatan']),
                        'is_active' => true,
                    ]);
                    $subCreated++;
                }
            }

            foreach ($validated['zonasi_rates'] ?? [] as $zr) {
                $updated = SppdZonasi::where('zona', trim($zr['zona']))
                    ->where('golongan', trim($zr['golongan']))
                    ->update(['uang_saku' => (float) $zr['uang_saku']]);
                $zonasiRowsUpdated += $updated;
            }

            if (! empty($validated['pejabat_kadin'])) {
                $pj = $validated['pejabat_kadin'];
                $nipDigits = preg_replace('/\D/', '', (string) ($pj['nip'] ?? ''));
                $existingPj = $nipDigits !== ''
                    ? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
                        ->get()
                        ->first(fn (SppdPejabat $p) => preg_replace('/\D/', '', (string) $p->nip) === $nipDigits)
                    : null;

                if ($existingPj) {
                    $existingPj->update([
                        'nama' => trim($pj['nama']),
                        'jabatan' => ! empty($pj['jabatan']) ? trim($pj['jabatan']) : $existingPj->jabatan,
                    ]);
                } else {
                    SppdPejabat::create([
                        'tipe' => SppdPejabat::TIPE_KEPALA_DINAS,
                        'nama' => trim($pj['nama']),
                        'nip' => $nipDigits ?: null,
                        'jabatan' => ! empty($pj['jabatan']) ? trim($pj['jabatan']) : 'Kepala Dinas Ketahanan Pangan dan Pertanian',
                        'is_active' => true,
                    ]);
                }
                $pejabatSaved = true;
            }
        });

        $summary = [];
        if ($subCreated > 0 || $subUpdated > 0) {
            $summary[] = "{$subCreated} Sub Kegiatan baru, {$subUpdated} diperbarui";
        }
        if ($zonasiRowsUpdated > 0) {
            $summary[] = "{$zonasiRowsUpdated} baris tarif zonasi kecamatan diperbarui";
        }
        if ($pejabatSaved) {
            $summary[] = 'Pejabat Kepala Dinas disimpan';
        }

        return back()->with(
            'success',
            ! empty($summary)
                ? 'Impor RKA SIPD-RI berhasil: '.implode(' • ', $summary).'.'
                : 'Tidak ada data yang dipilih untuk disimpan.'
        );
    }

    public function syncSubKegiatanFromRealisasi(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun_anggaran' => ['required', 'integer', 'min:2020', 'max:2100'],
            'jenis_anggaran' => ['required', 'in:murni,perubahan'],
        ]);

        $tahun = (int) $validated['tahun_anggaran'];
        $jenis = $validated['jenis_anggaran'];
        $jenisLabel = $jenis === 'perubahan' ? 'Anggaran Perubahan' : 'Anggaran Murni';

        $realisasiSks = RealisasiSubKegiatan::with('rekenings')
            ->where('tahun_anggaran', $tahun)
            ->where('jenis_anggaran', $jenis)
            ->orderBy('kode_sub_kegiatan')
            ->get();

        if ($realisasiSks->isEmpty()) {
            return back()->withErrors([
                'sync' => "Belum ada data {$jenisLabel} TA {$tahun} di modul Realisasi Anggaran.",
            ]);
        }

        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($realisasiSks, &$created, &$updated): void {
            foreach ($realisasiSks as $rsk) {
                $kode = trim((string) $rsk->kode_sub_kegiatan);
                if ($kode === '') {
                    continue;
                }

                // Cari rekening Perjalanan Dinas Dalam Kota jika ada
                $rekDk = $rsk->rekenings->first(
                    fn ($r) => (bool) preg_match('/^5\.1\.02\.04\.\d{2,3}\.000?03$/', trim((string) $r->kode_rekening))
                );
                $noRek = $rekDk ? trim($rekDk->kode_rekening) : '5.1.02.04.01.0003';

                $cleanKeg = trim((string) preg_replace('/^[\d.]+\s+/', '', trim((string) ($rsk->kegiatan ?: $rsk->nama_sub_kegiatan))));
                $cleanSub = trim((string) $rsk->nama_sub_kegiatan);

                $existing = SppdSubKegiatan::where('kode_sub_kegiatan', $kode)->first();
                if ($existing) {
                    $existing->update([
                        'no_rekening' => $noRek,
                        'nama_kegiatan' => $cleanKeg ?: $existing->nama_kegiatan,
                        'sub_kegiatan' => $cleanSub ?: $existing->sub_kegiatan,
                        'is_active' => true,
                    ]);
                    $updated++;
                } else {
                    SppdSubKegiatan::create([
                        'kode_sub_kegiatan' => $kode,
                        'no_rekening' => $noRek,
                        'nama_kegiatan' => $cleanKeg ?: $cleanSub,
                        'sub_kegiatan' => $cleanSub,
                        'is_active' => true,
                    ]);
                    $created++;
                }
            }
        });

        return back()->with(
            'success',
            "Berhasil menarik Sub Kegiatan dari {$jenisLabel} TA {$tahun}: {$created} baru, {$updated} diperbarui."
        );
    }
}
