<?php

namespace App\Http\Controllers;

use App\Models\SppdPegawai;
use App\Models\SppdPejabat;
use App\Models\SppdZonasi;
use App\Models\SuratTugas;
use App\Models\SuratTugasParticipant;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class SuratTugasController extends Controller
{
    public const DEFAULT_DASAR_TANPA_SURAT = '1. Undang-Undang Nomor 18 Tahun 2012 tentang Pangan; 2. PP No.17 Tahun 2015 tentang Ketahanan Pangan dan Gizi.';

    public const DEFAULT_JABATAN_KADIN = 'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN KABUPATEN INDRAMAYU';

    public const DEFAULT_TTD_IMAGE_PATH = 'images/ttd-default-kadin.png';

    private static function formatIndoDate(string|Carbon|null $date): string
    {
        if (! $date) {
            return '-';
        }

        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $c = $date instanceof Carbon ? $date : Carbon::parse($date);

        return $c->day.' '.($months[$c->month] ?? $c->format('F')).' '.$c->year;
    }

    private static function formatIndoDayName(string|Carbon|null $date): string
    {
        if (! $date) {
            return '';
        }

        $days = [
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
        ];

        $c = $date instanceof Carbon ? $date : Carbon::parse($date);

        return $days[$c->dayOfWeek] ?? '';
    }

    private static function formatNipSpaced(?string $nip): string
    {
        $digits = preg_replace('/\D/', '', (string) $nip);
        if (strlen($digits) === 18) {
            return substr($digits, 0, 8).' '.substr($digits, 8, 6).' '.substr($digits, 14, 1).' '.substr($digits, 15, 3);
        }

        return trim((string) $nip);
    }

    private static function formatPangkatGolSlash(?string $pangkat, ?string $golongan): string
    {
        $p = trim((string) $pangkat);
        $p = str_ireplace('Tingkat', 'Tk.', $p);
        $g = str_replace('.', '/', trim((string) $golongan));

        if ($p !== '' && $g !== '') {
            return "{$p} / {$g}";
        }

        return $p ?: ($g ?: '-');
    }

    /**
     * Pecah teks dasar bernomor seperti "1. ...; 2. ..." menjadi array item terpisah.
     *
     * @return array<int, string>
     */
    private static function parseNumberedDasarItems(string $text): array
    {
        $trimmed = trim($text);
        if ($trimmed === '' || ! preg_match('/^\s*1\.\s*/', $trimmed)) {
            return [];
        }

        $parts = preg_split('/(?:^|\s|;)\s*\d+\.\s+/', $trimmed, -1, PREG_SPLIT_NO_EMPTY);
        if (! is_array($parts)) {
            return [];
        }

        return array_values(array_filter(array_map(
            fn (string $item) => rtrim(trim($item), '; '),
            $parts
        ), fn (string $item) => $item !== ''));
    }

    private static function getLogoBase64(): string
    {
        $logoPath = public_path('indramayu_logo.png');
        if (! file_exists($logoPath)) {
            return '';
        }
        $mime = mime_content_type($logoPath) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
    }

    private static function getSignatureBase64(?string $relativePath): string
    {
        if (! $relativePath) {
            return '';
        }

        $fullPath = public_path(ltrim($relativePath, '/'));
        if (! file_exists($fullPath)) {
            return '';
        }

        $rawBytes = (string) file_get_contents($fullPath);
        if ($rawBytes === '') {
            return '';
        }

        // Perkecil resolusi gambar tanda tangan (maks 420x180 px) agar DomPDF tidak kehabisan memori
        // saat memproses gambar PNG/JPG beresolusi tinggi (misal hasil scan/foto).
        if (function_exists('imagecreatefromstring') && function_exists('imagecreatetruecolor')) {
            $src = @imagecreatefromstring($rawBytes);
            if ($src !== false) {
                $origW = imagesx($src);
                $origH = imagesy($src);

                $maxW = 420;
                $maxH = 180;
                $scale = min($maxW / max(1, $origW), $maxH / max(1, $origH), 1.0);
                $newW = max(1, (int) round($origW * $scale));
                $newH = max(1, (int) round($origH * $scale));

                $dst = imagecreatetruecolor($newW, $newH);
                if ($dst !== false) {
                    // Pertahankan transparansi PNG pada ukuran kecil (maks 420x180 px) agar aman untuk memori DomPDF
                    // dan tidak menutupi teks jabatan/nama jika tanda tangan digeser sedikit ke atas/bawah.
                    imagealphablending($dst, false);
                    imagesavealpha($dst, true);
                    $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
                    imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);
                    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);

                    ob_start();
                    imagepng($dst, null, 6);
                    $optimizedBytes = (string) ob_get_clean();

                    imagedestroy($dst);
                    imagedestroy($src);

                    if ($optimizedBytes !== '') {
                        return 'data:image/png;base64,'.base64_encode($optimizedBytes);
                    }
                } else {
                    imagedestroy($src);
                }
            }
        }

        $mime = mime_content_type($fullPath) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode($rawBytes);
    }

    public function index(): Response
    {
        $pegawais = SppdPegawai::where('is_active', true)
            ->get()
            ->sort(function (SppdPegawai $a, SppdPegawai $b): int {
                $rankA = SppdPegawai::golonganRank($a->golongan, $a->pangkat);
                $rankB = SppdPegawai::golonganRank($b->golongan, $b->pangkat);
                if ($rankA !== $rankB) {
                    return $rankB <=> $rankA;
                }

                return strcasecmp((string) $a->nama, (string) $b->nama);
            })
            ->map(fn (SppdPegawai $p): array => [
                'id' => $p->id,
                'nama' => $p->nama,
                'nip' => $p->nip,
                'pangkat' => $p->pangkat,
                'golongan' => $p->golongan,
                'golongan_rank' => SppdPegawai::golonganRank($p->golongan, $p->pangkat),
                'jabatan' => $p->jabatan,
                'is_active' => (bool) $p->is_active,
            ])->values();

        $kepalaDinasList = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
            ->orderByDesc('is_active')
            ->orderBy('id')
            ->get()
            ->map(fn (SppdPejabat $pj): array => [
                'id' => $pj->id,
                'nama' => $pj->nama,
                'nip' => $pj->nip,
                'pangkat' => $pj->pangkat,
                'golongan' => $pj->golongan,
                'jabatan' => $pj->jabatan,
                'is_active' => (bool) $pj->is_active,
            ])->values();

        $kecamatanOptions = SppdZonasi::select('nama_kecamatan', 'zona')
            ->distinct()
            ->orderBy('nama_kecamatan')
            ->get()
            ->map(fn (SppdZonasi $z): array => [
                'nama_kecamatan' => $z->nama_kecamatan,
                'zona' => $z->zona,
            ])->values();

        $records = SuratTugas::with(['participants', 'kepalaDinas'])
            ->orderByDesc('tanggal_spt')
            ->orderByDesc('id')
            ->get()
            ->map(function (SuratTugas $st): array {
                return [
                    'id' => $st->id,
                    'nomor_spt' => $st->nomor_spt,
                    'tanpa_surat' => (bool) $st->tanpa_surat,
                    'pengirim_surat' => $st->pengirim_surat,
                    'nomor_surat' => $st->nomor_surat,
                    'tanggal_surat' => $st->tanggal_surat ? Carbon::parse($st->tanggal_surat)->format('Y-m-d') : null,
                    'tanggal_surat_formatted' => $st->tanggal_surat ? self::formatIndoDate($st->tanggal_surat) : '-',
                    'tanggal_spt' => Carbon::parse($st->tanggal_spt)->format('Y-m-d'),
                    'tanggal_spt_formatted' => self::formatIndoDate($st->tanggal_spt),
                    'tanggal_berangkat' => Carbon::parse($st->tanggal_berangkat)->format('Y-m-d'),
                    'tanggal_berangkat_formatted' => self::formatIndoDate($st->tanggal_berangkat),
                    'tanggal_kembali' => Carbon::parse($st->tanggal_kembali)->format('Y-m-d'),
                    'tanggal_kembali_formatted' => self::formatIndoDate($st->tanggal_kembali),
                    'lama_hari' => (int) $st->lama_hari,
                    'tujuan' => $st->tujuan,
                    'nama_tempat' => $st->nama_tempat,
                    'nama_kecamatan' => $st->nama_kecamatan,
                    'alamat_lengkap' => $st->alamat_lengkap,
                    'penandatangan_mode' => $st->penandatangan_mode ?: 'database',
                    'kepala_dinas_id' => $st->kepala_dinas_id,
                    'ttd_jabatan' => $st->ttd_jabatan,
                    'ttd_nama' => $st->ttd_nama,
                    'ttd_pangkat_gol' => $st->ttd_pangkat_gol,
                    'ttd_nip' => $st->ttd_nip,
                    'ttd_image_url' => $st->ttd_image_path ? '/'.ltrim($st->ttd_image_path, '/') : null,
                    'ttd_offset_x' => (int) ($st->ttd_offset_x ?? 0),
                    'ttd_offset_y' => (int) ($st->ttd_offset_y ?? 0),
                    'ttd_scale' => (int) ($st->ttd_scale ?? 100),
                    'participants' => $st->participants->map(fn (SuratTugasParticipant $pt): array => [
                        'id' => $pt->id,
                        'pegawai_id' => $pt->pegawai_id,
                        'urutan' => (int) $pt->urutan,
                        'nama' => $pt->nama,
                        'nip' => $pt->nip,
                        'pangkat' => $pt->pangkat,
                        'golongan' => $pt->golongan,
                        'jabatan' => $pt->jabatan,
                    ])->values()->all(),
                ];
            })->values();

        return Inertia::render('surat-tugas/index', [
            'suratTugasList' => $records,
            'pegawais' => $pegawais,
            'kepalaDinasList' => $kepalaDinasList,
            'kecamatanOptions' => $kecamatanOptions,
            'todayStr' => now()->format('Y-m-d'),
            'defaultTtdImageUrl' => '/'.self::DEFAULT_TTD_IMAGE_PATH,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tanpaSurat = $request->boolean('tanpa_surat');
        if ($tanpaSurat) {
            $pengirimInput = trim((string) $request->input('pengirim_surat', ''));
            $request->merge([
                'pengirim_surat' => $pengirimInput !== '' ? $pengirimInput : self::DEFAULT_DASAR_TANPA_SURAT,
                'nomor_surat' => null,
                'tanggal_surat' => null,
            ]);
        }

        $validated = $request->validate([
            'nomor_spt' => ['nullable', 'string', 'max:150'],
            'tanpa_surat' => ['nullable', 'boolean'],
            'pengirim_surat' => ['required', 'string', 'max:2000'],
            'nomor_surat' => ['nullable', 'string', 'max:150'],
            'tanggal_surat' => [$tanpaSurat ? 'nullable' : 'required', 'nullable', 'date'],
            'tanggal_spt' => ['required', 'date'],
            'tanggal_berangkat' => ['required', 'date'],
            'tanggal_kembali' => ['required', 'date', 'after_or_equal:tanggal_berangkat'],
            'tujuan' => ['required', 'string', 'max:2000'],
            'nama_tempat' => ['nullable', 'string', 'max:255'],
            'nama_kecamatan' => ['nullable', 'string', 'max:150'],
            'alamat_lengkap' => ['nullable', 'string', 'max:2000'],
            'penandatangan_mode' => ['required', 'in:database,manual'],
            'kepala_dinas_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'ttd_jabatan' => ['required_if:penandatangan_mode,manual', 'nullable', 'string', 'max:255'],
            'ttd_nama' => ['required_if:penandatangan_mode,manual', 'nullable', 'string', 'max:255'],
            'ttd_pangkat_gol' => ['nullable', 'string', 'max:255'],
            'ttd_nip' => ['nullable', 'string', 'max:100'],
            'ttd_source' => ['nullable', 'in:none,default,upload'],
            'ttd_image' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'ttd_offset_x' => ['nullable', 'integer', 'min:-200', 'max:250'],
            'ttd_offset_y' => ['nullable', 'integer', 'min:-120', 'max:120'],
            'ttd_scale' => ['nullable', 'integer', 'min:30', 'max:220'],
            'pegawai_ids' => ['required', 'array', 'min:1'],
            'pegawai_ids.*' => ['required', 'exists:sppd_pegawais,id'],
        ], [
            'pegawai_ids.required' => 'Minimal 1 pegawai yang ditugaskan wajib dipilih.',
            'ttd_image.image' => 'File tanda tangan harus berupa gambar (PNG/JPG/WEBP).',
            'ttd_image.max' => 'Ukuran file tanda tangan maksimal 2 MB.',
        ]);

        $signerData = $this->resolveSignerFields($validated);
        $ttdSource = $validated['ttd_source'] ?? ($request->hasFile('ttd_image') ? 'upload' : 'none');
        if ($ttdSource === 'default') {
            $ttdImagePath = self::DEFAULT_TTD_IMAGE_PATH;
        } elseif ($ttdSource === 'upload') {
            $ttdImagePath = $this->handleSignatureUpload($request);
        } else {
            $ttdImagePath = null;
        }

        $lamaHari = max(1, (int) Carbon::parse($validated['tanggal_berangkat'])->diffInDays(Carbon::parse($validated['tanggal_kembali'])) + 1);
        $allPegawai = SppdPegawai::whereIn('id', $validated['pegawai_ids'])->get()->keyBy('id');

        DB::transaction(function () use ($validated, $tanpaSurat, $signerData, $ttdImagePath, $lamaHari, $allPegawai): void {
            $st = SuratTugas::create([
                'nomor_spt' => ! empty($validated['nomor_spt']) ? trim($validated['nomor_spt']) : null,
                'tanpa_surat' => $tanpaSurat,
                'pengirim_surat' => trim($validated['pengirim_surat']),
                'nomor_surat' => ! empty($validated['nomor_surat']) ? trim($validated['nomor_surat']) : null,
                'tanggal_surat' => $validated['tanggal_surat'] ?? null,
                'tanggal_spt' => $validated['tanggal_spt'],
                'tanggal_berangkat' => $validated['tanggal_berangkat'],
                'tanggal_kembali' => $validated['tanggal_kembali'],
                'lama_hari' => $lamaHari,
                'tujuan' => trim($validated['tujuan']),
                'nama_tempat' => ! empty($validated['nama_tempat']) ? trim($validated['nama_tempat']) : null,
                'nama_kecamatan' => ! empty($validated['nama_kecamatan']) ? trim($validated['nama_kecamatan']) : null,
                'alamat_lengkap' => ! empty($validated['alamat_lengkap']) ? trim($validated['alamat_lengkap']) : null,
                'penandatangan_mode' => $validated['penandatangan_mode'],
                'kepala_dinas_id' => $signerData['kepala_dinas_id'],
                'ttd_jabatan' => $signerData['ttd_jabatan'],
                'ttd_nama' => $signerData['ttd_nama'],
                'ttd_pangkat_gol' => $signerData['ttd_pangkat_gol'],
                'ttd_nip' => $signerData['ttd_nip'],
                'ttd_image_path' => $ttdImagePath,
                'ttd_offset_x' => (int) ($validated['ttd_offset_x'] ?? 0),
                'ttd_offset_y' => (int) ($validated['ttd_offset_y'] ?? 0),
                'ttd_scale' => (int) ($validated['ttd_scale'] ?? 100),
            ]);

            $urutan = 1;
            foreach ($validated['pegawai_ids'] as $pegawaiId) {
                /** @var SppdPegawai|null $pegawai */
                $pegawai = $allPegawai->get((int) $pegawaiId);
                if (! $pegawai) {
                    continue;
                }

                SuratTugasParticipant::create([
                    'surat_tugas_id' => $st->id,
                    'pegawai_id' => $pegawai->id,
                    'urutan' => $urutan++,
                    'nama' => $pegawai->nama,
                    'nip' => $pegawai->nip,
                    'pangkat' => $pegawai->pangkat,
                    'golongan' => $pegawai->golongan,
                    'jabatan' => $pegawai->jabatan,
                ]);
            }
        });

        return back()->with('success', 'Surat Tugas berhasil disimpan.');
    }

    public function update(Request $request, SuratTugas $suratTugas): RedirectResponse
    {
        $tanpaSurat = $request->boolean('tanpa_surat');
        if ($tanpaSurat) {
            $pengirimInput = trim((string) $request->input('pengirim_surat', ''));
            $request->merge([
                'pengirim_surat' => $pengirimInput !== '' ? $pengirimInput : self::DEFAULT_DASAR_TANPA_SURAT,
                'nomor_surat' => null,
                'tanggal_surat' => null,
            ]);
        }

        $validated = $request->validate([
            'nomor_spt' => ['nullable', 'string', 'max:150'],
            'tanpa_surat' => ['nullable', 'boolean'],
            'pengirim_surat' => ['required', 'string', 'max:2000'],
            'nomor_surat' => ['nullable', 'string', 'max:150'],
            'tanggal_surat' => [$tanpaSurat ? 'nullable' : 'required', 'nullable', 'date'],
            'tanggal_spt' => ['required', 'date'],
            'tanggal_berangkat' => ['required', 'date'],
            'tanggal_kembali' => ['required', 'date', 'after_or_equal:tanggal_berangkat'],
            'tujuan' => ['required', 'string', 'max:2000'],
            'nama_tempat' => ['nullable', 'string', 'max:255'],
            'nama_kecamatan' => ['nullable', 'string', 'max:150'],
            'alamat_lengkap' => ['nullable', 'string', 'max:2000'],
            'penandatangan_mode' => ['required', 'in:database,manual'],
            'kepala_dinas_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'ttd_jabatan' => ['required_if:penandatangan_mode,manual', 'nullable', 'string', 'max:255'],
            'ttd_nama' => ['required_if:penandatangan_mode,manual', 'nullable', 'string', 'max:255'],
            'ttd_pangkat_gol' => ['nullable', 'string', 'max:255'],
            'ttd_nip' => ['nullable', 'string', 'max:100'],
            'ttd_source' => ['nullable', 'in:none,default,upload'],
            'ttd_image' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'remove_ttd_image' => ['nullable', 'boolean'],
            'ttd_offset_x' => ['nullable', 'integer', 'min:-200', 'max:250'],
            'ttd_offset_y' => ['nullable', 'integer', 'min:-120', 'max:120'],
            'ttd_scale' => ['nullable', 'integer', 'min:30', 'max:220'],
            'pegawai_ids' => ['required', 'array', 'min:1'],
            'pegawai_ids.*' => ['required', 'exists:sppd_pegawais,id'],
        ]);

        $signerData = $this->resolveSignerFields($validated);
        $ttdImagePath = $suratTugas->ttd_image_path;
        $ttdSource = $validated['ttd_source'] ?? null;

        if ($ttdSource === 'none' || $request->boolean('remove_ttd_image')) {
            if ($ttdImagePath) {
                $this->deleteSignatureFile($ttdImagePath);
            }
            $ttdImagePath = null;
        } elseif ($ttdSource === 'default') {
            if ($ttdImagePath && $ttdImagePath !== self::DEFAULT_TTD_IMAGE_PATH) {
                $this->deleteSignatureFile($ttdImagePath);
            }
            $ttdImagePath = self::DEFAULT_TTD_IMAGE_PATH;
        } elseif ($request->hasFile('ttd_image')) {
            if ($ttdImagePath) {
                $this->deleteSignatureFile($ttdImagePath);
            }
            $ttdImagePath = $this->handleSignatureUpload($request);
        }

        $lamaHari = max(1, (int) Carbon::parse($validated['tanggal_berangkat'])->diffInDays(Carbon::parse($validated['tanggal_kembali'])) + 1);
        $allPegawai = SppdPegawai::whereIn('id', $validated['pegawai_ids'])->get()->keyBy('id');

        DB::transaction(function () use ($suratTugas, $validated, $tanpaSurat, $signerData, $ttdImagePath, $lamaHari, $allPegawai): void {
            $suratTugas->update([
                'nomor_spt' => ! empty($validated['nomor_spt']) ? trim($validated['nomor_spt']) : null,
                'tanpa_surat' => $tanpaSurat,
                'pengirim_surat' => trim($validated['pengirim_surat']),
                'nomor_surat' => ! empty($validated['nomor_surat']) ? trim($validated['nomor_surat']) : null,
                'tanggal_surat' => $validated['tanggal_surat'] ?? null,
                'tanggal_spt' => $validated['tanggal_spt'],
                'tanggal_berangkat' => $validated['tanggal_berangkat'],
                'tanggal_kembali' => $validated['tanggal_kembali'],
                'lama_hari' => $lamaHari,
                'tujuan' => trim($validated['tujuan']),
                'nama_tempat' => ! empty($validated['nama_tempat']) ? trim($validated['nama_tempat']) : null,
                'nama_kecamatan' => ! empty($validated['nama_kecamatan']) ? trim($validated['nama_kecamatan']) : null,
                'alamat_lengkap' => ! empty($validated['alamat_lengkap']) ? trim($validated['alamat_lengkap']) : null,
                'penandatangan_mode' => $validated['penandatangan_mode'],
                'kepala_dinas_id' => $signerData['kepala_dinas_id'],
                'ttd_jabatan' => $signerData['ttd_jabatan'],
                'ttd_nama' => $signerData['ttd_nama'],
                'ttd_pangkat_gol' => $signerData['ttd_pangkat_gol'],
                'ttd_nip' => $signerData['ttd_nip'],
                'ttd_image_path' => $ttdImagePath,
                'ttd_offset_x' => (int) ($validated['ttd_offset_x'] ?? 0),
                'ttd_offset_y' => (int) ($validated['ttd_offset_y'] ?? 0),
                'ttd_scale' => (int) ($validated['ttd_scale'] ?? 100),
            ]);

            $suratTugas->participants()->delete();

            $urutan = 1;
            foreach ($validated['pegawai_ids'] as $pegawaiId) {
                /** @var SppdPegawai|null $pegawai */
                $pegawai = $allPegawai->get((int) $pegawaiId);
                if (! $pegawai) {
                    continue;
                }

                SuratTugasParticipant::create([
                    'surat_tugas_id' => $suratTugas->id,
                    'pegawai_id' => $pegawai->id,
                    'urutan' => $urutan++,
                    'nama' => $pegawai->nama,
                    'nip' => $pegawai->nip,
                    'pangkat' => $pegawai->pangkat,
                    'golongan' => $pegawai->golongan,
                    'jabatan' => $pegawai->jabatan,
                ]);
            }
        });

        return back()->with('success', 'Surat Tugas berhasil diperbarui.');
    }

    public function destroy(SuratTugas $suratTugas): RedirectResponse
    {
        if ($suratTugas->ttd_image_path) {
            $this->deleteSignatureFile($suratTugas->ttd_image_path);
        }

        $suratTugas->delete();

        return back()->with('success', 'Surat Tugas berhasil dihapus.');
    }

    public function downloadPdf(SuratTugas $suratTugas): SymfonyResponse
    {
        @ini_set('memory_limit', '512M');

        $suratTugas->load(['participants', 'kepalaDinas']);

        $pengirim = trim((string) $suratTugas->pengirim_surat);
        $tglSuratIndo = $suratTugas->tanggal_surat ? self::formatIndoDate($suratTugas->tanggal_surat) : '-';
        $nomorSurat = trim((string) ($suratTugas->nomor_surat ?? ''));
        $tujuanClean = rtrim(trim((string) $suratTugas->tujuan), '.');
        $isTanpaSurat = (bool) $suratTugas->tanpa_surat;

        if ($isTanpaSurat) {
            $dasarText = $pengirim;
            $dasarItems = self::parseNumberedDasarItems($pengirim);
        } else {
            $dasarText = "Surat dari {$pengirim} tanggal {$tglSuratIndo}";
            if ($nomorSurat !== '') {
                $dasarText .= " nomor: {$nomorSurat}";
            }
            $dasarText .= ", perihal: {$tujuanClean}.";
            $dasarItems = [];
        }

        // Untuk Poin 1
        if ($isTanpaSurat) {
            $cleanedTujuan = preg_replace('/^menghadiri\s+/iu', '', $tujuanClean);
            $untukPoin1 = ucfirst(trim((string) $cleanedTujuan)).'.';
        } else {
            $lowerTujuan = strtolower($tujuanClean);
            if (
                str_starts_with($lowerTujuan, 'menghadiri ') ||
                str_starts_with($lowerTujuan, 'melaksanakan ') ||
                str_starts_with($lowerTujuan, 'mengikuti ') ||
                str_starts_with($lowerTujuan, 'melakukan ')
            ) {
                $untukPoin1 = ucfirst($tujuanClean).'.';
            } else {
                $untukPoin1 = 'Menghadiri '.$tujuanClean.'.';
            }
        }

        // Untuk Poin 2: jadwal & tempat
        $berangkat = Carbon::parse($suratTugas->tanggal_berangkat);
        $kembali = Carbon::parse($suratTugas->tanggal_kembali);
        $hariBerangkat = self::formatIndoDayName($berangkat);
        $tglBerangkatIndo = self::formatIndoDate($berangkat);

        $tempatParts = array_values(array_filter([
            rtrim(trim((string) ($suratTugas->nama_tempat ?? '')), ',. '),
            rtrim(trim((string) ($suratTugas->alamat_lengkap ?? '')), ',. '),
            rtrim(trim((string) ($suratTugas->nama_kecamatan ?? '')), ',. '),
        ], fn (string $p) => $p !== ''));

        $tempatLengkap = implode(', ', $tempatParts);

        if ($berangkat->isSameDay($kembali)) {
            $untukPoin2 = "Kegiatan dilaksanakan pada hari {$hariBerangkat}, tanggal {$tglBerangkatIndo}";
        } else {
            $hariKembali = self::formatIndoDayName($kembali);
            $tglKembaliIndo = self::formatIndoDate($kembali);
            $untukPoin2 = "Kegiatan dilaksanakan pada hari {$hariBerangkat} s.d. {$hariKembali}, tanggal {$tglBerangkatIndo} s.d. {$tglKembaliIndo}";
        }

        if ($tempatLengkap !== '') {
            $untukPoin2 .= ", bertempat di {$tempatLengkap}.";
        } else {
            $untukPoin2 .= '.';
        }

        $participants = $suratTugas->participants
            ->sortBy('urutan')
            ->map(function (SuratTugasParticipant $pt): array {
                $jabatanText = trim((string) $pt->jabatan);
                if ($jabatanText !== '' && ! str_contains(strtolower($jabatanText), 'dkpp')) {
                    $jabatanText .= ' pada DKPP Kab. Indramayu';
                }

                return [
                    'nama' => strtoupper($pt->nama),
                    'pangkat_gol' => self::formatPangkatGolSlash($pt->pangkat, $pt->golongan),
                    'nip' => self::formatNipSpaced($pt->nip),
                    'jabatan' => $jabatanText ?: 'Pelaksana Pada DKPP Kab. Indramayu',
                ];
            })->values()->all();

        // Penandatangan
        $rawJabatan = trim((string) $suratTugas->ttd_jabatan);
        $isPlt = str_starts_with(strtolower($rawJabatan), 'plt');
        $jabatanDisplay = $isPlt
            ? trim((string) preg_replace('/^plt\.?\s*/i', '', $rawJabatan))
            : $rawJabatan;

        if ($jabatanDisplay === '') {
            $jabatanDisplay = 'KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN';
        }

        // Pastikan "KABUPATEN INDRAMAYU," selalu tampil di baris baru di bawah tulisan jabatan,
        // dan pecah "KEPALA DINAS KETAHANAN PANGAN DAN PERTANIAN" menjadi 2 baris agar rapi di sisi kanan.
        $jabatanLine1 = rtrim(trim((string) preg_replace('/,?\s*kabupaten\s+indramayu\.?,?$/iu', '', $jabatanDisplay)), ', ');
        $jabatanUpper = mb_strtoupper($jabatanLine1, 'UTF-8');
        $jabatanLines = [];
        if (preg_match('/^(.*KETAHANAN\s+PANGAN)\s+(DAN\s+PERTANIAN.*)$/u', $jabatanUpper, $m)) {
            $jabatanLines[] = trim($m[1]);
            $jabatanLines[] = trim($m[2]);
        } else {
            $jabatanLines[] = $jabatanUpper;
        }
        $jabatanLines[] = 'KABUPATEN INDRAMAYU,';

        $nomorSptClean = trim((string) ($suratTugas->nomor_spt ?? ''));
        $nomorSptHtml = $nomorSptClean !== ''
            ? e($nomorSptClean)
            : '800.1.11.1/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/KDP';

        $safeName = Str::slug(Str::limit($suratTugas->tujuan, 40, ''), '_') ?: 'surat_tugas_'.$suratTugas->id;

        $pdf = Pdf::loadView('pdf.surat-tugas', [
            'docTitle' => 'Surat Tugas - '.$suratTugas->tujuan,
            'logoBase64' => self::getLogoBase64(),
            'nomorSptHtml' => $nomorSptHtml,
            'dasarText' => $dasarText,
            'dasarItems' => $dasarItems,
            'participants' => $participants,
            'untukPoin1' => $untukPoin1,
            'untukPoin2' => $untukPoin2,
            'tanggalSptIndo' => self::formatIndoDate($suratTugas->tanggal_spt),
            'ttdPrefix' => $isPlt ? 'Plt.' : '',
            'ttdJabatanLines' => $jabatanLines,
            'ttdNama' => mb_strtoupper((string) $suratTugas->ttd_nama, 'UTF-8'),
            'ttdPangkatGol' => trim((string) ($suratTugas->ttd_pangkat_gol ?? '')),
            'ttdNip' => self::formatNipSpaced($suratTugas->ttd_nip),
            'ttdImageBase64' => self::getSignatureBase64($suratTugas->ttd_image_path),
            'ttdOffsetX' => (int) ($suratTugas->ttd_offset_x ?? 0),
            'ttdOffsetY' => (int) ($suratTugas->ttd_offset_y ?? 0),
            'ttdHeightPx' => max(20, (int) round(64 * (((int) ($suratTugas->ttd_scale ?? 100)) / 100))),
        ])->setPaper('a4', 'portrait');

        if (request()->boolean('download')) {
            return $pdf->download("Surat_Tugas_{$safeName}.pdf");
        }

        return $pdf->stream("Surat_Tugas_{$safeName}.pdf");
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{kepala_dinas_id: int|null, ttd_jabatan: string, ttd_nama: string, ttd_pangkat_gol: string|null, ttd_nip: string|null}
     */
    private function resolveSignerFields(array $validated): array
    {
        if ($validated['penandatangan_mode'] === 'database') {
            $kadin = ! empty($validated['kepala_dinas_id'])
                ? SppdPejabat::find((int) $validated['kepala_dinas_id'])
                : (SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->where('is_active', true)->first()
                    ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->first());

            $pangkat = trim((string) ($kadin?->pangkat ?? ''));
            $gol = trim((string) ($kadin?->golongan ?? ''));
            $pangkatGol = $pangkat !== '' && $gol !== ''
                ? "{$pangkat} - {$gol}"
                : ($pangkat ?: ($gol ?: null));

            $jabatan = trim((string) ($kadin?->jabatan ?? ''));
            if ($jabatan === '') {
                $jabatan = self::DEFAULT_JABATAN_KADIN;
            }

            return [
                'kepala_dinas_id' => $kadin?->id,
                'ttd_jabatan' => $jabatan,
                'ttd_nama' => $kadin?->nama ?? 'RORY FIRMANSYAH, S.STP., M.Si',
                'ttd_pangkat_gol' => $pangkatGol,
                'ttd_nip' => $kadin?->nip,
            ];
        }

        return [
            'kepala_dinas_id' => null,
            'ttd_jabatan' => trim((string) ($validated['ttd_jabatan'] ?? self::DEFAULT_JABATAN_KADIN)),
            'ttd_nama' => trim((string) ($validated['ttd_nama'] ?? '')),
            'ttd_pangkat_gol' => ! empty($validated['ttd_pangkat_gol']) ? trim((string) $validated['ttd_pangkat_gol']) : null,
            'ttd_nip' => ! empty($validated['ttd_nip']) ? trim((string) $validated['ttd_nip']) : null,
        ];
    }

    private function handleSignatureUpload(Request $request): ?string
    {
        if (! $request->hasFile('ttd_image')) {
            return null;
        }

        $file = $request->file('ttd_image');
        $dir = public_path('uploads/ttd-surat-tugas');
        if (! File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        $ext = strtolower($file->getClientOriginalExtension() ?: 'png');
        $filename = 'ttd_'.date('YmdHis').'_'.Str::random(8).'.'.$ext;
        $file->move($dir, $filename);

        return 'uploads/ttd-surat-tugas/'.$filename;
    }

    private function deleteSignatureFile(?string $relativePath): void
    {
        if (! $relativePath || ltrim($relativePath, '/') === self::DEFAULT_TTD_IMAGE_PATH) {
            return;
        }

        $fullPath = public_path(ltrim($relativePath, '/'));
        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }
}
