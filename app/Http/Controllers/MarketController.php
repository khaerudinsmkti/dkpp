<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMarketRequest;
use App\Http\Requests\UpdateMarketRequest;
use App\Models\ConsumerPrice;
use App\Models\Market;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MarketController extends Controller
{
    /**
     * Display a listing of markets with management controls.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $statusFilter = (string) $request->query('status', 'all');

        $markets = Market::withCount('consumerPrices')
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $rows = $markets->map(function (Market $market): array {
            return [
                'id' => $market->id,
                'name' => $market->name,
                'location' => $market->location,
                'is_active' => (bool) $market->is_active,
                'order' => (int) $market->order,
                'consumer_prices_count' => (int) $market->consumer_prices_count,
                'created_at' => $market->created_at?->format('d M Y'),
            ];
        });

        // Statistics
        $totalCount = $rows->count();
        $activeCount = $rows->where('is_active', true)->count();
        $inactiveCount = $rows->where('is_active', false)->count();
        $totalRecordedPrices = ConsumerPrice::count();

        // Filters
        $filteredRows = $rows->filter(function (array $item) use ($search, $statusFilter): bool {
            if ($search !== '') {
                $searchLower = strtolower($search);
                $nameMatch = str_contains(strtolower($item['name']), $searchLower);
                $locationMatch = $item['location'] !== null && str_contains(strtolower($item['location']), $searchLower);
                if (! $nameMatch && ! $locationMatch) {
                    return false;
                }
            }

            if ($statusFilter === 'active' && ! $item['is_active']) {
                return false;
            }

            if ($statusFilter === 'inactive' && $item['is_active']) {
                return false;
            }

            return true;
        })->values();

        return Inertia::render('markets/index', [
            'markets' => $filteredRows,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
            ],
            'statistics' => [
                'total_markets' => $totalCount,
                'active_count' => $activeCount,
                'inactive_count' => $inactiveCount,
                'total_recorded_prices' => $totalRecordedPrices,
            ],
        ]);
    }

    /**
     * Store a newly created market in storage.
     */
    public function store(StoreMarketRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $order = isset($validated['order']) && $validated['order'] !== null && $validated['order'] !== ''
            ? (int) $validated['order']
            : (Market::max('order') ?? 0) + 1;

        $market = Market::create([
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'order' => $order,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return back()->with('success', "Pasar '{$market->name}' berhasil ditambahkan.");
    }

    /**
     * Update the specified market in storage.
     */
    public function update(UpdateMarketRequest $request, Market $market): RedirectResponse
    {
        $validated = $request->validated();

        $market->update([
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'order' => isset($validated['order']) ? (int) $validated['order'] : $market->order,
            'is_active' => (bool) ($validated['is_active'] ?? $market->is_active),
        ]);

        return back()->with('success', "Data pasar '{$market->name}' berhasil diperbarui.");
    }

    /**
     * Toggle the active status of a market.
     */
    public function toggleStatus(Market $market): RedirectResponse
    {
        $market->is_active = ! $market->is_active;
        $market->save();

        $statusText = $market->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Pasar '{$market->name}' berhasil {$statusText}.");
    }

    /**
     * Remove the specified market from storage.
     */
    public function destroy(Market $market): RedirectResponse
    {
        $priceCount = $market->consumerPrices()->count();
        if ($priceCount > 0) {
            return back()->withErrors([
                'error' => "Pasar '{$market->name}' tidak dapat dihapus karena memiliki {$priceCount} data pencatatan harga konsumen. Anda dapat menonaktifkan status pasar ini.",
            ]);
        }

        $name = $market->name;
        $market->delete();

        return back()->with('success', "Pasar '{$name}' berhasil dihapus.");
    }
}

