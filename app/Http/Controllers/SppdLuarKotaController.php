<?php

namespace App\Http\Controllers;

use App\Models\SppdDpa;
use App\Models\SppdLuarKota;
use App\Models\SppdLuarKotaParticipant;
use App\Models\SppdPegawai;
use App\Models\SppdPejabat;
use App\Models\SppdSubKegiatan;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class SppdLuarKotaController extends Controller
{
    public const DEFAULT_DASAR_TANPA_SURAT = '1. Undang-Undang Nomor 18 Tahun 2012 tentang Pangan; 2. PP No.17 Tahun 2015 tentang Ketahanan Pangan dan Gizi.';

    private static function isTanpaSuratText(?string $text): bool
    {
        $clean = trim((string) $text);
        if ($clean === '') {
            return false;
        }

        return (bool) preg_match('/^\s*1\.\s+/u', $clean)
            || str_contains(strtolower($clean), 'undang-undang')
            || str_contains(strtolower($clean), 'pp no');
    }

    /**
     * Pecah teks dasar berpoin (contoh: "1. ...; 2. ...") menjadi array poin tanpa nomor urut di depannya.
     *
     * @return array<int, string>
     */
    private static function parseNumberedDasarItems(string $text): array
    {
        $clean = trim($text);
        $parts = preg_split('/\s*(?:^|\s+)\d+\.\s+/u', $clean, -1, PREG_SPLIT_NO_EMPTY);
        if (! is_array($parts) || count($parts) <= 1) {
            return [];
        }

        return array_values(array_filter(array_map('trim', $parts), fn (string $p) => $p !== ''));
    }

    private static function ensureKabKotaColumnExists(): void
    {
        if (! Schema::hasColumn('sppd_luar_kotas', 'kab_kota')) {
            Schema::table('sppd_luar_kotas', function (Blueprint $table) {
                $table->string('kab_kota', 150)->nullable()->after('alamat_lengkap');
            });
        }
    }

    private static function formatIndoDate(string|\DateTimeInterface $date): string
    {
        $bulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];
        $c = Carbon::parse($date);

        return $c->day.' '.($bulan[$c->month] ?? $c->format('F')).' '.$c->year;
    }

    private static function formatIndoDateRange(string|\DateTimeInterface $startDate, string|\DateTimeInterface $endDate): string
    {
        $bulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        if ($start->isSameDay($end)) {
            return $start->day.' '.($bulan[$start->month] ?? $start->format('F')).' '.$start->year;
        }

        if ($start->year === $end->year && $start->month === $end->month) {
            return $start->day.' - '.$end->day.' '.($bulan[$start->month] ?? $start->format('F')).' '.$start->year;
        }

        if ($start->year === $end->year) {
            return $start->day.' '.($bulan[$start->month] ?? $start->format('F')).' - '.$end->day.' '.($bulan[$end->month] ?? $end->format('F')).' '.$start->year;
        }

        return self::formatIndoDate($start).' - '.self::formatIndoDate($end);
    }

    private static function formatIndoDayName(string|\DateTimeInterface $date): string
    {
        $days = [
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
        ];
        $c = Carbon::parse($date);

        return $days[(int) $c->dayOfWeek] ?? $c->format('l');
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

    private static function formatPangkatGolSlash(?string $pangkat, ?string $golongan): string
    {
        $p = trim((string) $pangkat);
        $g = trim((string) $golongan);
        if ($p !== '' && $g !== '') {
            return $p.' / '.$g;
        }

        return $p !== '' ? $p : ($g !== '' ? $g : '-');
    }

    public function index(): Response
    {
        $pegawais = SppdPegawai::orderBy('nama')
            ->get()
            ->sortBy([
                [fn (SppdPegawai $p) => SppdPegawai::golonganRank($p->golongan, $p->pangkat), 'desc'],
                ['nama', 'asc'],
            ])
            ->map(fn (SppdPegawai $p): array => [
                'id' => $p->id,
                'nama' => $p->nama,
                'nip' => $p->nip,
                'pangkat' => $p->pangkat,
                'golongan' => $p->golongan,
                'jabatan' => $p->jabatan,
                'is_active' => (bool) $p->is_active,
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
                'tahun_anggaran' => (int) $d->tahun_anggaran,
                'keterangan' => $d->keterangan,
                'is_active' => (bool) $d->is_active,
            ])->values();

        $allSppds = SppdLuarKota::with(['subKegiatan', 'dpa', 'participants', 'kepalaDinas', 'pptk', 'bendahara'])
            ->orderByDesc('id')
            ->get();

        $sppdBatches = $allSppds
            ->groupBy('batch_code')
            ->map(function ($items, string $batchCode): array {
                $sortedItems = $items->sortBy([
                    ['tanggal_berangkat', 'asc'],
                    ['id', 'asc'],
                ])->values();

                /** @var SppdLuarKota $first */
                $first = $sortedItems->first();
                /** @var SppdLuarKota $last */
                $last = $sortedItems->last();

                $uniqueEmployees = $sortedItems
                    ->flatMap(fn (SppdLuarKota $s) => $s->participants)
                    ->unique(fn (SppdLuarKotaParticipant $pt) => $pt->pegawai_id ?: $pt->nama)
                    ->map(fn (SppdLuarKotaParticipant $pt): array => [
                        'pegawai_id' => $pt->pegawai_id,
                        'nama' => $pt->nama,
                        'golongan' => $pt->golongan,
                    ])
                    ->values();

                $itemsFormatted = $sortedItems->map(fn (SppdLuarKota $sppd): array => [
                    'id' => $sppd->id,
                    'tanpa_surat' => self::isTanpaSuratText($sppd->pengirim_surat),
                    'pengirim_surat' => $sppd->pengirim_surat,
                    'nomor_surat' => $sppd->nomor_surat,
                    'tanggal_surat' => Carbon::parse($sppd->tanggal_surat)->format('Y-m-d'),
                    'tanggal_surat_formatted' => self::formatIndoDate($sppd->tanggal_surat),
                    'tanggal_spt' => $sppd->tanggal_spt
                        ? Carbon::parse($sppd->tanggal_spt)->format('Y-m-d')
                        : Carbon::parse($sppd->tanggal_berangkat)->format('Y-m-d'),
                    'tanggal_spt_formatted' => self::formatIndoDate($sppd->tanggal_spt ?? $sppd->tanggal_berangkat),
                    'tanggal_berangkat' => Carbon::parse($sppd->tanggal_berangkat)->format('Y-m-d'),
                    'tanggal_berangkat_formatted' => self::formatIndoDate($sppd->tanggal_berangkat),
                    'tanggal_kembali' => Carbon::parse($sppd->tanggal_kembali)->format('Y-m-d'),
                    'tanggal_kembali_formatted' => self::formatIndoDate($sppd->tanggal_kembali),
                    'lama_hari' => (int) $sppd->lama_hari,
                    'tujuan' => $sppd->tujuan,
                    'alamat_lengkap' => $sppd->alamat_lengkap,
                    'kab_kota' => $sppd->kab_kota,
                    'perihal' => $sppd->perihal,
                    'kepala_dinas_id' => $sppd->kepala_dinas_id,
                    'pptk_id' => $sppd->pptk_id,
                    'bendahara_id' => $sppd->bendahara_id,
                    'total_uang_harian' => (float) $sppd->total_uang_harian,
                    'total_uang_transport' => (float) $sppd->total_uang_transport,
                    'total_biaya' => (float) $sppd->total_biaya,
                    'participants' => $sppd->participants->map(fn (SppdLuarKotaParticipant $pt): array => [
                        'id' => $pt->id,
                        'pegawai_id' => $pt->pegawai_id,
                        'urutan' => (int) $pt->urutan,
                        'nama' => $pt->nama,
                        'nip' => $pt->nip,
                        'pangkat' => $pt->pangkat,
                        'golongan' => $pt->golongan,
                        'jabatan' => $pt->jabatan,
                        'uang_harian' => (float) $pt->uang_harian,
                        'uang_transport' => (float) $pt->uang_transport,
                        'total_biaya' => (float) $pt->total_biaya,
                    ])->values()->all(),
                ])->values()->all();

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
                        'tahun_anggaran' => (int) $first->dpa->tahun_anggaran,
                    ] : null,
                    'first_tanggal_berangkat_formatted' => self::formatIndoDate($first->tanggal_berangkat),
                    'last_tanggal_berangkat_formatted' => self::formatIndoDate($last->tanggal_berangkat),
                    'tujuan_list' => $sortedItems->pluck('tujuan')->unique()->values()->all(),
                    'employees' => $uniqueEmployees->all(),
                    'total_uang_harian' => (float) $sortedItems->sum('total_uang_harian'),
                    'total_uang_transport' => (float) $sortedItems->sum('total_uang_transport'),
                    'total_biaya' => (float) $sortedItems->sum('total_biaya'),
                    'items' => $itemsFormatted,
                ];
            })
            ->values();

        return Inertia::render('sppd-luar-kota/index', [
            'sppdBatches' => $sppdBatches,
            'pegawais' => $pegawais,
            'kepalaDinasList' => $pejabats->where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->map($formatPejabat)->values(),
            'pptkList' => $pejabats->where('tipe', SppdPejabat::TIPE_PPTK)->map($formatPejabat)->values(),
            'bendaharaList' => $pejabats->where('tipe', SppdPejabat::TIPE_BENDAHARA)->map($formatPejabat)->values(),
            'subKegiatans' => $subKegiatans,
            'dpas' => $dpas,
            'statistics' => [
                'total_batches' => $sppdBatches->count(),
                'total_sppd' => $allSppds->count(),
                'total_personil' => $allSppds->sum(fn (SppdLuarKota $s) => $s->participants->count()),
                'total_uang_harian' => (float) $allSppds->sum('total_uang_harian'),
                'total_uang_transport' => (float) $allSppds->sum('total_uang_transport'),
                'total_biaya' => (float) $allSppds->sum('total_biaya'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        self::ensureKabKotaColumnExists();

        $tanpaSurat = $request->boolean('tanpa_surat');
        if ($tanpaSurat) {
            $pengirimInput = trim((string) $request->input('pengirim_surat', ''));
            $request->merge([
                'pengirim_surat' => $pengirimInput !== '' ? $pengirimInput : self::DEFAULT_DASAR_TANPA_SURAT,
                'nomor_surat' => null,
                'tanggal_surat' => $request->input('tanggal_surat') ?: $request->input('tanggal_spt') ?: now()->format('Y-m-d'),
            ]);
        }

        $validated = $request->validate([
            'batch_code' => ['nullable', 'string', 'max:60'],
            'sub_kegiatan_id' => ['required', 'exists:sppd_sub_kegiatans,id'],
            'dpa_id' => ['required', 'exists:sppd_dpas,id'],
            'pengirim_surat' => ['required', 'string', 'max:500'],
            'nomor_surat' => ['nullable', 'string', 'max:150'],
            'tanggal_surat' => ['required', 'date'],
            'tanggal_spt' => ['required', 'date'],
            'tanggal_berangkat' => ['required', 'date'],
            'tanggal_kembali' => ['required', 'date', 'after_or_equal:tanggal_berangkat'],
            'tujuan' => ['required', 'string', 'max:255'],
            'alamat_lengkap' => ['required', 'string', 'max:2000'],
            'kab_kota' => ['required', 'string', 'max:150'],
            'perihal' => ['required', 'string', 'max:2000'],
            'kepala_dinas_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'pptk_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'bendahara_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'participants' => ['required', 'array', 'min:1'],
            'participants.*.pegawai_id' => ['required', 'exists:sppd_pegawais,id'],
            'participants.*.uang_harian' => ['required', 'numeric', 'min:0'],
            'participants.*.uang_transport' => ['required', 'numeric', 'min:0'],
        ], [
            'tanggal_kembali.after_or_equal' => 'Tanggal kembali tidak boleh lebih awal dari tanggal berangkat.',
            'participants.required' => 'Pilih minimal 1 petugas berangkat.',
            'participants.*.pegawai_id.required' => 'Nama petugas wajib dipilih.',
        ]);

        $rawBatch = trim((string) ($validated['batch_code'] ?? ''));
        if ($rawBatch === '' || $rawBatch === 'NEW') {
            $batchCount = SppdLuarKota::distinct('batch_code')->count('batch_code') + 1;
            $batchCode = 'BATCH-LK-'.str_pad((string) $batchCount, 2, '0', STR_PAD_LEFT).'-'.strtoupper(Str::random(2));
        } else {
            $batchCode = $rawBatch;
        }

        $lamaHari = max(1, (int) Carbon::parse($validated['tanggal_berangkat'])->diffInDays(Carbon::parse($validated['tanggal_kembali'])) + 1);
        $allPegawai = SppdPegawai::all()->keyBy('id');

        DB::transaction(function () use ($validated, $batchCode, $lamaHari, $allPegawai): void {
            $sppd = SppdLuarKota::create([
                'batch_code' => $batchCode,
                'sub_kegiatan_id' => (int) $validated['sub_kegiatan_id'],
                'dpa_id' => (int) $validated['dpa_id'],
                'pengirim_surat' => trim($validated['pengirim_surat']),
                'nomor_surat' => ! empty($validated['nomor_surat']) ? trim($validated['nomor_surat']) : null,
                'tanggal_surat' => $validated['tanggal_surat'],
                'tanggal_spt' => $validated['tanggal_spt'],
                'tanggal_berangkat' => $validated['tanggal_berangkat'],
                'tanggal_kembali' => $validated['tanggal_kembali'],
                'lama_hari' => $lamaHari,
                'tujuan' => trim($validated['tujuan']),
                'alamat_lengkap' => trim($validated['alamat_lengkap']),
                'kab_kota' => trim($validated['kab_kota']),
                'perihal' => trim($validated['perihal']),
                'kepala_dinas_id' => $validated['kepala_dinas_id'] ?? null,
                'pptk_id' => $validated['pptk_id'] ?? null,
                'bendahara_id' => $validated['bendahara_id'] ?? null,
            ]);

            $totalHarian = 0.0;
            $totalTransport = 0.0;
            $urutan = 1;

            foreach ($validated['participants'] as $ptData) {
                /** @var SppdPegawai|null $pegawai */
                $pegawai = $allPegawai->get((int) $ptData['pegawai_id']);
                if (! $pegawai) {
                    continue;
                }

                $uh = (float) $ptData['uang_harian'];
                $ut = (float) $ptData['uang_transport'];
                $sub = $uh + $ut;

                SppdLuarKotaParticipant::create([
                    'sppd_luar_kota_id' => $sppd->id,
                    'pegawai_id' => $pegawai->id,
                    'urutan' => $urutan++,
                    'nama' => $pegawai->nama,
                    'nip' => $pegawai->nip,
                    'pangkat' => $pegawai->pangkat,
                    'golongan' => $pegawai->golongan,
                    'jabatan' => $pegawai->jabatan,
                    'uang_harian' => $uh,
                    'uang_transport' => $ut,
                    'total_biaya' => $sub,
                ]);

                $totalHarian += $uh;
                $totalTransport += $ut;
            }

            $sppd->update([
                'total_uang_harian' => $totalHarian,
                'total_uang_transport' => $totalTransport,
                'total_biaya' => $totalHarian + $totalTransport,
            ]);
        });

        return back()->with('success', "Data SPPD Luar Kota berhasil disimpan ke dalam Batch '{$batchCode}'.");
    }

    public function update(Request $request, SppdLuarKota $sppdLuarKota): RedirectResponse
    {
        self::ensureKabKotaColumnExists();

        $tanpaSurat = $request->boolean('tanpa_surat');
        if ($tanpaSurat) {
            $pengirimInput = trim((string) $request->input('pengirim_surat', ''));
            $request->merge([
                'pengirim_surat' => $pengirimInput !== '' ? $pengirimInput : self::DEFAULT_DASAR_TANPA_SURAT,
                'nomor_surat' => null,
                'tanggal_surat' => $request->input('tanggal_surat') ?: $request->input('tanggal_spt') ?: now()->format('Y-m-d'),
            ]);
        }

        $validated = $request->validate([
            'pengirim_surat' => ['required', 'string', 'max:500'],
            'nomor_surat' => ['nullable', 'string', 'max:150'],
            'tanggal_surat' => ['required', 'date'],
            'tanggal_spt' => ['required', 'date'],
            'tanggal_berangkat' => ['required', 'date'],
            'tanggal_kembali' => ['required', 'date', 'after_or_equal:tanggal_berangkat'],
            'tujuan' => ['required', 'string', 'max:255'],
            'alamat_lengkap' => ['required', 'string', 'max:2000'],
            'kab_kota' => ['required', 'string', 'max:150'],
            'perihal' => ['required', 'string', 'max:2000'],
            'kepala_dinas_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'pptk_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'bendahara_id' => ['nullable', 'exists:sppd_pejabats,id'],
            'participants' => ['required', 'array', 'min:1'],
            'participants.*.pegawai_id' => ['required', 'exists:sppd_pegawais,id'],
            'participants.*.uang_harian' => ['required', 'numeric', 'min:0'],
            'participants.*.uang_transport' => ['required', 'numeric', 'min:0'],
        ]);

        $lamaHari = max(1, (int) Carbon::parse($validated['tanggal_berangkat'])->diffInDays(Carbon::parse($validated['tanggal_kembali'])) + 1);
        $allPegawai = SppdPegawai::all()->keyBy('id');

        DB::transaction(function () use ($validated, $sppdLuarKota, $lamaHari, $allPegawai): void {
            $sppdLuarKota->update([
                'pengirim_surat' => trim($validated['pengirim_surat']),
                'nomor_surat' => ! empty($validated['nomor_surat']) ? trim($validated['nomor_surat']) : null,
                'tanggal_surat' => $validated['tanggal_surat'],
                'tanggal_spt' => $validated['tanggal_spt'],
                'tanggal_berangkat' => $validated['tanggal_berangkat'],
                'tanggal_kembali' => $validated['tanggal_kembali'],
                'lama_hari' => $lamaHari,
                'tujuan' => trim($validated['tujuan']),
                'alamat_lengkap' => trim($validated['alamat_lengkap']),
                'kab_kota' => trim($validated['kab_kota']),
                'perihal' => trim($validated['perihal']),
                'kepala_dinas_id' => $validated['kepala_dinas_id'] ?? $sppdLuarKota->kepala_dinas_id,
                'pptk_id' => $validated['pptk_id'] ?? $sppdLuarKota->pptk_id,
                'bendahara_id' => $validated['bendahara_id'] ?? $sppdLuarKota->bendahara_id,
            ]);

            $sppdLuarKota->participants()->delete();

            $totalHarian = 0.0;
            $totalTransport = 0.0;
            $urutan = 1;

            foreach ($validated['participants'] as $ptData) {
                /** @var SppdPegawai|null $pegawai */
                $pegawai = $allPegawai->get((int) $ptData['pegawai_id']);
                if (! $pegawai) {
                    continue;
                }

                $uh = (float) $ptData['uang_harian'];
                $ut = (float) $ptData['uang_transport'];
                $sub = $uh + $ut;

                SppdLuarKotaParticipant::create([
                    'sppd_luar_kota_id' => $sppdLuarKota->id,
                    'pegawai_id' => $pegawai->id,
                    'urutan' => $urutan++,
                    'nama' => $pegawai->nama,
                    'nip' => $pegawai->nip,
                    'pangkat' => $pegawai->pangkat,
                    'golongan' => $pegawai->golongan,
                    'jabatan' => $pegawai->jabatan,
                    'uang_harian' => $uh,
                    'uang_transport' => $ut,
                    'total_biaya' => $sub,
                ]);

                $totalHarian += $uh;
                $totalTransport += $ut;
            }

            $sppdLuarKota->update([
                'total_uang_harian' => $totalHarian,
                'total_uang_transport' => $totalTransport,
                'total_biaya' => $totalHarian + $totalTransport,
            ]);
        });

        return back()->with('success', 'Data SPPD Luar Kota berhasil diperbarui.');
    }

    public function destroy(SppdLuarKota $sppdLuarKota): RedirectResponse
    {
        $sppdLuarKota->delete();

        return back()->with('success', 'Item SPPD Luar Kota berhasil dihapus.');
    }

    public function destroyBatch(string $batchCode): RedirectResponse
    {
        SppdLuarKota::where('batch_code', $batchCode)->delete();

        return back()->with('success', "Batch SPPD Luar Kota '{$batchCode}' berhasil dihapus.");
    }

    /**
     * Susun data SPT untuk 1 atau beberapa SPPD Luar Kota.
     *
     * @param  Collection<int, SppdLuarKota>  $records
     * @return array<int, array<string, mixed>>
     */
    private static function buildSptList(Collection $records): array
    {
        $defaultKadin = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->first();

        return $records->map(function (SppdLuarKota $sppd) use ($defaultKadin): array {
            $kadin = $sppd->kepalaDinas ?? $defaultKadin;
            $kadinJabatanRaw = trim((string) ($kadin?->jabatan ?? ''));
            $isPlt = str_starts_with(strtolower($kadinJabatanRaw), 'plt');

            $kadinPangkat = trim((string) ($kadin?->pangkat ?? 'Pembina Utama Muda'));
            $kadinGol = trim((string) ($kadin?->golongan ?? ''));
            $kadinPangkatGol = $kadinPangkat !== '' && $kadinGol !== ''
                ? $kadinPangkat.' - '.$kadinGol
                : ($kadinPangkat ?: $kadinGol);

            $kadinNipFormatted = self::formatNipSpaced($kadin?->nip);

            // Dasar: Jika Tanpa Surat -> gunakan langsung teks dasar regulasi (1. UU No 18/2012; 2. PP No 17/2015).
            // Jika Dengan Surat -> Surat dari {pengirim_surat} tanggal {tanggal_surat_indo} nomor: {nomor_surat}, perihal: {perihal}.
            $pengirim = trim((string) $sppd->pengirim_surat);
            $tglSuratIndo = self::formatIndoDate($sppd->tanggal_surat);
            $nomorSurat = trim((string) ($sppd->nomor_surat ?? ''));
            $perihalClean = rtrim(trim((string) $sppd->perihal), '.');

            $isTanpaSurat = self::isTanpaSuratText($pengirim);

            if ($isTanpaSurat) {
                $dasarText = $pengirim;
                $dasarItems = self::parseNumberedDasarItems($pengirim);
            } else {
                $dasarText = "Surat dari {$pengirim} tanggal {$tglSuratIndo}";
                if ($nomorSurat !== '') {
                    $dasarText .= " nomor: {$nomorSurat}";
                }
                $dasarText .= ", perihal: {$perihalClean}.";
                $dasarItems = [];
            }

            // Untuk Poin 1:
            // Jika Tanpa Surat -> Hilangkan tulisan "Menghadiri", langsung tujuannya/perihalnya apa.
            // Jika Dengan Surat -> Menghadiri {perihal}. (jangan gandakan jika sudah diawali kata kerja)
            if ($isTanpaSurat) {
                $cleanedPerihal = preg_replace('/^menghadiri\s+/iu', '', $perihalClean);
                $untukPoin1 = ucfirst(trim((string) $cleanedPerihal)).'.';
            } else {
                $lowerPerihal = strtolower($perihalClean);
                if (
                    str_starts_with($lowerPerihal, 'menghadiri ') ||
                    str_starts_with($lowerPerihal, 'melaksanakan ') ||
                    str_starts_with($lowerPerihal, 'mengikuti ') ||
                    str_starts_with($lowerPerihal, 'melakukan ')
                ) {
                    $untukPoin1 = ucfirst($perihalClean).'.';
                } else {
                    $untukPoin1 = 'Menghadiri '.$perihalClean.'.';
                }
            }

            // Untuk Poin 2: jadwal & tempat
            $berangkat = Carbon::parse($sppd->tanggal_berangkat);
            $kembali = Carbon::parse($sppd->tanggal_kembali);
            $hariBerangkat = self::formatIndoDayName($berangkat);
            $tglBerangkatIndo = self::formatIndoDate($berangkat);

            $tujuanClean = rtrim(trim((string) $sppd->tujuan), ',. ');
            $alamatClean = rtrim(trim((string) $sppd->alamat_lengkap), ',. ');
            $kabKotaClean = rtrim(trim((string) ($sppd->kab_kota ?? '')), ',. ');

            $tempatParts = array_values(array_filter(
                [$tujuanClean, $alamatClean],
                fn (string $p) => $p !== ''
            ));
            if (
                $kabKotaClean !== '' &&
                stripos($tujuanClean, $kabKotaClean) === false &&
                stripos($alamatClean, $kabKotaClean) === false
            ) {
                $tempatParts[] = $kabKotaClean;
            }
            $tempatLengkap = implode(', ', $tempatParts);

            if ($berangkat->isSameDay($kembali)) {
                $untukPoin2 = "Kegiatan dilaksanakan pada hari {$hariBerangkat}, tanggal {$tglBerangkatIndo}, bertempat di {$tempatLengkap}.";
            } else {
                $hariKembali = self::formatIndoDayName($kembali);
                $tglKembaliIndo = self::formatIndoDate($kembali);
                $untukPoin2 = "Kegiatan dilaksanakan pada hari {$hariBerangkat} s.d. {$hariKembali}, tanggal {$tglBerangkatIndo} s.d. {$tglKembaliIndo}, bertempat di {$tempatLengkap}.";
            }

            // Tanggal SPT: gunakan inputan tanggal_spt jika ada, fallback ke H-1 tanggal berangkat
            if ($sppd->tanggal_spt) {
                $tglSptCarbon = Carbon::parse($sppd->tanggal_spt);
            } else {
                $tglSuratCarbon = Carbon::parse($sppd->tanggal_surat);
                $tglSptCarbon = $berangkat->gt($tglSuratCarbon)
                    ? $berangkat->copy()->subDay()
                    : $berangkat->copy();
            }

            $participants = $sppd->participants
                ->sortBy('urutan')
                ->map(function (SppdLuarKotaParticipant $pt): array {
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

            return [
                'nomor_spt_html' => '800.1.11.1/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/KDP',
                'dasar_text' => $dasarText,
                'dasar_items' => $dasarItems,
                'untuk_poin_1' => $untukPoin1,
                'untuk_poin_2' => $untukPoin2,
                'tanggal_spt_indo' => self::formatIndoDate($tglSptCarbon),
                'participants' => $participants,
                'kadin_prefix' => $isPlt ? 'Plt.' : '',
                'kadin_nama' => $kadin?->nama ?? 'RORY FIRMANSYAH, S.STP., M.Si',
                'kadin_pangkat_gol' => $kadinPangkatGol,
                'kadin_nip' => $kadinNipFormatted,
            ];
        })->values()->all();
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

    /**
     * Download PDF SPT (Surat Tugas) untuk seluruh SPPD Luar Kota dalam 1 Batch.
     */
    public function downloadBatchSptPdf(string $batchCode): SymfonyResponse
    {
        $records = SppdLuarKota::with(['participants', 'kepalaDinas'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD Luar Kota tidak ditemukan.');
        }

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        $pdf = Pdf::loadView('pdf.spt-luar-kota', [
            'docTitle' => $batchCode,
            'logoBase64' => self::getLogoBase64(),
            'sppdList' => self::buildSptList($records),
        ])->setPaper('a4', 'portrait');

        return $pdf->download("SPT_Luar_Kota_{$safeBatch}.pdf");
    }

    /**
     * Download PDF SPT (Surat Tugas) untuk 1 item SPPD Luar Kota.
     */
    public function downloadItemSptPdf(SppdLuarKota $sppdLuarKota): SymfonyResponse
    {
        $sppdLuarKota->load(['participants', 'kepalaDinas']);

        $safeTujuan = preg_replace('/[^A-Za-z0-9\-_]/', '_', $sppdLuarKota->tujuan);
        $safeTujuan = Str::limit($safeTujuan ?: (string) $sppdLuarKota->id, 40, '');

        $pdf = Pdf::loadView('pdf.spt-luar-kota', [
            'docTitle' => $sppdLuarKota->batch_code.' - '.$sppdLuarKota->tujuan,
            'logoBase64' => self::getLogoBase64(),
            'sppdList' => self::buildSptList(collect([$sppdLuarKota])),
        ])->setPaper('a4', 'portrait');

        return $pdf->download("SPT_Luar_Kota_{$safeTujuan}.pdf");
    }

    /**
     * Download PDF SPTJB (Surat Pernyataan Tanggung Jawab Belanja) untuk 1 Batch SPPD Luar Kota.
     */
    public function downloadBatchSptjbPdf(string $batchCode): SymfonyResponse
    {
        $records = SppdLuarKota::with(['subKegiatan', 'dpa', 'kepalaDinas', 'pptk'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD Luar Kota tidak ditemukan.');
        }

        /** @var SppdLuarKota $first */
        $first = $records->first();
        /** @var SppdLuarKota $last */
        $last = $records->last();

        $defaultKadin = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->first();
        $defaultSub = SppdSubKegiatan::where('is_active', true)->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();

        $kadin = $first->kepalaDinas ?? $defaultKadin;
        $sk = $first->subKegiatan ?? $defaultSub;
        $dpa = $first->dpa ?? $defaultDpa;

        $totalBiaya = (float) $records->sum('total_biaya');
        $totalFormatted = number_format($totalBiaya, 0, ',', '.');
        $terbilangText = SppdDalamKotaController::formatTerbilangRupiah($totalBiaya);

        $tglDpaStr = $dpa?->tanggal_dpa
            ? self::formatIndoDate($dpa->tanggal_dpa)
            : self::formatIndoDate($first->tanggal_spt ?? $first->tanggal_berangkat);
        $nomorDpaStr = $dpa?->nomor_dpa ?: 'DPA/A.1/2.09.3.27.0.00.10.0000/001/'.date('Y');
        $tanggalDanNomorDpa = "{$tglDpaStr}, {$nomorDpaStr}";

        $namaKegiatan = $sk?->nama_kegiatan ?: 'Penyusunan Peta Kerentanan dan Ketahanan Pangan Kecamatan';
        $namaSubKegiatan = $sk?->sub_kegiatan ?: 'Penyusunan, Pemutakhiran dan Analisis Peta Ketahanan dan Kerentanan Pangan';
        $kodeSubKegiatan = trim((string) ($sk?->kode_sub_kegiatan ?: '2.09.04.2.01'));
        $kodeParts = explode('.', $kodeSubKegiatan);
        $kodeKegiatan = count($kodeParts) > 5
            ? implode('.', array_slice($kodeParts, 0, 5))
            : $kodeSubKegiatan;
        $noRekening = '5.1.02.04.01.0001';
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $bulanIndo = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];
        $refDate = Carbon::parse($last->tanggal_berangkat);
        $bulanTahun = ($bulanIndo[$refDate->month] ?? $refDate->format('F')).' '.$refDate->year;

        $kpaNama = $kadin?->nama ?? '-';
        $kpaNip = self::formatNipSpaced($kadin?->nip);

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        $pdf = Pdf::loadView('pdf.sptjb-luar-kota', [
            'batchCode' => $batchCode,
            'logoBase64' => self::getLogoBase64(),
            'tanggalDanNomorDpa' => $tanggalDanNomorDpa,
            'namaKegiatan' => $namaKegiatan,
            'namaSubKegiatan' => $namaSubKegiatan,
            'kodeKegiatan' => $kodeKegiatan,
            'noRekening' => $noRekening,
            'totalFormatted' => $totalFormatted,
            'terbilangText' => $terbilangText,
            'tahunAnggaran' => $tahunAnggaran,
            'bulanTahun' => $bulanTahun,
            'kpaNama' => $kpaNama,
            'kpaNip' => $kpaNip,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("SPTJB_Luar_Kota_{$safeBatch}.pdf");
    }

    /**
     * Download PDF Laporan C2 (Perincian Pengeluaran Menurut Tanda Bukti Terlampir) untuk 1 Batch SPPD Luar Kota.
     */
    public function downloadBatchC2Pdf(string $batchCode): SymfonyResponse
    {
        $records = SppdLuarKota::with(['subKegiatan', 'dpa', 'participants', 'pptk'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD Luar Kota tidak ditemukan.');
        }

        /** @var SppdLuarKota $first */
        $first = $records->first();

        $defaultPptk = SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_PPTK)->first();
        $defaultSub = SppdSubKegiatan::where('is_active', true)->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();

        $pptk = $first->pptk ?? $defaultPptk;
        $sk = $first->subKegiatan ?? $defaultSub;
        $dpa = $first->dpa ?? $defaultDpa;

        $totalHarian = (float) $records->sum('total_uang_harian');
        $totalTransport = (float) $records->sum('total_uang_transport');
        $totalBiaya = (float) $records->sum('total_biaya');

        $totalHarianFormatted = number_format($totalHarian, 0, ',', '.');
        $totalTransportFormatted = $totalTransport > 0 ? number_format($totalTransport, 0, ',', '.') : '-';
        $totalBiayaFormatted = number_format($totalBiaya, 0, ',', '.');
        $terbilangText = SppdDalamKotaController::formatTerbilangRupiah($totalBiaya);

        $tglDpaStr = $dpa?->tanggal_dpa
            ? self::formatIndoDate($dpa->tanggal_dpa)
            : '2 Januari '.($dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y'));
        $rawNomorDpa = trim((string) ($dpa?->nomor_dpa ?: 'DPA/A.1/2.09.3.27.0.00.10.0000/001/'.date('Y')));
        if (! str_starts_with(strtoupper($rawNomorDpa), 'DPA/') && ! str_starts_with(strtoupper($rawNomorDpa), 'DPPA/')) {
            $rawNomorDpa = 'DPA/'.$rawNomorDpa;
        }
        $nomorDpaDisplay = "{$tglDpaStr}/{$rawNomorDpa}";

        $namaKegiatan = $sk?->nama_kegiatan ?: 'Penyusunan Peta Kerentanan dan Ketahanan Pangan Kecamatan';
        $namaSubKegiatan = $sk?->sub_kegiatan ?: 'Penyusunan, Pemutakhiran dan Analisis Peta Ketahanan dan Kerentanan Pangan';
        $noRekening = '5.1.02.04.01.0001';
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $rows = [];
        $rowNo = 1;

        foreach ($records as $sppd) {
            $tglIndo = self::formatIndoDateRange($sppd->tanggal_berangkat, $sppd->tanggal_kembali);

            // Kolom tujuan diisi sesuai field kab_kota (fallback ke tujuan jika data lama belum memiliki kab_kota)
            $rawKabKota = trim((string) ($sppd->kab_kota ?? ''));
            $tujuanShort = $rawKabKota !== '' ? $rawKabKota : trim((string) $sppd->tujuan);

            $sppdTransportSum = 0.0;

            foreach ($sppd->participants as $pt) {
                $uh = (float) $pt->uang_harian;
                $ut = (float) $pt->uang_transport;
                $sppdTransportSum += $ut;

                $pangkat = trim((string) $pt->pangkat);
                $golongan = trim((string) $pt->golongan);
                $pangkatGolDash = $pangkat !== '' && $golongan !== ''
                    ? "{$pangkat} - {$golongan}"
                    : ($pangkat !== '' ? $pangkat : ($golongan !== '' ? $golongan : '-'));

                $rows[] = [
                    'type' => 'participant',
                    'no' => $rowNo,
                    'is_first' => count($rows) === 0,
                    'nama' => strtoupper($pt->nama),
                    'nip' => self::formatNipSpaced($pt->nip),
                    'pangkat_gol' => $pangkatGolDash,
                    'tanggal' => $tglIndo,
                    'tujuan' => $tujuanShort,
                    'uang_harian_formatted' => number_format($uh, 0, ',', '.'),
                ];
                $rowNo++;
            }

            if ($sppdTransportSum > 0) {
                $rows[] = [
                    'type' => 'transport',
                    'no' => $rowNo,
                    'tanggal' => $tglIndo,
                    'tujuan' => $tujuanShort,
                    'uang_transport_formatted' => number_format($sppdTransportSum, 0, ',', '.'),
                ];
                $rowNo++;
            }
        }

        $pptkNama = strtoupper($pptk?->nama ?? 'DEDEH SUMIATI, S.IP');
        $pptkNip = self::formatNipSpaced($pptk?->nip ?? '197009192007012009');

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        $pdf = Pdf::loadView('pdf.c2-luar-kota', [
            'batchCode' => $batchCode,
            'namaKegiatan' => $namaKegiatan,
            'namaSubKegiatan' => $namaSubKegiatan,
            'tahunAnggaran' => $tahunAnggaran,
            'noRekening' => $noRekening,
            'nomorDpaDisplay' => $nomorDpaDisplay,
            'totalHarianFormatted' => $totalHarianFormatted,
            'totalTransportFormatted' => $totalTransportFormatted,
            'totalBiayaFormatted' => $totalBiayaFormatted,
            'terbilangText' => $terbilangText,
            'rows' => $rows,
            'pptkNama' => $pptkNama,
            'pptkNip' => $pptkNip,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("C2_Luar_Kota_{$safeBatch}.pdf");
    }

    /**
     * Format label golongan untuk Rincian Biaya Perjalanan Dinas Luar Kota:
     * 1. Ese III/Gol IV
     * 2. Ese IV/Gol III
     * 3. Gol II/I/PPPK
     *
     * @return array{priority: int, label: string}
     */
    private static function resolveRincianGolonganGroup(?string $golongan, ?string $pangkat = null): array
    {
        $golNorm = SppdPegawai::normalizeGolonganGroup($golongan);

        if ($golNorm === 'Golongan IV') {
            return ['priority' => 1, 'label' => 'Ese III/Gol IV'];
        }

        if ($golNorm === 'Golongan III') {
            return ['priority' => 2, 'label' => 'Ese IV/Gol III'];
        }

        return ['priority' => 3, 'label' => 'Gol II/I/PPPK'];
    }

    /**
     * Download PDF Rincian Biaya Perjalanan Dinas untuk 1 Batch SPPD Luar Kota (1 halaman per SPPD).
     */
    public function downloadBatchRincianPdf(string $batchCode): SymfonyResponse
    {
        $records = SppdLuarKota::with(['participants', 'bendahara'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD Luar Kota tidak ditemukan.');
        }

        $defaultBendahara = SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)->first();

        $sppdList = $records->map(function (SppdLuarKota $sppd) use ($defaultBendahara): array {
            $bendahara = $sppd->bendahara ?? $defaultBendahara;
            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            /** @var SppdLuarKotaParticipant|null $firstParticipant */
            $firstParticipant = $sortedParticipants->first();

            $lamaHari = max(1, (int) ($sppd->lama_hari ?: 1));
            $grouped = [];
            $calculatedTotalHarian = 0.0;

            foreach ($sortedParticipants as $pt) {
                $golInfo = self::resolveRincianGolonganGroup($pt->golongan, $pt->pangkat);
                $priority = $golInfo['priority'];
                $label = $golInfo['label'];

                // uang_harian pada petugas adalah tarif uang harian per hari (misal 430000 ke Bandung)
                $dailyRate = (float) $pt->uang_harian;
                $participantSubtotal = $lamaHari * $dailyRate;
                $calculatedTotalHarian += $participantSubtotal;

                $key = $priority.'|'.$label.'|'.$dailyRate;

                if (! isset($grouped[$key])) {
                    $grouped[$key] = [
                        'priority' => $priority,
                        'label' => $label,
                        'count' => 0,
                        'rate' => $dailyRate,
                        'subtotal' => 0.0,
                    ];
                }

                $grouped[$key]['count']++;
                $grouped[$key]['subtotal'] += $participantSubtotal;
            }

            usort($grouped, fn (array $a, array $b) => $a['priority'] <=> $b['priority']);

            $groupsFormatted = array_map(fn (array $g): array => [
                'label' => $g['label'],
                'count' => $g['count'],
                'rate_formatted' => number_format($g['rate'], 0, ',', '.'),
                'subtotal_formatted' => number_format($g['subtotal'], 0, ',', '.'),
            ], $grouped);

            $rawKabKota = trim((string) ($sppd->kab_kota ?? ''));
            $tujuanKabKota = $rawKabKota !== '' ? $rawKabKota : trim((string) $sppd->tujuan);

            $totalTransport = (float) $sppd->total_uang_transport;
            $totalBiaya = $calculatedTotalHarian + $totalTransport;

            return [
                'nomor_spd' => '',
                'tanggal_kembali_indo' => self::formatIndoDate($sppd->tanggal_kembali ?? $sppd->tanggal_berangkat),
                'tujuan_kab_kota' => $tujuanKabKota,
                'lama_hari' => $lamaHari,
                'groups' => $groupsFormatted,
                'total_transport_formatted' => $totalTransport > 0 ? number_format($totalTransport, 0, ',', '.') : '-',
                'total_biaya_formatted' => number_format($totalBiaya, 0, ',', '.'),
                'terbilang_text' => SppdDalamKotaController::formatTerbilangRupiah($totalBiaya),
                'bendahara_nama' => strtoupper($bendahara?->nama ?? 'UFI NAJARUDIN LUTFI'),
                'bendahara_nip' => self::formatNipSpaced($bendahara?->nip ?? '197401092009011003'),
                'penerima_nama' => strtoupper($firstParticipant?->nama ?? '-'),
                'penerima_nip' => self::formatNipSpaced($firstParticipant?->nip ?? ''),
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        $pdf = Pdf::loadView('pdf.rincian-luar-kota', [
            'batchCode' => $batchCode,
            'logoBase64' => self::getLogoBase64(),
            'sppdList' => $sppdList,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Rincian_Luar_Kota_{$safeBatch}.pdf");
    }

    /**
     * Ubah angka lama hari (1..30) menjadi teks huruf kecil (contoh: 1 -> "satu", 2 -> "dua").
     */
    private static function formatHariTerbilang(int $hari): string
    {
        $map = [
            1 => 'satu',
            2 => 'dua',
            3 => 'tiga',
            4 => 'empat',
            5 => 'lima',
            6 => 'enam',
            7 => 'tujuh',
            8 => 'delapan',
            9 => 'sembilan',
            10 => 'sepuluh',
            11 => 'sebelas',
            12 => 'dua belas',
            13 => 'tiga belas',
            14 => 'empat belas',
            15 => 'lima belas',
        ];

        return $map[$hari] ?? (string) $hari;
    }

    /**
     * Download PDF Kwitansi (Tanda Terima Uang Harian Perjalanan Dinas Biasa) untuk 1 Batch SPPD Luar Kota.
     */
    public function downloadBatchKwitansiPdf(string $batchCode): SymfonyResponse
    {
        $records = SppdLuarKota::with(['subKegiatan', 'dpa', 'participants', 'kepalaDinas', 'pptk', 'bendahara'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD Luar Kota tidak ditemukan.');
        }

        /** @var SppdLuarKota $first */
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

        $sk = $first->subKegiatan ?? $defaultSub;

        $kodeSubKegiatan = $sk?->kode_sub_kegiatan ?: '2.09.04.2.01.0001';
        $noRekening = '5.1.02.04.01.0001';
        $namaSubKegiatan = $sk?->sub_kegiatan
            ?: 'Penyusunan, Pemutakhiran dan Analisis Peta Ketahanan dan Kerentanan Pangan';

        $sppdList = $records->map(function (SppdLuarKota $sppd) use ($defaultKadin, $defaultPptk, $defaultBendahara): array {
            $kadin = $sppd->kepalaDinas ?? $defaultKadin;
            $pptk = $sppd->pptk ?? $defaultPptk;
            $bendahara = $sppd->bendahara ?? $defaultBendahara;

            $lamaHari = max(1, (int) ($sppd->lama_hari ?: 1));

            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            $totalUangHarian = 0.0;

            $participants = $sortedParticipants->map(function (SppdLuarKotaParticipant $pt) use ($lamaHari, &$totalUangHarian): array {
                $dailyRate = (float) $pt->uang_harian;
                $ptTotalHarian = $lamaHari * $dailyRate;
                $totalUangHarian += $ptTotalHarian;

                $jabatanText = trim((string) $pt->jabatan);
                if ($jabatanText !== '' && ! str_contains(strtolower($jabatanText), 'dkpp')) {
                    $jabatanText .= ' Pada DKPP Kab. Indramayu';
                }

                return [
                    'nama' => strtoupper($pt->nama),
                    'nip' => self::formatNipSpaced($pt->nip),
                    'pangkat_gol' => self::formatPangkatGolSlash($pt->pangkat, $pt->golongan),
                    'jabatan' => $jabatanText ?: 'Pelaksana Pada DKPP Kab. Indramayu',
                    'uang_harian_formatted' => number_format($ptTotalHarian, 0, ',', '.'),
                ];
            })->values()->all();

            $rawKabKota = trim((string) ($sppd->kab_kota ?? ''));
            $tujuanKabKota = $rawKabKota !== '' ? $rawKabKota : trim((string) $sppd->tujuan);

            // Uraian kegiatan di bawah Sesuai dengan SPD No:
            $pengirim = trim((string) $sppd->pengirim_surat);
            $perihalClean = rtrim(trim((string) $sppd->perihal), '.');
            $isTanpaSurat = self::isTanpaSuratText($pengirim);

            if ($isTanpaSurat) {
                $cleanedPerihal = preg_replace('/^menghadiri\s+/iu', '', $perihalClean);
                $uraianBase = ucfirst(trim((string) $cleanedPerihal));
            } else {
                $lowerPerihal = strtolower($perihalClean);
                if (
                    str_starts_with($lowerPerihal, 'menghadiri ') ||
                    str_starts_with($lowerPerihal, 'melaksanakan ') ||
                    str_starts_with($lowerPerihal, 'mengikuti ') ||
                    str_starts_with($lowerPerihal, 'melakukan ')
                ) {
                    $uraianBase = ucfirst($perihalClean);
                } else {
                    $uraianBase = 'Menghadiri '.$perihalClean;
                }
            }

            if ($tujuanKabKota !== '' && stripos($uraianBase, 'di '.$tujuanKabKota) === false) {
                $uraianKegiatan = $uraianBase.' di '.$tujuanKabKota;
            } else {
                $uraianKegiatan = $uraianBase;
            }

            return [
                'lama_hari' => $lamaHari,
                'lama_hari_terbilang' => self::formatHariTerbilang($lamaHari),
                'tujuan_kab_kota' => $tujuanKabKota,
                'tanggal_kembali_indo' => self::formatIndoDate($sppd->tanggal_kembali ?? $sppd->tanggal_berangkat),
                'uraian_kegiatan' => $uraianKegiatan,
                'total_formatted' => number_format($totalUangHarian, 0, ',', '.'),
                'terbilang_text' => SppdDalamKotaController::formatTerbilangRupiah($totalUangHarian),
                'participants' => $participants,
                'kadin_nama' => strtoupper($kadin?->nama ?? 'RORY FIRMANSYAH, S.STP., M.Si'),
                'kadin_nip' => self::formatNipSpaced($kadin?->nip ?? '197801011997031003'),
                'pptk_nama' => strtoupper($pptk?->nama ?? 'DEDEH SUMIATI, S.IP'),
                'pptk_nip' => self::formatNipSpaced($pptk?->nip ?? '197009192007012009'),
                'bendahara_nama' => strtoupper($bendahara?->nama ?? 'UFI NAJARUDIN LUTFI'),
                'bendahara_nip' => self::formatNipSpaced($bendahara?->nip ?? '197401092009011003'),
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        $pdf = Pdf::loadView('pdf.kwitansi-luar-kota', [
            'batchCode' => $batchCode,
            'kodeSubKegiatan' => $kodeSubKegiatan,
            'noRekening' => $noRekening,
            'namaSubKegiatan' => $namaSubKegiatan,
            'sppdList' => $sppdList,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Kwitansi_Luar_Kota_{$safeBatch}.pdf");
    }

    /**
     * Download PDF Kwitansi 2 untuk 1 Batch SPPD Luar Kota (1 halaman per SPPD).
     */
    public function downloadBatchKwitansi2Pdf(string $batchCode): SymfonyResponse
    {
        $records = SppdLuarKota::with(['subKegiatan', 'dpa', 'participants', 'kepalaDinas', 'bendahara'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD Luar Kota tidak ditemukan.');
        }

        /** @var SppdLuarKota $first */
        $first = $records->first();
        $defaultKadin = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->first();
        $defaultBendahara = SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_BENDAHARA)->first();
        $defaultDpa = SppdDpa::where('is_active', true)->orderByDesc('id')->first();

        $dpa = $first->dpa ?? $defaultDpa;
        $tahunAnggaran = $dpa?->tahun_anggaran ?: Carbon::parse($first->tanggal_berangkat)->format('Y');

        $sppdList = $records->map(function (SppdLuarKota $sppd) use ($defaultKadin, $defaultBendahara): array {
            $kadin = $sppd->kepalaDinas ?? $defaultKadin;
            $bendahara = $sppd->bendahara ?? $defaultBendahara;

            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            /** @var SppdLuarKotaParticipant|null $firstParticipant */
            $firstParticipant = $sortedParticipants->first();

            $lamaHari = max(1, (int) ($sppd->lama_hari ?: 1));
            $totalHarian = 0.0;
            foreach ($sortedParticipants as $pt) {
                $totalHarian += $lamaHari * (float) $pt->uang_harian;
            }

            $totalTransport = (float) $sppd->total_uang_transport;
            $totalBiaya = $totalHarian + $totalTransport;

            $rawKabKota = trim((string) ($sppd->kab_kota ?? ''));
            $tujuanKabKota = $rawKabKota !== '' ? $rawKabKota : trim((string) $sppd->tujuan);

            $pengirim = trim((string) $sppd->pengirim_surat);
            $perihalClean = rtrim(trim((string) $sppd->perihal), '.');
            $isTanpaSurat = self::isTanpaSuratText($pengirim);

            if ($isTanpaSurat) {
                $cleanedPerihal = preg_replace('/^menghadiri\s+/iu', '', $perihalClean);
                $uraianBase = trim((string) $cleanedPerihal);
            } else {
                $lowerPerihal = strtolower($perihalClean);
                if (
                    str_starts_with($lowerPerihal, 'menghadiri ') ||
                    str_starts_with($lowerPerihal, 'melaksanakan ') ||
                    str_starts_with($lowerPerihal, 'mengikuti ') ||
                    str_starts_with($lowerPerihal, 'melakukan ')
                ) {
                    $uraianBase = lcfirst($perihalClean);
                } else {
                    $uraianBase = 'menghadiri '.$perihalClean;
                }
            }

            if ($tujuanKabKota !== '' && stripos($uraianBase, 'di '.$tujuanKabKota) === false) {
                $untukUraian = $uraianBase.' di '.$tujuanKabKota;
            } else {
                $untukUraian = $uraianBase;
            }

            $terbilangTitle = ucwords(strtolower(SppdDalamKotaController::formatTerbilangRupiah($totalBiaya)));

            return [
                'tanggal_kembali_indo' => self::formatIndoDate($sppd->tanggal_kembali ?? $sppd->tanggal_berangkat),
                'untuk_uraian' => $untukUraian,
                'total_harian_formatted' => number_format($totalHarian, 0, ',', '.'),
                'has_transport' => $totalTransport > 0,
                'total_transport_formatted' => $totalTransport > 0 ? number_format($totalTransport, 0, ',', '.') : '-',
                'total_biaya_formatted' => number_format($totalBiaya, 0, ',', '.'),
                'terbilang_title' => $terbilangTitle,
                'penerima_nama' => strtoupper($firstParticipant?->nama ?? '-'),
                'penerima_nip' => self::formatNipSpaced($firstParticipant?->nip ?? ''),
                'kadin_nama' => strtoupper($kadin?->nama ?? 'RORY FIRMANSYAH, S.STP., M.Si'),
                'kadin_nip' => self::formatNipSpaced($kadin?->nip ?? '197801011997031003'),
                'bendahara_nama' => strtoupper($bendahara?->nama ?? 'UFI NAJARUDIN LUTFI'),
                'bendahara_nip' => self::formatNipSpaced($bendahara?->nip ?? '197401092009011003'),
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        $pdf = Pdf::loadView('pdf.kwitansi2-luar-kota', [
            'batchCode' => $batchCode,
            'logoBase64' => self::getLogoBase64(),
            'tahunAnggaran' => $tahunAnggaran,
            'sppdList' => $sppdList,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Kwitansi_2_Luar_Kota_{$safeBatch}.pdf");
    }

    /**
     * Download PDF SPPD (Surat Perjalanan Dinas / SPD) untuk 1 Batch SPPD Luar Kota (1 halaman per SPPD).
     */
    public function downloadBatchSppdPdf(Request $request, string $batchCode): SymfonyResponse
    {
        $records = SppdLuarKota::with(['subKegiatan', 'dpa', 'participants.pegawai', 'kepalaDinas'])
            ->where('batch_code', $batchCode)
            ->orderBy('tanggal_berangkat')
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            abort(404, 'Data Batch SPPD Luar Kota tidak ditemukan.');
        }

        $allowedAlatAngkut = [
            'Kendaraan Umum',
            'Kendaraan Dinas Ketahanan Pangan dan Pertanian',
        ];
        $requestedAlatAngkut = trim((string) $request->query('alat_angkut', 'Kendaraan Umum'));
        $alatAngkut = in_array($requestedAlatAngkut, $allowedAlatAngkut, true)
            ? $requestedAlatAngkut
            : 'Kendaraan Umum';

        $defaultKadin = SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)
            ->where('is_active', true)
            ->first() ?? SppdPejabat::where('tipe', SppdPejabat::TIPE_KEPALA_DINAS)->first();

        $sppdList = $records->map(function (SppdLuarKota $sppd) use ($defaultKadin): array {
            $kadin = $sppd->kepalaDinas ?? $defaultKadin;

            $sortedParticipants = $sppd->participants->sortBy([
                ['urutan', 'asc'],
                ['id', 'asc'],
            ])->values();

            /** @var SppdLuarKotaParticipant|null $leader */
            $leader = $sortedParticipants->first();

            // Jika pegawai pertama jabatannya mengandung kata "Kepala Bidang" -> Tingkat C, selain itu -> Tingkat D
            $isLeaderKepalaBidang = stripos((string) ($leader?->jabatan ?? ''), 'kepala bidang') !== false;
            $tingkatBiaya = $isLeaderKepalaBidang ? 'Tingkat C' : 'Tingkat D';

            $leaderPangkat = trim((string) ($leader?->pangkat ?? ''));
            $leaderGol = trim((string) ($leader?->golongan ?? ''));
            $leaderPangkatGol = $leaderPangkat !== '' && $leaderGol !== ''
                ? "{$leaderPangkat} - {$leaderGol}"
                : ($leaderPangkat !== '' ? $leaderPangkat : ($leaderGol !== '' ? $leaderGol : '-'));

            $leaderJabatan = trim((string) ($leader?->jabatan ?? ''));
            if ($leaderJabatan !== '' && ! str_contains(strtolower($leaderJabatan), 'dkpp')) {
                $leaderJabatan .= ' Pada DKPP Kab. Indramayu';
            }

            $followers = $sortedParticipants->slice(1)->map(function (SppdLuarKotaParticipant $pt): array {
                $tglLahirRaw = $pt->pegawai?->tanggal_lahir
                    ? Carbon::parse($pt->pegawai->tanggal_lahir)->format('Y-m-d')
                    : SppdPegawai::extractBirthDateFromNip($pt->nip);

                return [
                    'nama' => strtoupper($pt->nama),
                    'tanggal_lahir_indo' => $tglLahirRaw ? self::formatIndoDate($tglLahirRaw) : '-',
                ];
            })->values()->all();

            // Maksud Perjalanan Dinas
            $pengirim = trim((string) $sppd->pengirim_surat);
            $perihalClean = rtrim(trim((string) $sppd->perihal), '.');
            $isTanpaSurat = self::isTanpaSuratText($pengirim);

            if ($isTanpaSurat) {
                $cleanedPerihal = preg_replace('/^menghadiri\s+/iu', '', $perihalClean);
                $maksudPerjalanan = ucfirst(trim((string) $cleanedPerihal));
            } else {
                $lowerPerihal = strtolower($perihalClean);
                if (
                    str_starts_with($lowerPerihal, 'menghadiri ') ||
                    str_starts_with($lowerPerihal, 'melaksanakan ') ||
                    str_starts_with($lowerPerihal, 'mengikuti ') ||
                    str_starts_with($lowerPerihal, 'melakukan ')
                ) {
                    $maksudPerjalanan = ucfirst($perihalClean);
                } else {
                    $maksudPerjalanan = 'Menghadiri '.$perihalClean;
                }
            }

            // Tempat tujuan lengkap: tujuan, alamat_lengkap, kab_kota (tanpa duplikasi)
            $tujuanClean = rtrim(trim((string) $sppd->tujuan), ',. ');
            $alamatClean = rtrim(trim((string) $sppd->alamat_lengkap), ',. ');
            $kabKotaClean = rtrim(trim((string) ($sppd->kab_kota ?? '')), ',. ');

            $tempatParts = array_values(array_filter(
                [$tujuanClean, $alamatClean],
                fn (string $p) => $p !== ''
            ));
            if (
                $kabKotaClean !== '' &&
                stripos($tujuanClean, $kabKotaClean) === false &&
                stripos($alamatClean, $kabKotaClean) === false
            ) {
                $tempatParts[] = $kabKotaClean;
            }
            $tempatTujuanDisplay = implode(', ', $tempatParts);

            $lamaHari = max(1, (int) ($sppd->lama_hari ?: 1));

            $kadinPangkatGol = trim(implode(' - ', array_filter([
                trim((string) ($kadin?->pangkat ?? 'Pembina Utama Muda')),
                trim((string) ($kadin?->golongan ?? 'IV/c')),
            ])));

            return [
                'leader_nama' => strtoupper($leader?->nama ?? '-'),
                'leader_nip' => self::formatNipSpaced($leader?->nip ?? ''),
                'leader_pangkat_gol' => $leaderPangkatGol,
                'leader_jabatan' => $leaderJabatan ?: 'Pelaksana Pada DKPP Kab. Indramayu',
                'tingkat_biaya' => $tingkatBiaya,
                'maksud_perjalanan' => $maksudPerjalanan,
                'tempat_tujuan_display' => $tempatTujuanDisplay,
                'lama_hari' => $lamaHari,
                'lama_hari_terbilang' => self::formatHariTerbilang($lamaHari),
                'tanggal_berangkat_indo' => self::formatIndoDate($sppd->tanggal_berangkat),
                'tanggal_kembali_indo' => self::formatIndoDate($sppd->tanggal_kembali ?? $sppd->tanggal_berangkat),
                'followers' => $followers,
                'kadin_nama' => strtoupper($kadin?->nama ?? 'RORY FIRMANSYAH, S.STP., M.Si'),
                'kadin_pangkat_gol' => $kadinPangkatGol,
                'kadin_nip' => self::formatNipSpaced($kadin?->nip ?? '197801011997031003'),
            ];
        })->values()->all();

        $safeBatch = preg_replace('/[^A-Za-z0-9\-_]/', '_', $batchCode);

        $pdf = Pdf::loadView('pdf.sppd-luar-kota', [
            'batchCode' => $batchCode,
            'logoBase64' => self::getLogoBase64(),
            'alatAngkut' => $alatAngkut,
            'sppdList' => $sppdList,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("SPPD_Luar_Kota_{$safeBatch}.pdf");
    }
}
