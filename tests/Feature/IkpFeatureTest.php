<?php

use App\Models\IkpScore;
use App\Models\User;

test('root URL redirects to ikp as default page', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('ikp'));
});

test('public page for ikp is displayed with hero banner and yearly scores', function () {
    $response = $this->get('/ikp');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('ikp')
        ->has('yearlyScores')
        ->has('summary')
    );
});

test('guests are redirected to login from admin ikp routes', function () {
    $this->get('/ikp-scores')->assertRedirect('/login');
});

test('authenticated user can view ikp scores admin index page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/ikp-scores');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('ikp-scores/index')
        ->has('scores')
        ->has('statistics')
    );
});

test('authenticated user can create, update, and delete an ikp score in admin panel', function () {
    $user = User::factory()->create();

    $testYear = 2035;
    // Ensure clean state for test year
    IkpScore::where('tahun', $testYear)->delete();

    // 1. Create with 5 new fields
    $response = $this->actingAs($user)->post('/ikp-scores', [
        'tahun' => $testYear,
        'nilai_ikp' => 89.50,
        'target_renstra' => 88.00,
        'indeks_ketersediaan' => 93.40,
        'indeks_keterjangkauan' => 86.20,
        'indeks_pemanfaatan' => 87.10,
        'kelompok_ikp' => 'Kelompok 6',
        'status_kerentanan' => 'Sangat Tahan',
        'keterangan' => 'Target Pengujian Otomatis',
    ]);

    $response->assertSessionHas('success');
    expect(IkpScore::where('tahun', $testYear)->exists())->toBeTrue();

    $created = IkpScore::where('tahun', $testYear)->first();
    expect((float) $created->nilai_ikp)->toBe(89.50);
    expect((float) $created->target_renstra)->toBe(88.00);
    expect((float) $created->indeks_ketersediaan)->toBe(93.40);
    expect((float) $created->indeks_keterjangkauan)->toBe(86.20);
    expect((float) $created->indeks_pemanfaatan)->toBe(87.10);
    expect($created->kelompok_ikp)->toBe('Kelompok 6');
    expect($created->status_kerentanan)->toBe('Sangat Tahan');

    // 2. Update
    $response = $this->actingAs($user)->put("/ikp-scores/{$created->id}", [
        'tahun' => $testYear,
        'nilai_ikp' => 90.25,
        'target_renstra' => 88.50,
        'indeks_ketersediaan' => 94.10,
        'indeks_keterjangkauan' => 87.00,
        'indeks_pemanfaatan' => 88.30,
        'kelompok_ikp' => 'Kelompok 6',
        'status_kerentanan' => 'Sangat Tahan',
        'keterangan' => 'Revisi Pengujian Otomatis',
    ]);

    $response->assertSessionHas('success');
    $updated = $created->fresh();
    expect((float) $updated->nilai_ikp)->toBe(90.25);
    expect((float) $updated->target_renstra)->toBe(88.50);
    expect((float) $updated->indeks_ketersediaan)->toBe(94.10);
    expect((float) $updated->indeks_keterjangkauan)->toBe(87.00);
    expect((float) $updated->indeks_pemanfaatan)->toBe(88.30);
    expect($updated->kelompok_ikp)->toBe('Kelompok 6');
    expect($updated->status_kerentanan)->toBe('Sangat Tahan');

    // 3. Delete
    $response = $this->actingAs($user)->delete("/ikp-scores/{$created->id}");
    $response->assertSessionHas('success');
    expect(IkpScore::where('tahun', $testYear)->exists())->toBeFalse();
});
