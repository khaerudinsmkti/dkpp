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
        $noRekening = $sk?->no_rekening ?: '5.1.02.04.01.0001';
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
}
