<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommodityHetRequest;
use App\Http\Requests\UpdateCommodityHetRequest;
use App\Models\Commodity;
use App\Models\CommodityHet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommodityHetController extends Controller
{
    /**
     * Display a listing of commodities and their dynamic HET configurations and histories.
     */
    public function index(Request $request): Response
    {
        $today = now()->format('Y-m-d');

        $commodities = Commodity::where('is_active', true)
            ->with([
                'hets' => fn ($query) => $query->with('creator:id,name')->orderByDesc('effective_date')->orderByDesc('id'),
            ])
            ->orderBy('order')
            ->get();

        $search = (string) $request->query('search', '');
        $categoryFilter = (string) $request->query('category', '');

        $data = $commodities->map(function (Commodity $commodity) use ($today): array {
            $currentHet = $commodity->hetAt($today);

            return [
                'id' => $commodity->id,
                'name' => $commodity->name,
                'slug' => $commodity->slug,
                'category' => $commodity->category,
                'unit' => $commodity->unit,
                'order' => $commodity->order,
                'current_het' => $currentHet ? [
                    'id' => $currentHet->id,
                    'price' => (float) $currentHet->price,
                    'effective_date' => $currentHet->effective_date->format('Y-m-d'),
                    'source_regulation' => $currentHet->source_regulation,
                    'notes' => $currentHet->notes,
                ] : null,
                'revisions_count' => $commodity->hets->count(),
                'histories' => $commodity->hets->map(fn (CommodityHet $het): array => [
                    'id' => $het->id,
                    'price' => (float) $het->price,
                    'effective_date' => $het->effective_date->format('Y-m-d'),
                    'source_regulation' => $het->source_regulation,
                    'notes' => $het->notes,
                    'creator' => $het->creator?->name,
                    'is_current' => $currentHet?->id === $het->id,
                    'created_at' => $het->created_at?->format('d/m/Y H:i'),
                ]),
            ];
        });

        $categories = $commodities->pluck('category')->unique()->values();

        $filteredData = $data->filter(function (array $item) use ($search, $categoryFilter): bool {
            if ($search !== '' && ! str_contains(strtolower($item['name']), strtolower($search))) {
                return false;
            }
            if ($categoryFilter !== '' && $item['category'] !== $categoryFilter) {
                return false;
            }

            return true;
        })->values();

        return Inertia::render('hets/index', [
            'commodities' => $filteredData,
            'allCommodities' => $commodities->map(fn (Commodity $c): array => [
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
                'configured_count' => $data->filter(fn (array $item): bool => $item['current_het'] !== null)->count(),
                'total_revisions' => $data->sum('revisions_count'),
            ],
        ]);
    }

    /**
     * Store a newly created HET configuration in storage.
     */
    public function store(StoreCommodityHetRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()?->id;

        CommodityHet::create($validated);

        return back()->with('success', 'HET baru berhasil ditambahkan.');
    }

    /**
     * Update the specified HET record in storage.
     */
    public function update(UpdateCommodityHetRequest $request, CommodityHet $het): RedirectResponse
    {
        $het->update($request->validated());

        return back()->with('success', 'Perubahan HET berhasil disimpan.');
    }

    /**
     * Remove the specified HET record from storage.
     */
    public function destroy(CommodityHet $het): RedirectResponse
    {
        $het->delete();

        return back()->with('success', 'Riwayat HET berhasil dihapus.');
    }
}
