<?php

use App\Models\Commodity;
use App\Models\CommodityHet;
use App\Models\ConsumerPrice;
use App\Models\Market;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it resolves dynamic HET correctly according to the recorded date', function () {
    $commodity = Commodity::factory()->create([
        'name' => 'Beras Medium Test',
        'slug' => 'beras-medium-test',
    ]);

    $market = Market::factory()->create();

    // HET 1: 10,900 effective from 2023-03-01
    $hetOld = CommodityHet::factory()->create([
        'commodity_id' => $commodity->id,
        'price' => 10900,
        'effective_date' => '2023-03-01',
    ]);

    // HET 2: 13,100 effective from 2024-06-01
    $hetMid = CommodityHet::factory()->create([
        'commodity_id' => $commodity->id,
        'price' => 13100,
        'effective_date' => '2024-06-01',
    ]);

    // Test 1: Price recorded in 2023 -> matches $hetOld
    $priceOld = ConsumerPrice::factory()->create([
        'commodity_id' => $commodity->id,
        'market_id' => $market->id,
        'recorded_date' => '2023-08-15',
        'price' => 11000,
    ]);

    expect($priceOld->getApplicableHet()?->id)->toBe($hetOld->id)
        ->and((float) $priceOld->getApplicableHet()?->price)->toBe(10900.0);

    // Test 2: Price recorded in 2024 after June -> matches $hetMid
    $priceMid = ConsumerPrice::factory()->create([
        'commodity_id' => $commodity->id,
        'market_id' => $market->id,
        'recorded_date' => '2024-07-20',
        'price' => 13000,
    ]);

    expect($priceMid->getApplicableHet()?->id)->toBe($hetMid->id)
        ->and((float) $priceMid->getApplicableHet()?->price)->toBe(13100.0);

    // Test 3: Add new HET 3 (14,000 effective 2026-01-01)
    $hetNew = CommodityHet::factory()->create([
        'commodity_id' => $commodity->id,
        'price' => 14000,
        'effective_date' => '2026-01-01',
    ]);

    // Now record new price in 2026 -> matches $hetNew
    $priceNew = ConsumerPrice::factory()->create([
        'commodity_id' => $commodity->id,
        'market_id' => $market->id,
        'recorded_date' => '2026-02-01',
        'price' => 14200,
    ]);

    expect($priceNew->getApplicableHet()?->id)->toBe($hetNew->id)
        ->and((float) $priceNew->getApplicableHet()?->price)->toBe(14000.0);

    // Crucial requirement: Older prices STILL resolve to their corresponding older HETs!
    expect($priceOld->fresh()->getApplicableHet()?->id)->toBe($hetOld->id)
        ->and($priceMid->fresh()->getApplicableHet()?->id)->toBe($hetMid->id);
});
