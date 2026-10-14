<?php

use App\Models\Commodity;
use App\Models\CommodityHet;
use App\Models\User;
use Database\Seeders\CommoditySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('guest cannot access commodities page', function () {
    $this->get('/commodities')->assertRedirect('/login');
});

test('authenticated user can view commodities page with seeded items', function () {
    $this->seed(CommoditySeeder::class);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/commodities');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('commodities/index')
        ->has('commodities', 25)
        ->has('statistics')
    );
});

test('authenticated user can add a new commodity with initial HET', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/commodities', [
        'name' => 'Beras Pandan Wangi Super',
        'category' => 'Beras',
        'unit' => 'Kg',
        'order' => 26,
        'is_active' => true,
        'description' => 'Beras wangi organik lokal',
        'initial_het_price' => 16500,
        'initial_het_regulation' => 'Perbadan No. 99/2026',
    ]);

    $response->assertRedirect();

    $commodity = Commodity::where('name', 'Beras Pandan Wangi Super')->first();
    expect($commodity)->not->toBeNull()
        ->and($commodity->slug)->toBe('beras-pandan-wangi-super')
        ->and($commodity->category)->toBe('Beras')
        ->and($commodity->unit)->toBe('Kg')
        ->and($commodity->is_active)->toBeTrue();

    // Check initial HET created
    $het = CommodityHet::where('commodity_id', $commodity->id)->first();
    expect($het)->not->toBeNull()
        ->and((float) $het->price)->toBe(16500.0)
        ->and($het->source_regulation)->toBe('Perbadan No. 99/2026');
});

test('validation prevents duplicate commodity name', function () {
    $commodity = Commodity::factory()->create(['name' => 'Beras Merah Organik']);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/commodities', [
        'name' => 'Beras Merah Organik',
        'category' => 'Beras',
        'unit' => 'Kg',
    ]);

    $response->assertSessionHasErrors(['name']);
});

test('authenticated user can update an existing commodity', function () {
    $commodity = Commodity::factory()->create([
        'name' => 'Kacang Tanah',
        'category' => 'Palawija',
        'unit' => 'Kg',
        'order' => 10,
        'is_active' => true,
    ]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->put("/commodities/{$commodity->id}", [
        'name' => 'Kacang Tanah Kupas',
        'category' => 'Kacang-Kacangan',
        'unit' => 'Kg',
        'order' => 12,
        'is_active' => false,
        'description' => 'Sudah dikupas',
    ]);

    $response->assertRedirect();

    $commodity->refresh();
    expect($commodity->name)->toBe('Kacang Tanah Kupas')
        ->and($commodity->slug)->toBe('kacang-tanah-kupas')
        ->and($commodity->category)->toBe('Kacang-Kacangan')
        ->and($commodity->is_active)->toBeFalse();
});

test('authenticated user can delete a commodity and cascades its hets', function () {
    $commodity = Commodity::factory()->create(['name' => 'Komoditas Mau Dihapus']);
    CommodityHet::factory()->create(['commodity_id' => $commodity->id]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->delete("/commodities/{$commodity->id}");

    $response->assertRedirect();
    $this->assertDatabaseMissing('commodities', ['id' => $commodity->id]);
    $this->assertDatabaseMissing('commodity_hets', ['commodity_id' => $commodity->id]);
});

test('authenticated user can upload an image for commodity and delete it', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $file = UploadedFile::fake()->image('beras.jpg');

    $response = $this->actingAs($user)->post('/commodities', [
        'name' => 'Beras Organik Istimewa',
        'category' => 'Beras',
        'unit' => 'Kg',
        'image' => $file,
    ]);

    $response->assertRedirect();
    $commodity = Commodity::where('name', 'Beras Organik Istimewa')->first();
    expect($commodity)->not->toBeNull()
        ->and($commodity->image)->not->toBeNull();

    Storage::disk('public')->assertExists($commodity->image);

    // Update with new image
    $newFile = UploadedFile::fake()->image('beras-baru.png');
    $oldPath = $commodity->image;

    $this->actingAs($user)->put("/commodities/{$commodity->id}", [
        'name' => 'Beras Organik Istimewa',
        'category' => 'Beras',
        'unit' => 'Kg',
        'image' => $newFile,
    ]);

    $commodity->refresh();
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($commodity->image);

    // Remove image
    $this->actingAs($user)->put("/commodities/{$commodity->id}", [
        'name' => 'Beras Organik Istimewa',
        'category' => 'Beras',
        'unit' => 'Kg',
        'remove_image' => true,
    ]);

    $commodity->refresh();
    expect($commodity->image)->toBeNull();
});

test('authenticated user can update commodity image via post with _method put', function () {
    Storage::fake('public');
    $commodity = Commodity::factory()->create(['name' => 'Beras Pandan Wangi']);
    $user = User::factory()->create();

    $newFile = UploadedFile::fake()->image('beras-baru.jpg');

    $response = $this->actingAs($user)->post("/commodities/{$commodity->id}", [
        '_method' => 'put',
        'name' => 'Beras Pandan Wangi',
        'category' => 'Beras',
        'unit' => 'Kg',
        'order' => 1,
        'is_active' => '1',
        'image' => $newFile,
    ]);

    $response->assertRedirect();
    $commodity->refresh();
    expect($commodity->image)->not->toBeNull();
    Storage::disk('public')->assertExists($commodity->image);
});
