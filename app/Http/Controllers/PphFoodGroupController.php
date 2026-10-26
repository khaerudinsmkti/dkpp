<?php

namespace App\Http\Controllers;

use App\Models\PphFoodGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PphFoodGroupController extends Controller
{
    /**
     * Display a listing of PPH food groups.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');
        $status = (string) $request->query('status', 'all');

        $query = PphFoodGroup::withCount('details')->orderBy('order')->orderBy('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $groups = $query->get()->map(function (PphFoodGroup $item): array {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'bobot' => (float) $item->bobot,
                'skor_maksimal' => (float) $item->skor_maksimal,
                'order' => (int) $item->order,
                'is_active' => (bool) $item->is_active,
                'description' => $item->description,
                'image' => $item->image,
                'image_url' => $item->image_url,
                'details_count' => (int) $item->details_count,
                'created_at' => $item->created_at?->format('d/m/Y H:i'),
                'updated_at' => $item->updated_at?->format('d/m/Y H:i'),
            ];
        });

        $allGroups = PphFoodGroup::all();
        $activeGroups = $allGroups->where('is_active', true);

        return Inertia::render('pph-food-groups/index', [
            'groups' => $groups,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'statistics' => [
                'total_groups' => $allGroups->count(),
                'active_count' => $activeGroups->count(),
                'inactive_count' => $allGroups->where('is_active', false)->count(),
                'total_bobot' => round((float) $activeGroups->sum('bobot'), 2),
                'total_skor_maksimal' => round((float) $activeGroups->sum('skor_maksimal'), 2),
            ],
        ]);
    }

    /**
     * Store a newly created food group in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'bobot' => ['required', 'numeric', 'min:0', 'max:100'],
            'skor_maksimal' => ['required', 'numeric', 'min:0', 'max:100'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:3072'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (PphFoodGroup::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $order = isset($validated['order']) && $validated['order'] !== '' && $validated['order'] !== null
            ? (int) $validated['order']
            : (PphFoodGroup::max('order') ?? 0) + 1;

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('pph-food-groups', 'public');
        }

        $group = PphFoodGroup::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'bobot' => round((float) $validated['bobot'], 2),
            'skor_maksimal' => round((float) $validated['skor_maksimal'], 2),
            'order' => $order,
            'is_active' => $validated['is_active'] ?? true,
            'description' => $validated['description'] ?? null,
            'image' => $imagePath,
        ]);

        return back()->with('success', "Kelompok bahan pangan '{$group->name}' berhasil ditambahkan.");
    }

    /**
     * Update the specified food group in storage.
     */
    public function update(Request $request, PphFoodGroup $pphFoodGroup): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'bobot' => ['required', 'numeric', 'min:0', 'max:100'],
            'skor_maksimal' => ['required', 'numeric', 'min:0', 'max:100'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:3072'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        if ($pphFoodGroup->name !== $validated['name']) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (PphFoodGroup::where('slug', $slug)->where('id', '!=', $pphFoodGroup->id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $pphFoodGroup->slug = $slug;
        }

        $order = isset($validated['order']) && $validated['order'] !== '' && $validated['order'] !== null
            ? (int) $validated['order']
            : $pphFoodGroup->order;

        if ($request->boolean('remove_image')) {
            if ($pphFoodGroup->image && Storage::disk('public')->exists($pphFoodGroup->image)) {
                Storage::disk('public')->delete($pphFoodGroup->image);
            }
            $pphFoodGroup->image = null;
        } elseif ($request->hasFile('image')) {
            if ($pphFoodGroup->image && Storage::disk('public')->exists($pphFoodGroup->image)) {
                Storage::disk('public')->delete($pphFoodGroup->image);
            }
            $pphFoodGroup->image = $request->file('image')->store('pph-food-groups', 'public');
        }

        $pphFoodGroup->name = $validated['name'];
        $pphFoodGroup->bobot = round((float) $validated['bobot'], 2);
        $pphFoodGroup->skor_maksimal = round((float) $validated['skor_maksimal'], 2);
        $pphFoodGroup->order = $order;
        $pphFoodGroup->is_active = $validated['is_active'] ?? $pphFoodGroup->is_active;
        $pphFoodGroup->description = $validated['description'] ?? null;
        $pphFoodGroup->save();

        return back()->with('success', "Kelompok bahan pangan '{$pphFoodGroup->name}' berhasil diperbarui.");
    }

    /**
     * Toggle active status of the food group.
     */
    public function toggleStatus(PphFoodGroup $pphFoodGroup): RedirectResponse
    {
        $pphFoodGroup->update([
            'is_active' => ! $pphFoodGroup->is_active,
        ]);

        $statusStr = $pphFoodGroup->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Kelompok '{$pphFoodGroup->name}' berhasil {$statusStr}.");
    }

    /**
     * Remove the specified food group from storage.
     */
    public function destroy(PphFoodGroup $pphFoodGroup): RedirectResponse
    {
        $detailsCount = $pphFoodGroup->details()->count();

        if ($detailsCount > 0) {
            return back()->with('error', "Kelompok '{$pphFoodGroup->name}' tidak dapat dihapus karena sudah memiliki {$detailsCount} data riwayat detail Skor PPH.");
        }

        $name = $pphFoodGroup->name;

        if ($pphFoodGroup->image && Storage::disk('public')->exists($pphFoodGroup->image)) {
            Storage::disk('public')->delete($pphFoodGroup->image);
        }

        $pphFoodGroup->delete();

        return back()->with('success', "Kelompok bahan pangan '{$name}' berhasil dihapus.");
    }
}
