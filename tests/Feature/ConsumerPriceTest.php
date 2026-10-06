<?php

use App\Models\Commodity;
use App\Models\CommodityHet;
use App\Models\ConsumerPrice;
use App\Models\Market;
use App\Models\User;
use Database\Seeders\CommoditySeeder;
use Database\Seeders\MarketSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests cannot access consumer prices or hets pages', function () {
    $this->get('/consumer-prices')->assertRedirect('/login');
    $this->get('/hets')->assertRedirect('/login');
});

test('authenticated user can view consumer prices page with seeded commodities and markets', function () {
    $this->seed([MarketSeeder::class, CommoditySeeder::class]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/consumer-prices');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('consumer-prices/index')
        ->has('items', 25)
        ->has('markets', 5)
        ->has('statistics')
    );
});

test('authenticated user can store and update a single consumer price', function () {
    $this->seed([MarketSeeder::class, CommoditySeeder::class]);
    $user = User::factory()->create();
    $commodity = Commodity::first();
    $market = Market::first();
    $date = now()->format('Y-m-d');

    // Store price
    $response = $this->actingAs($user)->post('/consumer-prices', [
        'commodity_id' => $commodity->id,
        'market_id' => $market->id,
        'recorded_date' => $date,
        'price' => 14500,
        'notes' => 'Catatan uji coba',
    ]);

    $response->assertRedirect();
    $saved = ConsumerPrice::where('commodity_id', $commodity->id)
        ->where('market_id', $market->id)
        ->first();
    expect($saved)->not->toBeNull()
        ->and($saved->recorded_date->format('Y-m-d'))->toBe($date)
        ->and((float) $saved->price)->toBe(14500.0)
        ->and($saved->notes)->toBe('Catatan uji coba');

    // Update price on the same date and market
    $this->actingAs($user)->post('/consumer-prices', [
        'commodity_id' => $commodity->id,
        'market_id' => $market->id,
        'recorded_date' => $date,
        'price' => 15000,
        'notes' => 'Harga naik',
    ]);

    $updated = ConsumerPrice::where('commodity_id', $commodity->id)
        ->where('market_id', $market->id)
        ->first();
    expect($updated)->not->toBeNull()
        ->and((float) $updated->price)->toBe(15000.0)
        ->and($updated->notes)->toBe('Harga naik');
});

test('authenticated user can bulk store prices for commodities', function () {
    $this->seed([MarketSeeder::class, CommoditySeeder::class]);
    $user = User::factory()->create();
    $market = Market::first();
    $commodities = Commodity::take(5)->get();
    $date = now()->format('Y-m-d');

    $items = $commodities->map(fn ($c, $idx) => [
        'commodity_id' => $c->id,
        'price' => 10000 + ($idx * 1000),
        'notes' => "Bulk note $idx",
    ])->toArray();

    $response = $this->actingAs($user)->post('/consumer-prices/bulk', [
        'market_id' => $market->id,
        'recorded_date' => $date,
        'items' => $items,
    ]);

    $response->assertRedirect();

    foreach ($items as $item) {
        $saved = ConsumerPrice::where('commodity_id', $item['commodity_id'])
            ->where('market_id', $market->id)
            ->first();
        expect($saved)->not->toBeNull()
            ->and((float) $saved->price)->toBe((float) $item['price']);
    }
});

test('authenticated user can delete a consumer price', function () {
    $user = User::factory()->create();
    $price = ConsumerPrice::factory()->create();

    $response = $this->actingAs($user)->delete("/consumer-prices/{$price->id}");

    $response->assertRedirect();
    $this->assertDatabaseMissing('consumer_prices', [
        'id' => $price->id,
    ]);
});

test('authenticated user can view hets management page', function () {
    $this->seed([CommoditySeeder::class]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/hets');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('hets/index')
        ->has('commodities', 25)
        ->has('statistics')
    );
});

test('authenticated user can create, update and delete dynamic HET records', function () {
    $commodity = Commodity::factory()->create(['name' => 'Beras Medium HET Test']);
    $user = User::factory()->create();

    // 1. Create HET
    $response = $this->actingAs($user)->post('/hets', [
        'commodity_id' => $commodity->id,
        'price' => 13100,
        'effective_date' => '2024-06-01',
        'source_regulation' => 'Perbadan No. 05/2024',
        'notes' => 'Zona 1',
    ]);

    $response->assertRedirect();
    $het = CommodityHet::where('commodity_id', $commodity->id)->first();
    expect($het)->not->toBeNull()
        ->and((float) $het->price)->toBe(13100.0)
        ->and($het->effective_date->format('Y-m-d'))->toBe('2024-06-01')
        ->and($het->source_regulation)->toBe('Perbadan No. 05/2024');

    // 2. Update HET
    $this->actingAs($user)->put("/hets/{$het->id}", [
        'price' => 13500,
        'effective_date' => '2024-06-01',
        'source_regulation' => 'Perbadan No. 05/2024 Revisi',
        'notes' => 'Zona 1 Revisi',
    ]);

    $het->refresh();
    expect((float) $het->price)->toBe(13500.0)
        ->and($het->source_regulation)->toBe('Perbadan No. 05/2024 Revisi');

    // 3. Delete HET
    $this->actingAs($user)->delete("/hets/{$het->id}");

    $this->assertDatabaseMissing('commodity_hets', [
        'id' => $het->id,
    ]);
});

test('authenticated user can download consumer prices template in xlsx and csv format with 25 commodities', function () {
    $this->seed([CommoditySeeder::class]);
    $user = User::factory()->create();

    // 1. Download XLSX template
    $xlsxResponse = $this->actingAs($user)->get('/consumer-prices/template?format=xlsx');
    $xlsxResponse->assertOk();
    $xlsxResponse->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect($xlsxResponse->getContent())->not->toBeEmpty();

    // 2. Download CSV template
    $csvResponse = $this->actingAs($user)->get('/consumer-prices/template?format=csv');
    $csvResponse->assertOk();
    $csvResponse->assertHeader('content-type', 'text/csv; charset=UTF-8');
    $csvContent = $csvResponse->getContent();

    // Verify first and last commodities exist in the CSV template
    expect($csvContent)->toContain('Beras Premium')
        ->and($csvContent)->toContain('Daging Kerbau Beku (Impor Luar Negeri)');
});

test('authenticated user can import consumer prices via uploaded csv file', function () {
    $this->seed([MarketSeeder::class, CommoditySeeder::class]);
    $user = User::factory()->create();
    $market = Market::first();
    $date = now()->format('Y-m-d');

    // Build a CSV with prices for 25 commodities
    $commodities = Commodity::orderBy('order')->get();
    $lines = ["No;Nama Komoditas;Satuan;HET Acuan (Rp);Harga Konsumen (Rp);Catatan"];
    foreach ($commodities as $c) {
        $lines[] = "{$c->order};\"{$c->name}\";{$c->unit};;15000;Stok aman";
    }
    $csvData = implode("\r\n", $lines);

    $file = Illuminate\Http\UploadedFile::fake()->createWithContent('harga.csv', $csvData);

    $response = $this->actingAs($user)->post('/consumer-prices/import', [
        'market_id' => $market->id,
        'recorded_date' => $date,
        'file' => $file,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Verify all 25 commodities were recorded
    expect(ConsumerPrice::where('market_id', $market->id)->where('recorded_date', $date)->count())->toBe(25);
    $berasPremium = Commodity::where('name', 'Beras Premium')->first();
    $record = ConsumerPrice::where('commodity_id', $berasPremium->id)->where('market_id', $market->id)->first();
    expect($record)->not->toBeNull()
        ->and((float) $record->price)->toBe(15000.0)
        ->and($record->notes)->toBe('Stok aman');
});

test('authenticated user can import consumer prices via uploaded xlsx file', function () {
    $this->seed([MarketSeeder::class, CommoditySeeder::class]);
    $user = User::factory()->create();
    $market = Market::first();
    $date = now()->format('Y-m-d');

    $commodities = Commodity::orderBy('order')->get();
    $excelService = app(App\Services\SimpleExcelService::class);

    // Generate XLSX with prices pre-filled for each commodity
    $prices = [];
    foreach ($commodities as $c) {
        $prices[$c->id] = 16000;
    }
    $xlsxBinary = $excelService->generateXlsxTemplate($commodities, $date, $prices);

    $file = Illuminate\Http\UploadedFile::fake()->createWithContent('harga.xlsx', $xlsxBinary);

    $response = $this->actingAs($user)->post('/consumer-prices/import', [
        'market_id' => $market->id,
        'recorded_date' => $date,
        'file' => $file,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect(ConsumerPrice::where('market_id', $market->id)->where('recorded_date', $date)->count())->toBe(25);
    $saved = ConsumerPrice::where('market_id', $market->id)->where('recorded_date', $date)->first();
    expect((float) $saved->price)->toBe(16000.0);
});

