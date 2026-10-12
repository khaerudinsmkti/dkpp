<?php

use App\Models\PphFoodGroup;
use App\Models\PphScore;
use App\Models\PphScoreDetail;
use App\Models\User;
use Database\Seeders\PphSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests are redirected to login from pph routes', function () {
    $this->get('/pph-scores')->assertRedirect('/login');
    $this->get('/pph-score-details')->assertRedirect('/login');
    $this->get('/pph-food-groups')->assertRedirect('/login');
});

test('authenticated user can view pph scores index page', function () {
    $this->seed(PphSeeder::class);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/pph-scores');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('pph-scores/index')
        ->has('scores')
        ->has('statistics')
    );
});

test('authenticated user can create, update, and delete a pph score', function () {
    $user = User::factory()->create();

    // Create
    $response = $this->actingAs($user)->post('/pph-scores', [
        'tahun' => 2026,
        'skor_pph' => 89.75,
        'keterangan' => 'Target Skor PPH 2026',
    ]);

    $response->assertSessionHas('success');
    expect(PphScore::where('tahun', 2026)->exists())->toBeTrue();

    $score = PphScore::where('tahun', 2026)->first();
    expect((float) $score->skor_pph)->toBe(89.75);

    // Update
    $response = $this->actingAs($user)->put("/pph-scores/{$score->id}", [
        'tahun' => 2026,
        'skor_pph' => 91.20,
        'keterangan' => 'Revisi Skor PPH 2026',
    ]);

    $response->assertSessionHas('success');
    expect((float) $score->fresh()->skor_pph)->toBe(91.20);

    // Delete
    $response = $this->actingAs($user)->delete("/pph-scores/{$score->id}");
    $response->assertSessionHas('success');
    expect(PphScore::where('tahun', 2026)->exists())->toBeFalse();
});

test('authenticated user can view pph score details page', function () {
    $this->seed(PphSeeder::class);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/pph-score-details?year=2025');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('pph-score-details/index')
        ->has('items')
        ->has('foodGroups')
        ->has('totals')
        ->where('selectedYear', 2025)
    );
});

test('authenticated user can store and bulk store pph score details and auto-sync parent score', function () {
    $user = User::factory()->create();
    $group = PphFoodGroup::firstOrCreate(
        ['slug' => 'padi-padian'],
        [
            'name' => 'Padi-padian',
            'bobot' => 0.5,
            'skor_maksimal' => 25.0,
            'order' => 1,
            'is_active' => true,
        ]
    );

    // Store single detail
    $response = $this->actingAs($user)->post('/pph-score-details', [
        'tahun' => 2027,
        'pph_food_group_id' => $group->id,
        'energi' => 1200,
        'ake_percentage' => 57.14,
        'bobot' => 0.5,
        'skor_riil' => 28.57,
        'skor_pph' => 25.0,
        'skor_maksimal' => 25.0,
        'keterangan' => 'Konsumsi beras',
    ]);

    $response->assertSessionHas('success');
    expect(PphScoreDetail::where('tahun', 2027)->exists())->toBeTrue();

    // Verify parent score auto-synced
    $parentScore = PphScore::where('tahun', 2027)->first();
    expect($parentScore)->not->toBeNull()
        ->and((float) $parentScore->skor_pph)->toBe(25.0);

    // Bulk store
    $group2 = PphFoodGroup::firstOrCreate(
        ['slug' => 'umbi-umbian'],
        [
            'name' => 'Umbi-umbian',
            'bobot' => 0.5,
            'skor_maksimal' => 2.5,
            'order' => 2,
            'is_active' => true,
        ]
    );

    $bulkResponse = $this->actingAs($user)->post('/pph-score-details/bulk', [
        'tahun' => 2027,
        'items' => [
            [
                'pph_food_group_id' => $group->id,
                'energi' => 1200,
                'ake_percentage' => 57.14,
                'bobot' => 0.5,
                'skor_riil' => 28.57,
                'skor_pph' => 25.0,
                'skor_maksimal' => 25.0,
                'keterangan' => null,
            ],
            [
                'pph_food_group_id' => $group2->id,
                'energi' => 100,
                'ake_percentage' => 4.76,
                'bobot' => 0.5,
                'skor_riil' => 2.38,
                'skor_pph' => 2.38,
                'skor_maksimal' => 2.5,
                'keterangan' => null,
            ],
        ],
    ]);

    $bulkResponse->assertSessionHas('success');
    expect((float) $parentScore->fresh()->skor_pph)->toBe(27.38);
});

test('authenticated user can manage dynamic food groups', function () {
    $user = User::factory()->create();

    // Add new group
    $response = $this->actingAs($user)->post('/pph-food-groups', [
        'name' => 'Minuman Bergula Tambahan',
        'bobot' => 0.25,
        'skor_maksimal' => 2.0,
        'order' => 10,
        'is_active' => true,
        'description' => 'Minuman kemasan berpemanis',
    ]);

    $response->assertSessionHas('success');
    $group = PphFoodGroup::where('name', 'Minuman Bergula Tambahan')->first();
    expect($group)->not->toBeNull()
        ->and((float) $group->bobot)->toBe(0.25)
        ->and((float) $group->skor_maksimal)->toBe(2.0)
        ->and($group->is_active)->toBeTrue();

    // Toggle status
    $this->actingAs($user)->post("/pph-food-groups/{$group->id}/toggle")
        ->assertSessionHas('success');
    expect($group->fresh()->is_active)->toBeFalse();

    // Update group
    $this->actingAs($user)->put("/pph-food-groups/{$group->id}", [
        'name' => 'Minuman Bergula Kemasan',
        'bobot' => 0.30,
        'skor_maksimal' => 2.5,
        'order' => 10,
        'is_active' => true,
        'description' => 'Revisi',
    ])->assertSessionHas('success');
    expect($group->fresh()->name)->toBe('Minuman Bergula Kemasan')
        ->and((float) $group->fresh()->bobot)->toBe(0.30);

    // Delete group
    $this->actingAs($user)->delete("/pph-food-groups/{$group->id}")
        ->assertSessionHas('success');
    expect(PphFoodGroup::where('id', $group->id)->exists())->toBeFalse();
});
