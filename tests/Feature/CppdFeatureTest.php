<?php

use App\Models\Cppd;
use App\Models\User;

test('public page for cppd is displayed with summary, available years, and recipient villages', function () {
    $response = $this->get('/cppd');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('cppd')
        ->has('selectedYear')
        ->has('availableYears')
        ->has('summary')
        ->has('recipientVillages')
        ->has('recentTransactions')
        ->has('territory.kecamatanList')
        ->has('territory.desaByKecamatan')
    );
});

test('public page for cppd filters by year properly', function () {
    $response = $this->get('/cppd?year=2025');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('cppd')
        ->where('selectedYear', 2025)
    );
});

test('guests are redirected to login from admin cppd routes', function () {
    $this->get('/cppd-admin')->assertRedirect('/login');
});

test('authenticated user can view cppd admin page with paginated records and summary', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/cppd-admin');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('cppd/index')
        ->has('records.data')
        ->has('summary')
        ->has('selectedYear')
        ->has('availableYears')
        ->has('territory.kecamatanList')
        ->has('territory.desaByKecamatan')
    );
});

test('authenticated user can set initial stock for a year', function () {
    $user = User::factory()->create();

    $testYear = 2035;

    $response = $this->actingAs($user)->post('/cppd-admin/initial-stock', [
        'year' => $testYear,
        'amount' => 150000.50,
        'keterangan' => 'Stok awal penetapan cadangan pangan 2035',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('cppd_initial_stocks', [
        'year' => $testYear,
        'amount' => 150000.50,
    ]);
});

test('authenticated user can create, update, and delete a cppd transaction', function () {
    $user = User::factory()->create();

    // 1. Create
    $createResponse = $this->actingAs($user)->post('/cppd-admin', [
        'tanggal' => '2026-06-15',
        'status' => 'penyaluran',
        'kecamatan' => 'HAURGEULIS',
        'desa' => 'WANAKAYA',
        'jumlah' => 7500.00,
        'keterangan' => 'Bantuan pasca bencana alam',
    ]);

    $createResponse->assertRedirect();

    $record = Cppd::where('kecamatan', 'HAURGEULIS')
        ->where('desa', 'WANAKAYA')
        ->where('status', 'penyaluran')
        ->where('jumlah', 7500.00)
        ->first();

    expect($record)->not->toBeNull();

    // 2. Update
    $updateResponse = $this->actingAs($user)->put("/cppd-admin/{$record->id}", [
        'tanggal' => '2026-06-16',
        'status' => 'penyaluran',
        'kecamatan' => 'HAURGEULIS',
        'desa' => 'HAURKOLOT',
        'jumlah' => 8000.00,
        'keterangan' => 'Revisi desa penerima bantuan',
    ]);

    $updateResponse->assertRedirect();

    $record->refresh();
    expect($record->desa)->toBe('HAURKOLOT');
    expect((float) $record->jumlah)->toBe(8000.00);

    // 3. Delete
    $deleteResponse = $this->actingAs($user)->delete("/cppd-admin/{$record->id}");
    $deleteResponse->assertRedirect();

    $this->assertDatabaseMissing('cppds', [
        'id' => $record->id,
    ]);
});

test('cppd store validation enforces required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/cppd-admin', [
        'tanggal' => '',
        'status' => 'invalid-status',
        'kecamatan' => '',
        'desa' => '',
        'jumlah' => -50,
    ]);

    $response->assertSessionHasErrors(['tanggal', 'status', 'kecamatan', 'desa', 'jumlah']);
});

test('cppd export excel returns valid xlsx response', function () {
    Cppd::factory()->create([
        'tanggal' => '2026-05-10',
        'status' => 'penyaluran',
        'jumlah' => 5000,
    ]);

    $response = $this->get('/cppd/export-excel?year=2026');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect($response->headers->get('Content-Disposition'))->toContain('Riwayat_Transaksi_CPPD_Indramayu_2026.xlsx');
});
