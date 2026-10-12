<?php

namespace App\Http\Controllers;

use App\Models\PphFoodGroup;
use App\Models\PphScore;
use App\Models\PphScoreDetail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PphScoreController extends Controller
{
    /**
     * Display a listing of PPH scores.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');

        $query = PphScore::withCount('details')
            ->with('creator:id,name')
            ->orderByDesc('tahun');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('tahun', 'like', "%{$search}%")
                    ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        $scores = $query->get()->map(function (PphScore $score): array {
            return [
                'id' => $score->id,
                'tahun' => (int) $score->tahun,
                'skor_pph' => (float) $score->skor_pph,
                'keterangan' => $score->keterangan,
                'details_count' => (int) $score->details_count,
                'creator_name' => $score->creator?->name,
                'created_at' => $score->created_at?->format('d/m/Y H:i'),
                'updated_at' => $score->updated_at?->format('d/m/Y H:i'),
            ];
        });

        $allScores = PphScore::all();
        $totalFoodGroups = PphFoodGroup::where('is_active', true)->count();

        $statistics = [
            'total_years' => $allScores->count(),
            'avg_score' => $allScores->isNotEmpty() ? round((float) $allScores->avg('skor_pph'), 2) : 0,
            'max_score' => $allScores->isNotEmpty() ? round((float) $allScores->max('skor_pph'), 2) : 0,
            'min_score' => $allScores->isNotEmpty() ? round((float) $allScores->min('skor_pph'), 2) : 0,
            'latest_year' => $allScores->max('tahun') ?? now()->year,
            'total_food_groups' => $totalFoodGroups,
        ];

        return Inertia::render('pph-scores/index', [
            'scores' => $scores,
            'filters' => [
                'search' => $search,
            ],
            'statistics' => $statistics,
        ]);
    }

    /**
     * Store a newly created PPH score in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun' => ['required', 'integer', 'min:2000', 'max:2100', 'unique:pph_scores,tahun'],
            'skor_pph' => ['required', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $score = PphScore::create([
            'tahun' => (int) $validated['tahun'],
            'skor_pph' => round((float) $validated['skor_pph'], 2),
            'keterangan' => $validated['keterangan'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', "Data Skor PPH Tahun {$score->tahun} berhasil ditambahkan.");
    }

    /**
     * Update the specified PPH score in storage.
     */
    public function update(Request $request, PphScore $pphScore): RedirectResponse
    {
        $validated = $request->validate([
            'tahun' => ['required', 'integer', 'min:2000', 'max:2100', 'unique:pph_scores,tahun,'.$pphScore->id],
            'skor_pph' => ['required', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $oldYear = $pphScore->tahun;
        $newYear = (int) $validated['tahun'];

        $pphScore->update([
            'tahun' => $newYear,
            'skor_pph' => round((float) $validated['skor_pph'], 2),
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        // If year changed, sync year in details
        if ($oldYear !== $newYear) {
            PphScoreDetail::where('pph_score_id', $pphScore->id)->orWhere('tahun', $oldYear)->update([
                'tahun' => $newYear,
                'pph_score_id' => $pphScore->id,
            ]);
        }

        return back()->with('success', "Data Skor PPH Tahun {$pphScore->tahun} berhasil diperbarui.");
    }

    /**
     * Recalculate PPH score from details.
     */
    public function recalculate(PphScore $pphScore): RedirectResponse
    {
        $newScore = $pphScore->recalculateFromDetails();

        return back()->with('success', "Skor PPH Tahun {$pphScore->tahun} berhasil dihitung ulang dari data detail: {$newScore}");
    }

    /**
     * Remove the specified PPH score from storage.
     */
    public function destroy(PphScore $pphScore): RedirectResponse
    {
        $year = $pphScore->tahun;
        // Also remove details for this year
        PphScoreDetail::where('tahun', $year)->delete();
        $pphScore->delete();

        return back()->with('success', "Data Skor PPH Tahun {$year} dan detailnya berhasil dihapus.");
    }
}
