<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

use App\Http\Controllers\CommodityController;
use App\Http\Controllers\CommodityHetController;
use App\Http\Controllers\ConsumerPriceController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Modul Kelola Komoditas
    Route::get('/commodities', [CommodityController::class, 'index'])->name('commodities.index');
    Route::post('/commodities', [CommodityController::class, 'store'])->name('commodities.store');
    Route::put('/commodities/{commodity}', [CommodityController::class, 'update'])->name('commodities.update');
    Route::delete('/commodities/{commodity}', [CommodityController::class, 'destroy'])->name('commodities.destroy');

    // Modul Harga Konsumen
    Route::get('/consumer-prices', [ConsumerPriceController::class, 'index'])->name('consumer-prices.index');
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
