<?php

namespace App\Http\Controllers;

use App\Models\ProducerCommodity;
use App\Models\ProducerHap;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProducerCommodityController extends Controller
{
    /**
     * Display a listing of producer commodities with management controls.
     */
    public function index(Request $request): Response
    {
        $today = now()->format('Y-m-d');

        $search = (string) $request->query('search', '');
        $categoryFilter = (string) $request->query('category', '');
        $statusFilter = (string) $request->query('status', 'all');

        $commodities = ProducerCommodity::with([
            'haps' => fn ($query) => $query->where('effective_date', '<=', $today)->orderByDesc('effective_date')->orderByDesc('id'),
        ])
            ->withCount(['haps as all_haps_count'])
            ->orderBy('order')
            ->get();

        $categories = ProducerCommodity::distinct()->pluck('category')->filter()->values();

        $rows = $commodities->map(function (ProducerCommodity $commodity) use ($today): array {
            $currentHap = $commodity->hapAt($today);

            return [
                'id' => $commodity->id,
                'name' => $commodity->name,
                'slug' => $commodity->slug,
                'key' => $commodity->key,
                'category' => $commodity->category,
                'unit' => $commodity->unit,
                'description' => $commodity->description,
                'image' => $commodity->image,
                'image_url' => $commodity->image_url,
                'is_active' => (bool) $commodity->is_active,
                'order' => (int) $commodity->order,
                'current_hap' => $currentHap ? [
                    'id' => $currentHap->id,
                    'price' => (float) $currentHap->price,
                    'effective_date' => $currentHap->effective_date->format('Y-m-d'),
                    'source_regulation' => $currentHap->source_regulation,
                ] : null,
                'haps_count' => (int) $commodity->all_haps_count,
            ];
        });

        // Statistics
        $totalCount = $rows->count();
        $activeCount = $rows->where('is_active', true)->count();
        $inactiveCount = $rows->where('is_active', false)->count();

        // Filters
        $filteredRows = $rows->filter(function (array $item) use ($search, $categoryFilter, $statusFilter): bool {
            if ($search !== '' && ! str_contains(strtolower($item['name']), strtolower($search)) && ! str_contains(strtolower($item['key']), strtolower($search))) {
                return false;
            }
            if ($categoryFilter !== '' && $item['category'] !== $categoryFilter) {
                return false;
            }
            if ($statusFilter === 'active' && ! $item['is_active']) {
                return false;
            }
            if ($statusFilter === 'inactive' && $item['is_active']) {
                return false;
            }

            return true;
        })->values();

        return Inertia::render('producer-commodities/index', [
            'commodities' => $filteredRows,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category' => $categoryFilter,
                'status' => $statusFilter,
            ],
            'statistics' => [
                'total_commodities' => $totalCount,
                'active_count' => $activeCount,
                'inactive_count' => $inactiveCount,
                'total_categories' => $categories->count(),
            ],
        ]);
    }

    /**
     * Store a newly created producer commodity in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'key' => ['nullable', 'string', 'max:100', 'unique:producer_commodities,key'],
            'category' => ['required', 'string', 'max:100'],
            'unit' => ['required', 'string', 'max:50'],
            'order' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'max:2048'],
            'initial_hap_price' => ['nullable', 'numeric', 'min:0'],
            'initial_hap_regulation' => ['nullable', 'string', 'max:255'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (ProducerCommodity::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $key = ! empty($validated['key'])
            ? Str::slug($validated['key'], '_')
            : Str::slug($validated['name'], '_');

        $counterKey = 1;
        $baseKey = $key;
        while (ProducerCommodity::where('key', $key)->exists()) {
            $key = "{$baseKey}_{$counterKey}";
            $counterKey++;
        }

        $order = isset($validated['order']) && $validated['order'] !== null && $validated['order'] !== ''
            ? (int) $validated['order']
            : (ProducerCommodity::max('order') ?? 0) + 1;

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('producer-commodities', 'public');
        }

        $commodity = ProducerCommodity::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'key' => $key,
            'category' => $validated['category'],
            'unit' => $validated['unit'],
            'image' => $imagePath,
            'order' => $order,
            'is_active' => $validated['is_active'] ?? true,
            'description' => $validated['description'] ?? null,
        ]);

        // If initial HAP was provided
        if (! empty($validated['initial_hap_price'])) {
            ProducerHap::create([
                'producer_commodity_id' => $commodity->id,
                'price' => $validated['initial_hap_price'],
                'effective_date' => now()->format('Y-m-d'),
                'source_regulation' => $validated['initial_hap_regulation'] ?? 'Penetapan Awal',
                'notes' => 'HAP acuan awal saat pembuatan komoditas produsen',
                'created_by' => $request->user()?->id,
            ]);
        }

        return back()->with('success', "Komoditas produsen '{$commodity->name}' berhasil ditambahkan.");
    }

    /**
     * Update the specified producer commodity in storage.
     */
    public function update(Request $request, ProducerCommodity $producerCommodity): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'unit' => ['required', 'string', 'max:50'],
            'order' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        if ($producerCommodity->name !== $validated['name']) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (ProducerCommodity::where('slug', $slug)->where('id', '!=', $producerCommodity->id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $producerCommodity->slug = $slug;
        }

        if ($request->boolean('remove_image')) {
            if ($producerCommodity->image && Storage::disk('public')->exists($producerCommodity->image)) {
                Storage::disk('public')->delete($producerCommodity->image);
            }
            $producerCommodity->image = null;
        } elseif ($request->hasFile('image')) {
            if ($producerCommodity->image && Storage::disk('public')->exists($producerCommodity->image)) {
                Storage::disk('public')->delete($producerCommodity->image);
            }
            $producerCommodity->image = $request->file('image')->store('producer-commodities', 'public');
        }

        $producerCommodity->name = $validated['name'];
        $producerCommodity->category = $validated['category'];
        $producerCommodity->unit = $validated['unit'];
        $producerCommodity->order = isset($validated['order']) ? (int) $validated['order'] : $producerCommodity->order;
        $producerCommodity->is_active = (bool) ($validated['is_active'] ?? $producerCommodity->is_active);
        $producerCommodity->description = $validated['description'] ?? null;
        $producerCommodity->save();

        return back()->with('success', "Data komoditas produsen '{$producerCommodity->name}' berhasil diperbarui.");
    }

    /**
     * Remove the specified producer commodity from storage.
     */
    public function destroy(ProducerCommodity $producerCommodity): RedirectResponse
    {
        $name = $producerCommodity->name;

        if ($producerCommodity->image && Storage::disk('public')->exists($producerCommodity->image)) {
            Storage::disk('public')->delete($producerCommodity->image);
        }

        $producerCommodity->delete();

        return back()->with('success', "Komoditas produsen '{$name}' berhasil dihapus.");
    }

    /**
     * Upload or update photo for a specific producer commodity.
     */
    public function updatePhoto(Request $request, ProducerCommodity $producerCommodity): RedirectResponse
    {
        $request->validate([
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:3072'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('remove_image')) {
            if ($producerCommodity->image && Storage::disk('public')->exists($producerCommodity->image)) {
                Storage::disk('public')->delete($producerCommodity->image);
            }
            $producerCommodity->image = null;
            $producerCommodity->save();

            return back()->with('success', "Foto komoditas '{$producerCommodity->name}' berhasil dihapus.");
        }

        if ($request->hasFile('image')) {
            if ($producerCommodity->image && Storage::disk('public')->exists($producerCommodity->image)) {
                Storage::disk('public')->delete($producerCommodity->image);
            }
            $producerCommodity->image = $request->file('image')->store('producer-commodities', 'public');
            $producerCommodity->save();

            return back()->with('success', "Foto komoditas '{$producerCommodity->name}' berhasil diunggah.");
        }

        return back()->with('info', 'Tidak ada berkas foto yang dipilih.');
    }
}

