<?php

use App\Http\Controllers\CommodityController;
use App\Http\Controllers\CommodityHetController;
use App\Http\Controllers\ConsumerPriceController;
use App\Http\Controllers\FoodBalanceCommodityController;
use App\Http\Controllers\FoodBalanceController;
use App\Http\Controllers\MarketController;
use App\Http\Controllers\PphFoodGroupController;
use App\Http\Controllers\PphScoreController;
use App\Http\Controllers\PphScoreDetailController;
use App\Http\Controllers\ProducerCommodityController;
use App\Http\Controllers\ProducerHapController;
use App\Http\Controllers\ProducerPriceController;
use App\Models\Commodity;
use App\Models\ConsumerPrice;
use App\Models\Market;
use App\Models\ProducerCommodity;
use App\Models\ProducerPrice;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('harga-konsumen');
})->name('home');

Route::get('/harga-konsumen', function (Request $request) {
    // Hanya tampilkan pasar yang statusnya aktif (is_active = true)
    $markets = Market::where('is_active', true)->orderBy('order')->get();

    $defaultMarketId = $markets->first()?->id ?? 1;
    $selectedMarketId = (int) $request->query('market_id', $defaultMarketId);
    $selectedMarket = $markets->firstWhere('id', $selectedMarketId) ?? $markets->first();
    $marketId = $selectedMarket?->id ?? $defaultMarketId;

    // Available recorded dates in DB
    $maxRecordedDate = ConsumerPrice::max('recorded_date') ?? now()->format('Y-m-d');
    $minRecordedDate = ConsumerPrice::min('recorded_date') ?? '2026-01-01';

    $selectedDate = $request->query('date', $maxRecordedDate);
    if (! is_string($selectedDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $selectedDate)) {
        $selectedDate = $maxRecordedDate;
    }

    // Previous date before selectedDate for this market to calculate yesterday change
    $prevDate = ConsumerPrice::where('market_id', $marketId)
        ->where('recorded_date', '<', $selectedDate)
        ->max('recorded_date');

    if (! $prevDate) {
        $prevDate = Carbon::parse($selectedDate)->subDay()->format('Y-m-d');
    }

    $commodities = Commodity::with(['hets'])->where('is_active', true)->orderBy('order')->get();

    // Query prices for selected date and market
    $currentPrices = ConsumerPrice::where('market_id', $marketId)
        ->where('recorded_date', $selectedDate)
        ->get()
        ->keyBy('commodity_id');

    // Query prices for previous date and market
    $prevPrices = ConsumerPrice::where('market_id', $marketId)
        ->where('recorded_date', $prevDate)
        ->get()
        ->keyBy('commodity_id');

    $consumerCommodities = $commodities->map(function ($c) use ($currentPrices, $prevPrices, $selectedDate) {
        $priceRecord = $currentPrices->get($c->id);
        $prevPriceRecord = $prevPrices->get($c->id);
        $applicableHet = $c->hetAt($selectedDate);

        $todayPrice = $priceRecord ? (float) $priceRecord->price : null;
        $yesterdayPrice = $prevPriceRecord ? (float) $prevPriceRecord->price : null;
        $hetPrice = $applicableHet ? (float) $applicableHet->price : null;

        return [
            'id' => $c->id,
            'name' => $c->name,
            'category' => $c->category,
            'unit' => $c->unit,
            'image' => $c->image_url,
            'today_price' => $todayPrice,
            'yesterday_price' => $yesterdayPrice,
            'het_price' => $hetPrice,
            'date' => $selectedDate,
        ];
    });

    return Inertia::render('harga-konsumen', [
        'consumerCommodities' => $consumerCommodities,
        'markets' => $markets->map(fn ($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'location' => $m->location,
        ]),
        'selectedMarketId' => $marketId,
        'selectedMarketName' => $selectedMarket?->name ?? 'Pasar Daerah Indramayu',
        'selectedDate' => $selectedDate,
        'prevDate' => $prevDate,
        'minDate' => $minRecordedDate,
        'maxDate' => now()->format('Y-m-d'),
    ]);
})->name('harga-konsumen');

Route::get('/harga-produsen', function (Request $request) {
    $maxRecordedDate = ProducerPrice::max('recorded_date') ?? now()->format('Y-m-d');
    $minRecordedDate = ProducerPrice::min('recorded_date') ?? '2026-01-01';

    $selectedDate = $request->query('date', $maxRecordedDate);
    if (! is_string($selectedDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $selectedDate)) {
        $selectedDate = $maxRecordedDate;
    }

    $currentRecord = ProducerPrice::where('recorded_date', $selectedDate)->first();
    $prevDate = ProducerPrice::where('recorded_date', '<', $selectedDate)->max('recorded_date');
    $prevRecord = $prevDate ? ProducerPrice::where('recorded_date', $prevDate)->first() : null;

    $dbCommodities = ProducerCommodity::where('is_active', true)
        ->with(['haps' => fn ($q) => $q->where('effective_date', '<=', $selectedDate)->orderByDesc('effective_date')->orderByDesc('id')])
        ->orderBy('order')
        ->get();

    if ($dbCommodities->isNotEmpty()) {
        $commoditiesConfig = $dbCommodities->map(function ($c) use ($selectedDate) {
            $hap = $c->hapAt($selectedDate);

            return [
                'id' => $c->id,
                'key' => $c->key,
                'name' => $c->name,
                'short_name' => $c->name,
                'category' => $c->category,
                'unit' => $c->unit,
                'order' => $c->order,
                'hap' => $hap ? (float) $hap->price : 0,
                'hap_label' => $hap?->source_regulation ?? 'HAP Bapanas',
                'description' => $c->description ?? '',
                'image' => $c->image_url,
                'image_url' => $c->image_url,
            ];
        })->toArray();
    } else {
        $commoditiesConfig = ProducerPrice::COMMODITIES;
    }

    $producerCommodities = array_map(function ($cfg) use ($currentRecord, $prevRecord): array {
        $key = $cfg['key'];
        $currentPrice = $currentRecord && $currentRecord->{$key} !== null ? (float) $currentRecord->{$key} : null;
        $prevPrice = $prevRecord && $prevRecord->{$key} !== null ? (float) $prevRecord->{$key} : null;
        $hapPrice = (float) $cfg['hap'];

        $diffHap = null;
        $diffHapPercentage = null;
        $status = 'not_recorded';

        if ($currentPrice !== null) {
            $diffHap = round($currentPrice - $hapPrice, 2);
            $diffHapPercentage = $hapPrice > 0 ? round(($diffHap / $hapPrice) * 100, 2) : 0;
            if ($diffHap > 0) {
                $status = 'above';
            } elseif ($diffHap < 0) {
                $status = 'below';
            } else {
                $status = 'equal';
            }
        }

        $diffYesterday = null;
        $diffYesterdayPercentage = null;
        $changeType = 'stable';

        if ($currentPrice !== null && $prevPrice !== null) {
            $diffYesterday = round($currentPrice - $prevPrice, 2);
            $diffYesterdayPercentage = $prevPrice > 0 ? round(($diffYesterday / $prevPrice) * 100, 2) : 0;
            if ($diffYesterday > 0) {
                $changeType = 'up';
            } elseif ($diffYesterday < 0) {
                $changeType = 'down';
            } else {
                $changeType = 'stable';
            }
        }

        return [
            'id' => (int) ($cfg['id'] ?? $cfg['order']),
            'key' => $key,
            'name' => $cfg['name'],
            'short_name' => $cfg['short_name'],
            'category' => $cfg['category'],
            'unit' => $cfg['unit'],
            'order' => $cfg['order'],
            'hap' => $hapPrice,
            'hap_label' => $cfg['hap_label'],
            'description' => $cfg['description'],
            'image' => $cfg['image'] ?? null,
            'image_url' => $cfg['image_url'] ?? null,
            'today_price' => $currentPrice,
            'yesterday_price' => $prevPrice,
            'diff_hap' => $diffHap,
            'diff_hap_percentage' => $diffHapPercentage,
            'status' => $status,
            'diff_yesterday' => $diffYesterday,
            'diff_yesterday_percentage' => $diffYesterdayPercentage,
            'change_type' => $changeType,
        ];
    }, $commoditiesConfig);

    return Inertia::render('harga-produsen', [
        'marketName' => 'Kabupaten Indramayu',
        'selectedDate' => $selectedDate,
        'latestDate' => $maxRecordedDate,
        'prevDate' => $prevDate,
        'minDate' => $minRecordedDate,
        'maxDate' => now()->format('Y-m-d'),
        'commodities' => $producerCommodities,
    ]);
})->name('harga-produsen');

Route::get('/api/public-chart-data', [ConsumerPriceController::class, 'chartData'])->name('public.chart-data');
Route::get('/api/public-history-data', [ConsumerPriceController::class, 'historyData'])->name('public.history-data');
Route::get('/api/public-history-excel', [ConsumerPriceController::class, 'historyExcel'])->name('public.history-excel');

Route::get('/api/public-producer-chart-data', [ProducerPriceController::class, 'chartData'])->name('public.producer-chart-data');
Route::get('/api/public-producer-history-data', [ProducerPriceController::class, 'historyData'])->name('public.producer-history-data');
Route::get('/api/public-producer-history-excel', [ProducerPriceController::class, 'historyExcel'])->name('public.producer-history-excel');

Route::get('/neraca-pangan', [FoodBalanceController::class, 'publicIndex'])->name('neraca-pangan');

Route::get('/pph', [PphScoreController::class, 'publicIndex'])->name('pph');
Route::redirect('/skor-pph', '/pph');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Modul Neraca Pangan Bulanan
    Route::get('/food-balances', [FoodBalanceController::class, 'index'])->name('food-balances.index');
    Route::get('/food-balances/template', [FoodBalanceController::class, 'downloadTemplate'])->name('food-balances.template');
    Route::get('/food-balances/export', [FoodBalanceController::class, 'exportExcel'])->name('food-balances.export');
    Route::post('/food-balances/import', [FoodBalanceController::class, 'import'])->name('food-balances.import');
    Route::post('/food-balances', [FoodBalanceController::class, 'store'])->name('food-balances.store');
    Route::post('/food-balances/bulk', [FoodBalanceController::class, 'bulkStore'])->name('food-balances.bulk-store');
    Route::delete('/food-balances/{foodBalance}', [FoodBalanceController::class, 'destroy'])->name('food-balances.destroy');

    // Modul Kelola Komoditas Neraca Pangan
    Route::get('/food-balance-commodities', [FoodBalanceCommodityController::class, 'index'])->name('food-balance-commodities.index');
    Route::post('/food-balance-commodities', [FoodBalanceCommodityController::class, 'store'])->name('food-balance-commodities.store');
    Route::put('/food-balance-commodities/{foodBalanceCommodity}', [FoodBalanceCommodityController::class, 'update'])->name('food-balance-commodities.update');
    Route::post('/food-balance-commodities/{foodBalanceCommodity}/toggle', [FoodBalanceCommodityController::class, 'toggleStatus'])->name('food-balance-commodities.toggle');
    Route::delete('/food-balance-commodities/{foodBalanceCommodity}', [FoodBalanceCommodityController::class, 'destroy'])->name('food-balance-commodities.destroy');

    // Modul Kelola Pasar
    Route::get('/markets', [MarketController::class, 'index'])->name('markets.index');
    Route::post('/markets', [MarketController::class, 'store'])->name('markets.store');
    Route::put('/markets/{market}', [MarketController::class, 'update'])->name('markets.update');
    Route::post('/markets/{market}/toggle', [MarketController::class, 'toggleStatus'])->name('markets.toggle');
    Route::delete('/markets/{market}', [MarketController::class, 'destroy'])->name('markets.destroy');

    // Modul Kelola Komoditas
    Route::get('/commodities', [CommodityController::class, 'index'])->name('commodities.index');
    Route::post('/commodities', [CommodityController::class, 'store'])->name('commodities.store');
    Route::put('/commodities/{commodity}', [CommodityController::class, 'update'])->name('commodities.update');
    Route::delete('/commodities/{commodity}', [CommodityController::class, 'destroy'])->name('commodities.destroy');

    // Modul Harga Konsumen
    Route::get('/consumer-prices', [ConsumerPriceController::class, 'index'])->name('consumer-prices.index');
    Route::get('/consumer-prices/template', [ConsumerPriceController::class, 'downloadTemplate'])->name('consumer-prices.template');
    Route::post('/consumer-prices/import', [ConsumerPriceController::class, 'import'])->name('consumer-prices.import');
    Route::post('/consumer-prices', [ConsumerPriceController::class, 'store'])->name('consumer-prices.store');
    Route::post('/consumer-prices/bulk', [ConsumerPriceController::class, 'bulkStore'])->name('consumer-prices.bulk-store');
    Route::delete('/consumer-prices/{consumerPrice}', [ConsumerPriceController::class, 'destroy'])->name('consumer-prices.destroy');

    // Modul Harga Produsen
    Route::get('/producer-prices', [ProducerPriceController::class, 'index'])->name('producer-prices.index');
    Route::get('/producer-prices/template', [ProducerPriceController::class, 'downloadTemplate'])->name('producer-prices.template');
    Route::post('/producer-prices/import', [ProducerPriceController::class, 'import'])->name('producer-prices.import');
    Route::post('/producer-prices', [ProducerPriceController::class, 'store'])->name('producer-prices.store');
    Route::post('/producer-prices/bulk', [ProducerPriceController::class, 'bulkStore'])->name('producer-prices.bulk-store');
    Route::delete('/producer-prices/{producerPrice}', [ProducerPriceController::class, 'destroy'])->name('producer-prices.destroy');

    // Modul Pengelolaan HET Komoditas (Dinamis)
    Route::get('/hets', [CommodityHetController::class, 'index'])->name('hets.index');
    Route::post('/hets', [CommodityHetController::class, 'store'])->name('hets.store');
    Route::put('/hets/{het}', [CommodityHetController::class, 'update'])->name('hets.update');
    Route::delete('/hets/{het}', [CommodityHetController::class, 'destroy'])->name('hets.destroy');

    // Modul Kelola Komoditas Produsen
    Route::get('/producer-commodities', [ProducerCommodityController::class, 'index'])->name('producer-commodities.index');
    Route::post('/producer-commodities', [ProducerCommodityController::class, 'store'])->name('producer-commodities.store');
    Route::put('/producer-commodities/{producerCommodity}', [ProducerCommodityController::class, 'update'])->name('producer-commodities.update');
    Route::post('/producer-commodities/{producerCommodity}/photo', [ProducerCommodityController::class, 'updatePhoto'])->name('producer-commodities.photo');
    Route::delete('/producer-commodities/{producerCommodity}', [ProducerCommodityController::class, 'destroy'])->name('producer-commodities.destroy');

    // Modul Pengelolaan HAP Produsen (Dinamis)
    Route::get('/producer-haps', [ProducerHapController::class, 'index'])->name('producer-haps.index');
    Route::post('/producer-haps', [ProducerHapController::class, 'store'])->name('producer-haps.store');
    Route::put('/producer-haps/{hap}', [ProducerHapController::class, 'update'])->name('producer-haps.update');
    Route::delete('/producer-haps/{hap}', [ProducerHapController::class, 'destroy'])->name('producer-haps.destroy');

    // Modul Skor PPH
    Route::get('/pph-scores', [PphScoreController::class, 'index'])->name('pph-scores.index');
    Route::post('/pph-scores', [PphScoreController::class, 'store'])->name('pph-scores.store');
    Route::put('/pph-scores/{pphScore}', [PphScoreController::class, 'update'])->name('pph-scores.update');
    Route::post('/pph-scores/{pphScore}/recalculate', [PphScoreController::class, 'recalculate'])->name('pph-scores.recalculate');
    Route::delete('/pph-scores/{pphScore}', [PphScoreController::class, 'destroy'])->name('pph-scores.destroy');

    // Modul Detail Skor PPH
    Route::get('/pph-score-details', [PphScoreDetailController::class, 'index'])->name('pph-score-details.index');
    Route::post('/pph-score-details', [PphScoreDetailController::class, 'store'])->name('pph-score-details.store');
    Route::post('/pph-score-details/bulk', [PphScoreDetailController::class, 'bulkStore'])->name('pph-score-details.bulk-store');
    Route::put('/pph-score-details/{pphScoreDetail}', [PphScoreDetailController::class, 'update'])->name('pph-score-details.update');
    Route::delete('/pph-score-details/{pphScoreDetail}', [PphScoreDetailController::class, 'destroy'])->name('pph-score-details.destroy');

    // Modul Kelola Kelompok Bahan Pangan PPH (Dinamis)
    Route::get('/pph-food-groups', [PphFoodGroupController::class, 'index'])->name('pph-food-groups.index');
    Route::post('/pph-food-groups', [PphFoodGroupController::class, 'store'])->name('pph-food-groups.store');
    Route::put('/pph-food-groups/{pphFoodGroup}', [PphFoodGroupController::class, 'update'])->name('pph-food-groups.update');
    Route::post('/pph-food-groups/{pphFoodGroup}/toggle', [PphFoodGroupController::class, 'toggleStatus'])->name('pph-food-groups.toggle');
    Route::delete('/pph-food-groups/{pphFoodGroup}', [PphFoodGroupController::class, 'destroy'])->name('pph-food-groups.destroy');
});

require __DIR__.'/settings.php';
