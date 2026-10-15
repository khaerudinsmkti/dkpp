<?php

use App\Models\Skpg;
use App\Models\User;

test('public page for skpg is displayed with map data, hero summary, and indicators', function () {
    $response = $this->get('/skpg');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('skpg')
        ->has('kecamatanItems')
        ->has('summary')
        ->has('indicators')
        ->has('availableYears')
        ->has('availableMonths')
    );
});

test('public geojson endpoint returns indramayu kecamatan geojson file', function () {
    $response = $this->get('/api/skpg/geojson');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/geo+json');
});

test('guests are redirected to login from admin skpg routes', function () {
    $this->get('/skpg-admin')->assertRedirect('/login');
});

test('authenticated user can view skpg admin page with bulk items and statistics', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/skpg-admin');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('skpg/index')
        ->has('records')
        ->has('bulkItems')
        ->has('kecamatanList')
        ->has('statistics')
        ->has('availableYears')
    );
});

test('authenticated user can create, update, and delete a single skpg record in admin panel', function () {
    $user = User::factory()->create();

    $testYear = 2038;
    $testMonth = 5;
    $testKecamatan = 'HAURGEULIS';

    // Clean state
    Skpg::where('year', $testYear)->delete();

    // 1. Create
    $response = $this->actingAs($user)->post('/skpg-admin', [
        'kecamatan' => $testKecamatan,
        'year' => $testYear,
        'month' => $testMonth,
        'ik' => 'AMAN',
        'ia' => 'WASPADA',
        'ip' => 'AMAN',
        'ikb' => 'WASPADA',
        'potensi_kering' => 'WASPADA',
        'potensi_basah' => 'AMAN',
        'kondisi_iklim' => 'AMAN',
        'keterangan' => 'Uji Coba Otomatis Tunggal',
    ]);

    $response->assertSessionHas('success');
    expect(Skpg::where('year', $testYear)->where('kecamatan', $testKecamatan)->exists())->toBeTrue();

    $created = Skpg::where('year', $testYear)->where('kecamatan', $testKecamatan)->first();
    expect($created->ia)->toBe('WASPADA');
    expect($created->ikb)->toBe('WASPADA');

    // 2. Update
    $updateResponse = $this->actingAs($user)->put("/skpg-admin/{$created->id}", [
        'ik' => 'RENTAN',
        'ia' => 'RENTAN',
        'ip' => 'WASPADA',
        'ikb' => 'RENTAN',
        'potensi_kering' => 'RENTAN',
        'potensi_basah' => 'WASPADA',
        'kondisi_iklim' => 'WASPADA',
        'keterangan' => 'Hasil Evaluasi Diperbarui',
    ]);

    $updateResponse->assertSessionHas('success');
    $created->refresh();
    expect($created->ikb)->toBe('RENTAN');
    expect($created->potensi_kering)->toBe('RENTAN');

    // 3. Delete
    $deleteResponse = $this->actingAs($user)->delete("/skpg-admin/{$created->id}");
    $deleteResponse->assertSessionHas('success');
    expect(Skpg::where('id', $created->id)->exists())->toBeFalse();
});

test('authenticated user can bulk store all 31 kecamatan in admin panel', function () {
    $user = User::factory()->create();

    $testYear = 2039;
    $testMonth = 7;

    Skpg::where('year', $testYear)->delete();

    $items = [];
    foreach (Skpg::KECAMATAN_LIST as $idx => $kec) {
        $items[] = [
            'kecamatan' => $kec,
            'ik' => $idx % 2 === 0 ? 'AMAN' : 'WASPADA',
            'ia' => 'AMAN',
            'ip' => 'AMAN',
            'ikb' => $idx % 2 === 0 ? 'AMAN' : 'WASPADA',
            'potensi_kering' => 'AMAN',
            'potensi_basah' => 'AMAN',
            'kondisi_iklim' => 'AMAN',
            'keterangan' => "Bulk data {$kec}",
        ];
    }

    expect(count($items))->toBe(31);

    $response = $this->actingAs($user)->post('/skpg-admin/bulk', [
        'year' => $testYear,
        'month' => $testMonth,
        'items' => $items,
    ]);

    $response->assertSessionHas('success');

    $count = Skpg::where('year', $testYear)->where('month', $testMonth)->count();
    expect($count)->toBe(31);
});

