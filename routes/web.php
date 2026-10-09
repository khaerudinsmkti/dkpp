<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\CommodityController;
use App\Http\Controllers\CommodityHetController;
use App\Http\Controllers\ConsumerPriceController;
use App\Http\Controllers\MarketController;
use App\Models\Commodity;
use App\Models\ConsumerPrice;
use App\Models\Market;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('harga-konsumen');
})->name('home');

Route::get('/harga-konsumen', function (\Illuminate\Http\Request $request) {
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
        $prevDate = \Illuminate\Support\Carbon::parse($selectedDate)->subDay()->format('Y-m-d');
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

Route::get('/harga-produsen', function () {
    $latestOverallDate = ConsumerPrice::max('recorded_date') ?? now()->format('Y-m-d');
    return Inertia::render('harga-produsen', [
        'marketName' => 'Kabupaten Indramayu',
        'latestDate' => $latestOverallDate,
    ]);
})->name('harga-produsen');

Route::get('/api/public-chart-data', [ConsumerPriceController::class, 'chartData'])->name('public.chart-data');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

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

    // Modul Pengelolaan HET Komoditas (Dinamis)
    Route::get('/hets', [CommodityHetController::class, 'index'])->name('hets.index');
    Route::post('/hets', [CommodityHetController::class, 'store'])->name('hets.store');
    Route::put('/hets/{het}', [CommodityHetController::class, 'update'])->name('hets.update');
    Route::delete('/hets/{het}', [CommodityHetController::class, 'destroy'])->name('hets.destroy');
});

require __DIR__.'/settings.php';
