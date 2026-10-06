<?php

use App\Models\ConsumerPrice;
use App\Models\Market;
use App\Models\User;
use Database\Seeders\MarketSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests cannot access markets page', function () {
    $this->get('/markets')->assertRedirect('/login');
});

test('authenticated user can view markets page with seeded markets and stats', function () {
    $this->seed([MarketSeeder::class]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/markets');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('markets/index')
        ->has('markets', 5)
        ->has('statistics')
        ->where('statistics.total_markets', 5)
        ->where('statistics.active_count', 5)
        ->where('statistics.inactive_count', 0)
    );
});

test('authenticated user can create a new market', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/markets', [
        'name' => 'Pasar Anjatan Baru',
        'location' => 'Kecamatan Anjatan',
        'order' => 6,
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('markets', [
        'name' => 'Pasar Anjatan Baru',
        'location' => 'Kecamatan Anjatan',
        'order' => 6,
        'is_active' => true,
    ]);
});

test('market creation validates required name and unique name', function () {
    $user = User::factory()->create();
    Market::factory()->create(['name' => 'Pasar Bangkir']);

    // Empty name
    $response = $this->actingAs($user)->post('/markets', [
        'name' => '',
    ]);
    $response->assertSessionHasErrors('name');

    // Duplicate name
    $response = $this->actingAs($user)->post('/markets', [
        'name' => 'Pasar Bangkir',
    ]);
    $response->assertSessionHasErrors('name');
});

test('authenticated user can update an existing market', function () {
    $user = User::factory()->create();
    $market = Market::factory()->create([
        'name' => 'Pasar Lama',
        'location' => 'Kecamatan Lama',
        'order' => 1,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->put("/markets/{$market->id}", [
        'name' => 'Pasar Baru Direnovasi',
        'location' => 'Kecamatan Baru',
        'order' => 2,
        'is_active' => false,
    ]);

    $response->assertRedirect();
    $market->refresh();
    expect($market->name)->toBe('Pasar Baru Direnovasi')
        ->and($market->location)->toBe('Kecamatan Baru')
        ->and($market->order)->toBe(2)
        ->and($market->is_active)->toBeFalse();
});

test('authenticated user can toggle active status of a market', function () {
    $user = User::factory()->create();
    $market = Market::factory()->create(['is_active' => true]);

    $this->actingAs($user)->post("/markets/{$market->id}/toggle");
    $market->refresh();
    expect($market->is_active)->toBeFalse();

    $this->actingAs($user)->post("/markets/{$market->id}/toggle");
    $market->refresh();
    expect($market->is_active)->toBeTrue();
});

test('authenticated user can delete a market without price records', function () {
    $user = User::factory()->create();
    $market = Market::factory()->create();

    $response = $this->actingAs($user)->delete("/markets/{$market->id}");

    $response->assertRedirect();
    $this->assertDatabaseMissing('markets', [
        'id' => $market->id,
    ]);
});

test('market with existing consumer prices cannot be deleted directly', function () {
    $user = User::factory()->create();
    $market = Market::factory()->create();
    ConsumerPrice::factory()->create([
        'market_id' => $market->id,
    ]);

    $response = $this->actingAs($user)->delete("/markets/{$market->id}");

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');
    $this->assertDatabaseHas('markets', [
        'id' => $market->id,
    ]);
});

