<?php

namespace App\Http\Controllers;

use App\Models\FoodBalanceCommodity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FoodBalanceCommodityController extends Controller
{
    /**
     * Display a listing of food balance commodities.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', 'all');

        $query = FoodBalanceCommodity::withCount('balances')->orderBy('order')->orderBy('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('unit', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $commodities = $query->get()->map(function (FoodBalanceCommodity $item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'unit' => $item->unit,
                'order' => $item->order,
                'is_active' => $item->is_active,
                'description' => $item->description,
                'balances_count' => $item->balances_count,
            ];
        });

        $allCommodities = FoodBalanceCommodity::all();

        return Inertia::render('food-balance-commodities/index', [
            'commodities' => $commodities,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'statistics' => [
                'total_commodities' => $allCommodities->count(),
                'active_count' => $allCommodities->where('is_active', true)->count(),
                'inactive_count' => $allCommodities->where('is_active', false)->count(),
            ],
        ]);
    }

    /**
     * Store a newly created commodity in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:50'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (FoodBalanceCommodity::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $order = isset($validated['order']) && $validated['order'] !== '' 
            ? (int) $validated['order'] 
            : (FoodBalanceCommodity::max('order') ?? 0) + 1;

        FoodBalanceCommodity::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'unit' => $validated['unit'],
            'order' => $order,
            'is_active' => $validated['is_active'] ?? true,
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', "Komoditas '{$validated['name']}' berhasil ditambahkan.");
    }

    /**
     * Update the specified commodity in storage.
     */
    public function update(Request $request, FoodBalanceCommodity $foodBalanceCommodity): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:50'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($foodBalanceCommodity->name !== $validated['name']) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (FoodBalanceCommodity::where('slug', $slug)->where('id', '!=', $foodBalanceCommodity->id)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }
            $foodBalanceCommodity->slug = $slug;
        }

        $foodBalanceCommodity->update([
            'name' => $validated['name'],
            'unit' => $validated['unit'],
            'order' => isset($validated['order']) ? (int) $validated['order'] : $foodBalanceCommodity->order,
            'is_active' => $validated['is_active'] ?? $foodBalanceCommodity->is_active,
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', "Komoditas '{$foodBalanceCommodity->name}' berhasil diperbarui.");
    }

    /**
     * Toggle the status of the specified commodity.
     */
    public function toggleStatus(FoodBalanceCommodity $foodBalanceCommodity): RedirectResponse
    {
        $foodBalanceCommodity->update([
            'is_active' => ! $foodBalanceCommodity->is_active,
        ]);

        $statusStr = $foodBalanceCommodity->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Komoditas '{$foodBalanceCommodity->name}' berhasil {$statusStr}.");
    }

    /**
     * Remove the specified commodity from storage.
     */
    public function destroy(FoodBalanceCommodity $foodBalanceCommodity): RedirectResponse
    {
        $name = $foodBalanceCommodity->name;
        $foodBalanceCommodity->delete();

        return back()->with('success', "Komoditas '{$name}' berhasil dihapus.");
    }
}

