<?php

namespace App\Http\Controllers;

use App\Models\Commodity;
use App\Models\ConsumerPrice;
use App\Models\Cppd;
use App\Models\CppdInitialStock;
use App\Models\FoodBalance;
use App\Models\FoodBalanceCommodity;
use App\Models\Fsva;
use App\Models\IkpScore;
use App\Models\Market;
use App\Models\PphFoodGroup;
use App\Models\PphScore;
use App\Models\ProducerCommodity;
use App\Models\ProducerPrice;
use App\Models\Skpg;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Indonesian month names.
     */
    private const INDO_MONTHS = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    /**
     * Build the 8-module summary dataset shared between the public landing page (Beranda)
     * and the administrator executive dashboard.
     *
     * @return array<string, mixed>
     */
    private function buildSummaryData(): array
    {
        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;
        $todayStr = now()->format('Y-m-d');

        // 1. IKP (Indeks Ketahanan Pangan) tahun ini, target renstra, dan tren historis
        $allIkpScores = IkpScore::orderBy('tahun', 'asc')->get();
        $ikpRecord = $allIkpScores->firstWhere('tahun', $currentYear)
            ?? $allIkpScores->last();

        $ikpHistory = $allIkpScores->slice(-5)->values()->map(fn (IkpScore $s) => [
            'tahun' => (int) $s->tahun,
            'nilai_ikp' => (float) $s->nilai_ikp,
            'target_renstra' => (float) $s->target_renstra,
            'status' => $s->category,
        ])->all();

        $ikp = null;
        if ($ikpRecord) {
            $nilai = (float) $ikpRecord->nilai_ikp;
            $target = (float) $ikpRecord->target_renstra;
            $diff = round($nilai - $target, 2);
            $ikp = [
                'tahun' => (int) $ikpRecord->tahun,
                'nilai_ikp' => $nilai,
                'target_renstra' => $target,
                'diff_renstra' => $diff,
                'capaian_percentage' => $target > 0 ? round(($nilai / $target) * 100, 2) : 100,
                'is_achieved' => $nilai >= $target,
                'status' => $ikpRecord->category,
                'indeks_ketersediaan' => $ikpRecord->indeks_ketersediaan !== null ? (float) $ikpRecord->indeks_ketersediaan : null,
                'indeks_keterjangkauan' => $ikpRecord->indeks_keterjangkauan !== null ? (float) $ikpRecord->indeks_keterjangkauan : null,
                'indeks_pemanfaatan' => $ikpRecord->indeks_pemanfaatan !== null ? (float) $ikpRecord->indeks_pemanfaatan : null,
                'kelompok_ikp' => $ikpRecord->kelompok_ikp ?: $ikpRecord->default_kelompok,
                'keterangan' => $ikpRecord->keterangan,
                'total_years' => $allIkpScores->count(),
                'history' => $ikpHistory,
            ];
        }

        // 2. Total Stok CPPD, total penyaluran CPPD tahun ini, dan cakupan wilayah
        $cppdYear = $currentYear;
        $initialStock = CppdInitialStock::where('year', $cppdYear)->first();
        if (! $initialStock && ! Cppd::whereYear('tanggal', $cppdYear)->exists()) {
            $latestCppdDate = Cppd::max('tanggal');
            if ($latestCppdDate) {
                $cppdYear = (int) Carbon::parse($latestCppdDate)->year;
                $initialStock = CppdInitialStock::where('year', $cppdYear)->first();
            }
        }

        $stokAwal = (float) ($initialStock?->amount ?? 0);
        $totalPengadaan = (float) Cppd::whereYear('tanggal', $cppdYear)->where('status', Cppd::STATUS_PENGADAAN)->sum('jumlah');
        $totalPenyaluran = (float) Cppd::whereYear('tanggal', $cppdYear)->where('status', Cppd::STATUS_PENYALURAN)->sum('jumlah');
        $totalAddendum = (float) Cppd::whereYear('tanggal', $cppdYear)->where('status', Cppd::STATUS_ADDENDUM)->sum('jumlah');
        $totalStok = $stokAwal + $totalPengadaan + $totalAddendum - $totalPenyaluran;

        $penyaluranRecords = Cppd::whereYear('tanggal', $cppdYear)
            ->where('status', Cppd::STATUS_PENYALURAN)
            ->orderByDesc('tanggal')
            ->get();

        $desaPenerimaCount = $penyaluranRecords
            ->map(fn ($r) => strtoupper(trim($r->kecamatan)).'___'.strtoupper(trim($r->desa)))
            ->unique()
            ->count();
        $kecamatanPenerimaCount = $penyaluranRecords
            ->map(fn ($r) => strtoupper(trim($r->kecamatan)))
            ->unique()
            ->count();

        $cppd = [
            'tahun' => $cppdYear,
            'total_stok' => $totalStok,
            'total_penyaluran' => $totalPenyaluran,
            'stok_awal' => $stokAwal,
            'total_pengadaan' => $totalPengadaan,
            'total_addendum' => $totalAddendum,
            'desa_penerima_count' => $desaPenerimaCount,
            'kecamatan_penerima_count' => $kecamatanPenerimaCount,
            'transaksi_penyaluran_count' => $penyaluranRecords->count(),
        ];

        // 3. Total Neraca bulan ini (ketersediaan - kebutuhan) & daftar komoditas utama
        $fbYear = $currentYear;
        $fbMonth = $currentMonth;
        $hasCurrentFb = FoodBalance::where('year', $fbYear)->where('month', $fbMonth)->exists();
        if (! $hasCurrentFb) {
            $latestFb = FoodBalance::orderByDesc('year')->orderByDesc('month')->first();
            if ($latestFb) {
                $fbYear = (int) $latestFb->year;
                $fbMonth = (int) $latestFb->month;
            }
        }

        $balances = FoodBalance::with('commodity')
            ->where('year', $fbYear)
            ->where('month', $fbMonth)
            ->get();
        $totalKetersediaan = (float) $balances->sum('ketersediaan');
        $totalKebutuhan = (float) $balances->sum('kebutuhan');
        $totalProduksi = (float) $balances->sum('produksi');
        $totalNeraca = round($totalKetersediaan - $totalKebutuhan, 2);

        $activeFbCommoditiesCount = FoodBalanceCommodity::where('is_active', true)->count();

        $topFbCommodities = $balances
            ->sortBy(fn (FoodBalance $b) => $b->commodity?->order ?? 999)
            ->take(4)
            ->values()
            ->map(function (FoodBalance $b): array {
                $ket = (float) $b->ketersediaan;
                $keb = (float) $b->kebutuhan;
                $prod = (float) $b->produksi;
                $sel = round($ket - $keb, 2);

                return [
                    'id' => $b->id,
                    'name' => $b->commodity?->name ?? 'Komoditas',
                    'unit' => $b->commodity?->unit ?? 'Ton',
                    'produksi' => $prod,
                    'ketersediaan' => $ket,
                    'kebutuhan' => $keb,
                    'selisih' => $sel,
                    'status' => $sel >= 0 ? 'Surplus' : 'Defisit',
                ];
            })
            ->all();

        $foodBalance = [
            'year' => $fbYear,
            'month' => $fbMonth,
            'month_name' => self::INDO_MONTHS[$fbMonth] ?? "Bulan $fbMonth",
            'period_label' => (self::INDO_MONTHS[$fbMonth] ?? "Bulan $fbMonth").' '.$fbYear,
            'is_current_month' => ($fbYear === $currentYear && $fbMonth === $currentMonth),
            'total_ketersediaan' => $totalKetersediaan,
            'total_kebutuhan' => $totalKebutuhan,
            'total_produksi' => $totalProduksi,
            'total_neraca' => $totalNeraca,
            'status' => $totalNeraca >= 0 ? 'Surplus' : 'Defisit',
            'surplus_count' => $balances->filter(fn ($b) => ((float) $b->ketersediaan - (float) $b->kebutuhan) >= 0)->count(),
            'defisit_count' => $balances->filter(fn ($b) => ((float) $b->ketersediaan - (float) $b->kebutuhan) < 0)->count(),
            'commodities_count' => $balances->count() > 0 ? $balances->count() : $activeFbCommoditiesCount,
            'top_commodities' => $topFbCommodities,
        ];

        // 4. Skor PPH Ketersediaan tahun ini dibandingkan dengan target renstra
        $allPphScores = PphScore::orderBy('tahun', 'asc')->get();
        $pphRecord = $allPphScores->firstWhere('tahun', $currentYear)
            ?? $allPphScores->last();
        $totalFoodGroups = PphFoodGroup::where('is_active', true)->count();

        $pphHistory = $allPphScores->slice(-5)->values()->map(fn (PphScore $s) => [
            'tahun' => (int) $s->tahun,
            'skor_pph' => (float) $s->skor_pph,
            'target_renstra' => (float) ($s->target_renstra ?? 94.0),
        ])->all();

        $pph = null;
        if ($pphRecord) {
            $skor = (float) $pphRecord->skor_pph;
            $target = (float) ($pphRecord->target_renstra ?? 94.0);
            $diff = round($skor - $target, 2);
            $pph = [
                'tahun' => (int) $pphRecord->tahun,
                'skor_pph' => $skor,
                'target_renstra' => $target,
                'diff_renstra' => $diff,
                'capaian_percentage' => $target > 0 ? round(($skor / $target) * 100, 2) : 100,
                'is_achieved' => $skor >= $target,
                'keterangan' => $pphRecord->keterangan,
                'total_food_groups' => $totalFoodGroups > 0 ? $totalFoodGroups : 9,
                'total_years' => $allPphScores->count(),
                'history' => $pphHistory,
            ];
        }

        // 5. Persentase desa rentan rawan pangan (prioritas 1-3) dan desa tahan pangan (prioritas 4-6) tahun ini
        $fsvaYear = $currentYear;
        if (! Fsva::where('tahun', $fsvaYear)->exists()) {
            $fsvaYear = (int) (Fsva::max('tahun') ?? $currentYear);
        }

        $fsvaRecords = Fsva::where('tahun', $fsvaYear)->get();
        $totalDesa = $fsvaRecords->count();
        $rentanCount = $fsvaRecords->filter(fn ($r) => in_array((int) $r->komposit, [1, 2, 3]))->count();
        $tahanCount = $fsvaRecords->filter(fn ($r) => in_array((int) $r->komposit, [4, 5, 6]))->count();

        $fsva = [
            'tahun' => $fsvaYear,
            'total_desa' => $totalDesa,
            'rentan_count' => $rentanCount,
            'rentan_percentage' => $totalDesa > 0 ? round(($rentanCount / $totalDesa) * 100, 2) : 0,
            'tahan_count' => $tahanCount,
            'tahan_percentage' => $totalDesa > 0 ? round(($tahanCount / $totalDesa) * 100, 2) : 0,
            'p1_count' => $fsvaRecords->where('komposit', 1)->count(),
            'p2_count' => $fsvaRecords->where('komposit', 2)->count(),
            'p3_count' => $fsvaRecords->where('komposit', 3)->count(),
            'p4_count' => $fsvaRecords->where('komposit', 4)->count(),
            'p5_count' => $fsvaRecords->where('komposit', 5)->count(),
            'p6_count' => $fsvaRecords->where('komposit', 6)->count(),
        ];

        // 6. Card Harga konsumen hari ini & status HET
        $market = Market::where('is_active', true)->orderBy('order')->first();
        $marketId = $market?->id ?? 1;
        $activeMarketsCount = Market::where('is_active', true)->count();

        $hasTodayConsumer = ConsumerPrice::where('market_id', $marketId)->where('recorded_date', $todayStr)->exists();
        $consumerEffectiveDate = $hasTodayConsumer
            ? $todayStr
            : (ConsumerPrice::where('market_id', $marketId)->max('recorded_date')
                ?? ConsumerPrice::max('recorded_date')
                ?? $todayStr);

        $consumerCommodities = Commodity::with(['hets'])->where('is_active', true)->orderBy('order')->get();
        $consumerPrices = ConsumerPrice::where('market_id', $marketId)
            ->where('recorded_date', $consumerEffectiveDate)
            ->get()
            ->keyBy('commodity_id');

        $aboveHetList = [];
        $featuredConsumerList = [];
        $normalHetCount = 0;
        foreach ($consumerCommodities as $c) {
            $pRec = $consumerPrices->get($c->id);
            $price = $pRec && $pRec->price !== null ? (float) $pRec->price : 0;
            $hetRec = $c->hetAt($consumerEffectiveDate);
            $hetPrice = $hetRec ? (float) $hetRec->price : null;

            $isAboveHet = $price > 0 && $hetPrice !== null && $price > $hetPrice;
            $diff = ($price > 0 && $hetPrice !== null) ? round($price - $hetPrice, 2) : 0;
            $diffPercent = ($price > 0 && $hetPrice !== null && $hetPrice > 0) ? round(($diff / $hetPrice) * 100, 1) : 0;

            if ($isAboveHet) {
                $aboveHetList[] = [
                    'id' => $c->id,
                    'name' => $c->name,
                    'unit' => $c->unit,
                    'price' => $price,
                    'het_price' => $hetPrice,
                    'diff' => $diff,
                    'diff_percentage' => $diffPercent,
                    'image_url' => $c->image_url,
                ];
            } elseif ($price > 0 && $hetPrice !== null) {
                $normalHetCount++;
            }

            if ($price > 0 && count($featuredConsumerList) < 6) {
                $featuredConsumerList[] = [
                    'id' => $c->id,
                    'name' => $c->name,
                    'unit' => $c->unit,
                    'price' => $price,
                    'het_price' => $hetPrice,
                    'diff_percentage' => $diffPercent,
                    'is_above_het' => $isAboveHet,
                    'image_url' => $c->image_url,
                ];
            }
        }
        usort($aboveHetList, fn ($a, $b) => $b['diff_percentage'] <=> $a['diff_percentage']);

        $cDateObj = Carbon::parse($consumerEffectiveDate);
        $consumerDateFormatted = $cDateObj->format('d').' '.(self::INDO_MONTHS[(int) $cDateObj->format('n')] ?? '').' '.$cDateObj->format('Y');

        $consumerPricesData = [
            'market_name' => $market?->name ?? 'Pasar Daerah Indramayu',
            'active_markets_count' => $activeMarketsCount > 0 ? $activeMarketsCount : 1,
            'effective_date' => $consumerEffectiveDate,
            'effective_date_formatted' => $consumerDateFormatted,
            'is_today' => $consumerEffectiveDate === $todayStr,
            'total_monitored' => $consumerCommodities->count(),
            'above_het_count' => count($aboveHetList),
            'normal_het_count' => $normalHetCount,
            'commodities' => $aboveHetList,
            'featured_commodities' => $featuredConsumerList,
        ];

        // 7. Card Harga produsen hari ini & status HAP
        $hasTodayProducer = ProducerPrice::where('recorded_date', $todayStr)->exists();
        $producerEffectiveDate = $hasTodayProducer
            ? $todayStr
            : (ProducerPrice::max('recorded_date') ?? $todayStr);

        $producerRecord = ProducerPrice::where('recorded_date', $producerEffectiveDate)->first();
        $producerCommodities = ProducerCommodity::where('is_active', true)->orderBy('order')->get();

        $belowHapList = [];
        $allProducerList = [];
        $normalHapCount = 0;
        foreach ($producerCommodities as $pc) {
            $hapRec = $pc->hapAt($producerEffectiveDate);
            $hapPrice = $hapRec ? (float) $hapRec->price : 0;
            $key = $pc->key;
            $price = $producerRecord && $producerRecord->{$key} !== null ? (float) $producerRecord->{$key} : 0;

            $isBelowHap = $price > 0 && $hapPrice > 0 && $price < $hapPrice;
            $diff = ($price > 0 && $hapPrice > 0) ? round($hapPrice - $price, 2) : 0;
            $diffPercent = ($price > 0 && $hapPrice > 0) ? round(($diff / $hapPrice) * 100, 1) : 0;

            if ($isBelowHap) {
                $belowHapList[] = [
                    'id' => $pc->id,
                    'key' => $key,
                    'name' => $pc->name,
                    'unit' => $pc->unit,
                    'price' => $price,
                    'hap_price' => $hapPrice,
                    'diff' => $diff,
                    'diff_percentage' => $diffPercent,
                    'image_url' => $pc->image_url,
                ];
            } elseif ($price > 0 && $hapPrice > 0) {
                $normalHapCount++;
            }

            $allProducerList[] = [
                'id' => $pc->id,
                'key' => $key,
                'name' => $pc->name,
                'unit' => $pc->unit,
                'price' => $price,
                'hap_price' => $hapPrice,
                'is_below_hap' => $isBelowHap,
                'image_url' => $pc->image_url,
            ];
        }
        usort($belowHapList, fn ($a, $b) => $b['diff_percentage'] <=> $a['diff_percentage']);

        $pDateObj = Carbon::parse($producerEffectiveDate);
        $producerDateFormatted = $pDateObj->format('d').' '.(self::INDO_MONTHS[(int) $pDateObj->format('n')] ?? '').' '.$pDateObj->format('Y');

        $producerPricesData = [
            'effective_date' => $producerEffectiveDate,
            'effective_date_formatted' => $producerDateFormatted,
            'is_today' => $producerEffectiveDate === $todayStr,
            'total_monitored' => $producerCommodities->count(),
            'below_hap_count' => count($belowHapList),
            'normal_hap_count' => $normalHapCount,
            'commodities' => $belowHapList,
            'all_commodities' => array_slice($allProducerList, 0, 6),
        ];

        // 8. Kecamatan yang kompositnya status waspada/rentan pada SKPG
        $skpgYear = $currentYear;
        $skpgMonth = $currentMonth;
        if (! Skpg::where('year', $skpgYear)->where('month', $skpgMonth)->exists()) {
            $latestSkpg = Skpg::orderByDesc('year')->orderByDesc('month')->first();
            if ($latestSkpg) {
                $skpgYear = (int) $latestSkpg->year;
                $skpgMonth = (int) $latestSkpg->month;
            }
        }

        $skpgRecords = Skpg::where('year', $skpgYear)->where('month', $skpgMonth)->get();
        $alertKecamatan = [];
        $skpgAmanCount = 0;
        $skpgWaspadaCount = 0;
        $skpgRentanCount = 0;

        foreach ($skpgRecords as $item) {
            $ikbStatus = strtoupper((string) ($item->ikb ?? 'AMAN'));
            if (in_array($ikbStatus, ['WASPADA', 'RENTAN'])) {
                if ($ikbStatus === 'WASPADA') {
                    $skpgWaspadaCount++;
                } else {
                    $skpgRentanCount++;
                }
                $alertKecamatan[] = [
                    'id' => $item->id,
                    'kecamatan' => $item->kecamatan,
                    'kode_kecamatan' => $item->kode_kecamatan,
                    'ikb' => $ikbStatus,
                    'ik' => $item->ik,
                    'ia' => $item->ia,
                    'ip' => $item->ip,
                    'keterangan' => $item->keterangan,
                ];
            } else {
                $skpgAmanCount++;
            }
        }

        // Cari riwayat bulan terakhir yang memiliki status waspada/rentan jika bulan ini aman
        $lastAlertRecord = null;
        if (count($alertKecamatan) === 0) {
            $prevAlert = Skpg::where('year', $skpgYear)
                ->whereIn('ikb', ['WASPADA', 'RENTAN'])
                ->orderByDesc('month')
                ->first();
            if ($prevAlert) {
                $prevAlertCount = Skpg::where('year', $skpgYear)
                    ->where('month', $prevAlert->month)
                    ->whereIn('ikb', ['WASPADA', 'RENTAN'])
                    ->count();
                $lastAlertRecord = [
                    'year' => $prevAlert->year,
                    'month' => $prevAlert->month,
                    'month_name' => self::INDO_MONTHS[$prevAlert->month] ?? "Bulan {$prevAlert->month}",
                    'count' => $prevAlertCount,
                ];
            }
        }

        $skpg = [
            'year' => $skpgYear,
            'month' => $skpgMonth,
            'month_name' => self::INDO_MONTHS[$skpgMonth] ?? "Bulan $skpgMonth",
            'period_label' => (self::INDO_MONTHS[$skpgMonth] ?? "Bulan $skpgMonth").' '.$skpgYear,
            'is_current_month' => ($skpgYear === $currentYear && $skpgMonth === $currentMonth),
            'total_kecamatan' => count(Skpg::KECAMATAN_LIST),
            'alert_count' => count($alertKecamatan),
            'waspada_count' => $skpgWaspadaCount,
            'rentan_count' => $skpgRentanCount,
            'aman_count' => $skpgAmanCount,
            'alert_kecamatan' => $alertKecamatan,
            'last_alert_record' => $lastAlertRecord,
        ];

        return [
            'ikp' => $ikp,
            'cppd' => $cppd,
            'foodBalance' => $foodBalance,
            'pph' => $pph,
            'fsva' => $fsva,
            'consumerPrices' => $consumerPricesData,
            'producerPrices' => $producerPricesData,
            'skpg' => $skpg,
        ];
    }

    /**
     * Display the public landing page (Beranda) summarizing all 8 food security modules.
     */
    public function publicHome(Request $request): Response
    {
        return Inertia::render('beranda', $this->buildSummaryData());
    }

    /**
     * Display the main administrator dashboard with 8 primary food security metrics.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('dashboard', $this->buildSummaryData());
    }
}

