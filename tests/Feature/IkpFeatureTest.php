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

    // 1. Create
    $response = $this->actingAs($user)->post('/ikp-scores', [
        'tahun' => $testYear,
        'nilai_ikp' => 89.50,
        'target_renstra' => 88.00,
        'keterangan' => 'Target Pengujian Otomatis',
    ]);

    $response->assertSessionHas('success');
    expect(IkpScore::where('tahun', $testYear)->exists())->toBeTrue();

    $created = IkpScore::where('tahun', $testYear)->first();
    expect((float) $created->nilai_ikp)->toBe(89.50);
    expect((float) $created->target_renstra)->toBe(88.00);

    // 2. Update
    $response = $this->actingAs($user)->put("/ikp-scores/{$created->id}", [
        'tahun' => $testYear,
        'nilai_ikp' => 90.25,
        'target_renstra' => 88.50,
        'keterangan' => 'Revisi Pengujian Otomatis',
    ]);

    $response->assertSessionHas('success');
    $updated = $created->fresh();
    expect((float) $updated->nilai_ikp)->toBe(90.25);
    expect((float) $updated->target_renstra)->toBe(88.50);

    // 3. Delete
    $response = $this->actingAs($user)->delete("/ikp-scores/{$created->id}");
    $response->assertSessionHas('success');
    expect(IkpScore::where('tahun', $testYear)->exists())->toBeFalse();
});
