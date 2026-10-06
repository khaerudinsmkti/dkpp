<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommodityRequest;
use App\Http\Requests\UpdateCommodityRequest;
use App\Models\Commodity;
use App\Models\CommodityHet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CommodityController extends Controller
{
    /**
     * Display a listing of commodities with management controls.
     */
    public function index(Request $request): Response
    {
        $today = now()->format('Y-m-d');

        $search = (string) $request->query('search', '');
        $categoryFilter = (string) $request->query('category', '');
        $statusFilter = (string) $request->query('status', 'all');

        $commodities = Commodity::with([
            'hets' => fn ($query) => $query->where('effective_date', '<=', $today)->orderByDesc('effective_date')->orderByDesc('id'),
        ])
            ->withCount(['consumerPrices', 'hets as all_hets_count'])
            ->orderBy('order')
            ->get();

        $categories = Commodity::distinct()->pluck('category')->filter()->values();

        $rows = $commodities->map(function (Commodity $commodity) use ($today): array {
            $currentHet = $commodity->hetAt($today);

            return [
                'id' => $commodity->id,
                'name' => $commodity->name,
                'slug' => $commodity->slug,
                'category' => $commodity->category,
                'unit' => $commodity->unit,
                'description' => $commodity->description,
                'is_active' => (bool) $commodity->is_active,
                'order' => (int) $commodity->order,
                'current_het' => $currentHet ? [
                    'id' => $currentHet->id,
                    'price' => (float) $currentHet->price,
                    'effective_date' => $currentHet->effective_date->format('Y-m-d'),
                    'source_regulation' => $currentHet->source_regulation,
                ] : null,
                'hets_count' => (int) $commodity->all_hets_count,
                'consumer_prices_count' => (int) $commodity->consumer_prices_count,
            ];
        });

        // Statistics
        $totalCount = $rows->count();
        $activeCount = $rows->where('is_active', true)->count();
        $inactiveCount = $rows->where('is_active', false)->count();

        // Filter
        $filteredRows = $rows->filter(function (array $item) use ($search, $categoryFilter, $statusFilter): bool {
            if ($search !== '' && ! str_contains(strtolower($item['name']), strtolower($search)) && ! str_contains(strtolower($item['slug']), strtolower($search))) {
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

        return Inertia::render('commodities/index', [
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
     * Store a newly created commodity in storage.
     */
    public function store(StoreCommodityRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Commodity::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $order = isset($validated['order']) && $validated['order'] !== null && $validated['order'] !== ''
            ? (int) $validated['order']
            : (Commodity::max('order') ?? 0) + 1;

        $commodity = Commodity::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'category' => $validated['category'],
            'unit' => $validated['unit'],
            'order' => $order,
            'is_active' => $validated['is_active'] ?? true,
            'description' => $validated['description'] ?? null,
        ]);

        // If initial HET was provided, create initial HET revision
        if (! empty($validated['initial_het_price'])) {
            CommodityHet::create([
                'commodity_id' => $commodity->id,
                'price' => $validated['initial_het_price'],
                'effective_date' => now()->format('Y-m-d'),
                'source_regulation' => $validated['initial_het_regulation'] ?? 'Penetapan Awal',
                'notes' => 'HET awal saat pembuatan komoditas',
                'created_by' => $request->user()?->id,
            ]);
        }

        return back()->with('success', "Komoditas '{$commodity->name}' berhasil ditambahkan.");
    }

    /**
     * Update the specified commodity in storage.
     */
    public function update(UpdateCommodityRequest $request, Commodity $commodity): RedirectResponse
    {
        $validated = $request->validated();

        if ($commodity->name !== $validated['name']) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Commodity::where('slug', $slug)->where('id', '!=', $commodity->id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $commodity->slug = $slug;
        }

        $commodity->name = $validated['name'];
        $commodity->category = $validated['category'];
        $commodity->unit = $validated['unit'];
        $commodity->order = isset($validated['order']) ? (int) $validated['order'] : $commodity->order;
        $commodity->is_active = (bool) ($validated['is_active'] ?? $commodity->is_active);
        $commodity->description = $validated['description'] ?? null;
        $commodity->save();

        return back()->with('success', "Data komoditas '{$commodity->name}' berhasil diperbarui.");
    }

    /**
     * Remove the specified commodity from storage.
     */
    public function destroy(Commodity $commodity): RedirectResponse
    {
        $name = $commodity->name;
        $commodity->delete();

        return back()->with('success', "Komoditas '{$name}' berhasil dihapus.");
    }
}
