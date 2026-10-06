<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

use App\Http\Controllers\CommodityController;
use App\Http\Controllers\CommodityHetController;
use App\Http\Controllers\ConsumerPriceController;
use App\Http\Controllers\MarketController;

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
