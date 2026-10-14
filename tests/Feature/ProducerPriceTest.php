<?php

use App\Models\ProducerPrice;
use App\Models\User;
use Database\Seeders\ProducerCommoditySeeder;
use Database\Seeders\ProducerPriceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests cannot access producer prices admin page', function () {
    $this->get('/producer-prices')->assertRedirect('/login');
});

test('public user can view harga-produsen page', function () {
    $this->seed([ProducerCommoditySeeder::class, ProducerPriceSeeder::class]);

    $response = $this->get('/harga-produsen');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('harga-produsen')
        ->has('commodities')
        ->has('selectedDate')
        ->has('latestDate')
    );
});

test('public user can fetch history with is_below_hap flags', function () {
    $this->seed([ProducerCommoditySeeder::class, ProducerPriceSeeder::class]);

    $response = $this->getJson('/api/public-producer-history-data?start_date=2026-01-01&end_date=2026-01-31');

    $response->assertOk();
    $response->assertJsonStructure([
        'rows' => [
            '*' => [
                'date',
                'prices',
                'haps',
                'is_below_hap',
            ],
        ],
    ]);
});

test('public user can fetch monthly history with is_below_hap in commodities and summary', function () {
    $this->seed([ProducerCommoditySeeder::class, ProducerPriceSeeder::class]);

    $response = $this->getJson('/api/public-producer-monthly-history-data?year=2026');

    $response->assertOk();
    $response->assertJsonStructure([
        'year',
        'commodity_rows' => [
            '*' => [
                'name',
                'monthly_prices',
                'is_below_hap',
            ],
        ],
        'month_summary' => [
            '1' => [
                'below_hap_count',
                'above_hap_count',
            ],
        ],
    ]);
});

test('authenticated user can view producer-prices admin page with commodities and statistics', function () {
    $this->seed([ProducerCommoditySeeder::class, ProducerPriceSeeder::class]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/producer-prices');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('producer-prices/index')
        ->has('items')
        ->has('statistics')
    );
});

test('authenticated user can store producer prices', function () {
    $this->seed([ProducerCommoditySeeder::class]);
    $user = User::factory()->create();
    $date = '2026-03-20';

    $response = $this->actingAs($user)->post('/producer-prices', [
        'recorded_date' => $date,
        'gkp_petani' => 6500,
        'gkp_penggilingan' => 6700,
        'gkg_penggilingan' => 7800,
        'beras_medium_penggilingan' => 12500,
        'beras_premium_penggilingan' => 14000,
        'sapi_hidup' => 55000,
        'notes' => 'Uji coba harga produsen',
    ]);

    $response->assertRedirect();
    $saved = ProducerPrice::where('recorded_date', $date)->first();
    expect($saved)->not->toBeNull()
        ->and((float) $saved->gkp_petani)->toBe(6500.0)
        ->and((float) $saved->sapi_hidup)->toBe(55000.0)
        ->and($saved->notes)->toBe('Uji coba harga produsen');
});
