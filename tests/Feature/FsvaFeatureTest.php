<?php

use App\Models\Fsva;
use App\Models\User;

test('public page for fsva is displayed with map items, summary, charts, and classification cards', function () {
    $response = $this->get('/fsva');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('fsva')
        ->has('items')
        ->has('summary')
        ->has('priorityChartData')
        ->has('donutSummary')
        ->has('classificationCards')
        ->has('indicators')
        ->has('availableYears')
        ->has('kecamatanList')
        ->has('filters')
    );
});

test('public geojson endpoint returns indramayu desa geojson file', function () {
    $response = $this->get('/api/fsva/geojson');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/geo+json');
});

test('guests are redirected to login from admin fsva routes', function () {
    $this->get('/fsva-admin')->assertRedirect('/login');
});

test('authenticated user can view fsva admin page with records, statistics, and filters', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/fsva-admin');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('fsva/index')
        ->has('records')
        ->has('statistics')
        ->has('availableYears')
        ->has('kecamatanList')
        ->has('villageData')
        ->has('indicators')
        ->has('priorities')
        ->has('filters')
    );
});

test('authenticated user can create, update, and delete a single fsva record in admin panel', function () {
    $user = User::factory()->create();

    $testYear = 2035;
    $testKecamatan = 'HAURGEULIS';
    $testDesa = 'HAURKOLOT';

    // Clean up
    Fsva::where('tahun', $testYear)->delete();

    // 1. Create
    $createResponse = $this->actingAs($user)->post('/fsva-admin', [
        'tahun' => $testYear,
        'kecamatan' => $testKecamatan,
        'desa' => $testDesa,
        'ncpr' => 1.35,
        'energy' => 2150.5,
        'protein' => 68.2,
        'food_reserves' => 125.0,
        'poverty' => 8.4,
        'price_cv' => 6.2,
        'pou' => 5.1,
        'female_school' => 8.9,
        'no_water' => 4.2,
        'pph' => 87.5,
        'stunting' => 11.5,
        'ikp' => 82.50,
        'rank' => 15,
        'komposit' => 5,
        'keterangan' => 'Desa mandiri pangan',
    ]);

    $createResponse->assertRedirect();
    $this->assertDatabaseHas('fsvas', [
        'tahun' => $testYear,
        'kecamatan' => $testKecamatan,
        'desa' => $testDesa,
        'komposit' => 5,
        'rank' => 15,
    ]);

    $record = Fsva::where('tahun', $testYear)->where('desa', $testDesa)->firstOrFail();

    // 2. Update
    $updateResponse = $this->actingAs($user)->put("/fsva-admin/{$record->id}", [
        'komposit' => 6,
        'ikp' => 91.00,
        'rank' => 3,
        'ncpr' => 1.65,
        'energy' => 2300,
        'protein' => 74,
        'food_reserves' => 200,
        'poverty' => 4.5,
        'price_cv' => 4.1,
        'pou' => 3.0,
        'female_school' => 10.5,
        'no_water' => 2.0,
        'pph' => 94.0,
        'stunting' => 6.0,
        'keterangan' => 'Desa sangat tahan pangan',
    ]);

    $updateResponse->assertRedirect();
    $this->assertDatabaseHas('fsvas', [
        'id' => $record->id,
        'komposit' => 6,
        'ikp' => 91.00,
        'rank' => 3,
    ]);

    // 3. Delete
    $deleteResponse = $this->actingAs($user)->delete("/fsva-admin/{$record->id}");
    $deleteResponse->assertRedirect();
    $this->assertDatabaseMissing('fsvas', [
        'id' => $record->id,
    ]);
});

test('authenticated user can bulk store fsva records via copy paste', function () {
    $user = User::factory()->create();

    $testYear = 2036;
    Fsva::where('tahun', $testYear)->delete();

    $response = $this->actingAs($user)->post('/fsva-admin/bulk', [
        'year' => $testYear,
        'items' => [
            [
                'kecamatan' => 'HAURGEULIS',
                'desa' => 'HAURKOLOT',
                'ncpr' => 1.25,
                'energy' => 2100,
                'protein' => 65,
                'food_reserves' => 80,
                'poverty' => 9.5,
                'price_cv' => 6.5,
                'pou' => 6.0,
                'female_school' => 8.5,
                'no_water' => 5.5,
                'pph' => 84.0,
                'stunting' => 13.0,
                'ikp' => 78.50,
                'rank' => 60,
                'komposit' => 4,
                'keterangan' => 'Desa binaan ketahanan pangan',
            ],
            [
                'kecamatan' => 'HAURGEULIS',
                'desa' => 'SUKAJATI',
                'ncpr' => 1.45,
                'energy' => 2250,
                'protein' => 71,
                'food_reserves' => 140,
                'poverty' => 6.2,
                'price_cv' => 5.1,
                'pou' => 4.2,
                'female_school' => 9.4,
                'no_water' => 3.1,
                'pph' => 89.0,
                'stunting' => 8.8,
                'ikp' => 86.00,
                'rank' => 22,
                'komposit' => 5,
                'keterangan' => 'Lumbung padi produktif',
            ],
        ],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('fsvas', [
        'tahun' => $testYear,
        'desa' => 'HAURKOLOT',
        'komposit' => 4,
    ]);
    $this->assertDatabaseHas('fsvas', [
        'tahun' => $testYear,
        'desa' => 'SUKAJATI',
        'komposit' => 5,
    ]);
});

test('authenticated user can download excel template and export fsva data', function () {
    $user = User::factory()->create();

    $templateRes = $this->actingAs($user)->get('/fsva-admin/template?year=2026&format=xlsx');
    $templateRes->assertOk();
    $templateRes->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    $exportRes = $this->actingAs($user)->get('/fsva-admin/export?year=2026');
    $exportRes->assertOk();
    $exportRes->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

