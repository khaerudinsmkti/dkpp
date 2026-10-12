<?php

namespace App\Http\Controllers;

use App\Models\ProducerCommodity;
use App\Models\ProducerHap;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProducerHapController extends Controller
{
    /**
     * Display a listing of producer commodities and their dynamic HAP configurations and histories.
     */
    public function index(Request $request): Response
    {
        $today = now()->format('Y-m-d');

        $commodities = ProducerCommodity::where('is_active', true)
            ->with([
                'haps' => fn ($query) => $query->with('creator:id,name')->orderByDesc('effective_date')->orderByDesc('id'),
            ])
            ->orderBy('order')
            ->get();

        $search = (string) $request->query('search', '');
        $categoryFilter = (string) $request->query('category', '');

        $data = $commodities->map(function (ProducerCommodity $commodity) use ($today): array {
            $currentHap = $commodity->hapAt($today);

            return [
                'id' => $commodity->id,
                'name' => $commodity->name,
                'slug' => $commodity->slug,
                'key' => $commodity->key,
                'category' => $commodity->category,
                'unit' => $commodity->unit,
                'order' => $commodity->order,
                'current_hap' => $currentHap ? [
                    'id' => $currentHap->id,
                    'price' => (float) $currentHap->price,
                    'effective_date' => $currentHap->effective_date->format('Y-m-d'),
                    'source_regulation' => $currentHap->source_regulation,
                    'notes' => $currentHap->notes,
                ] : null,
                'revisions_count' => $commodity->haps->count(),
                'histories' => $commodity->haps->map(fn (ProducerHap $hap): array => [
                    'id' => $hap->id,
                    'price' => (float) $hap->price,
                    'effective_date' => $hap->effective_date->format('Y-m-d'),
                    'source_regulation' => $hap->source_regulation,
                    'notes' => $hap->notes,
                    'creator' => $hap->creator?->name,
                    'is_current' => $currentHap?->id === $hap->id,
                    'created_at' => $hap->created_at?->format('d/m/Y H:i'),
                ]),
            ];
        });

        $categories = $commodities->pluck('category')->unique()->values();

        $filteredData = $data->filter(function (array $item) use ($search, $categoryFilter): bool {
            if ($search !== '' && ! str_contains(strtolower($item['name']), strtolower($search)) && ! str_contains(strtolower($item['key']), strtolower($search))) {
                return false;
            }
            if ($categoryFilter !== '' && $item['category'] !== $categoryFilter) {
                return false;
            }

            return true;
        })->values();

        return Inertia::render('producer-haps/index', [
            'commodities' => $filteredData,
            'allCommodities' => $commodities->map(fn (ProducerCommodity $c): array => [
                'id' => $c->id,
                'name' => $c->name,
                'category' => $c->category,
                'unit' => $c->unit,
            ]),
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category' => $categoryFilter,
            ],
            'statistics' => [
                'total_commodities' => $commodities->count(),
                'configured_count' => $data->filter(fn (array $item): bool => $item['current_hap'] !== null)->count(),
                'total_revisions' => $data->sum('revisions_count'),
            ],
        ]);
    }

    /**
     * Store a newly created HAP configuration in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'producer_commodity_id' => ['required', 'integer', 'exists:producer_commodities,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'effective_date' => ['required', 'date_format:Y-m-d'],
            'source_regulation' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['created_by'] = $request->user()?->id;

        ProducerHap::create($validated);

        return back()->with('success', 'HAP produsen baru berhasil ditambahkan.');
    }

    /**
     * Update the specified HAP record in storage.
     */
    public function update(Request $request, ProducerHap $hap): RedirectResponse
    {
        $validated = $request->validate([
            'price' => ['required', 'numeric', 'min:0'],
            'effective_date' => ['required', 'date_format:Y-m-d'],
            'source_regulation' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $hap->update($validated);

        return back()->with('success', 'Perubahan HAP produsen berhasil disimpan.');
    }

    /**
     * Remove the specified HAP record from storage.
     */
    public function destroy(ProducerHap $hap): RedirectResponse
    {
        $hap->delete();

        return back()->with('success', 'Riwayat HAP produsen berhasil dihapus.');
    }
}
