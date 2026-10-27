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
                'target_renstra' => (float) ($score->target_renstra ?? 94.0),
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
            'latest_target_renstra' => $allScores->isNotEmpty() ? (float) ($allScores->sortByDesc('tahun')->first()->target_renstra ?? 94.0) : 94.0,
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
            'target_renstra' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $score = PphScore::create([
            'tahun' => (int) $validated['tahun'],
            'skor_pph' => round((float) $validated['skor_pph'], 2),
            'target_renstra' => isset($validated['target_renstra']) && $validated['target_renstra'] !== ''
                ? round((float) $validated['target_renstra'], 2)
                : 94.00,
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
            'target_renstra' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $oldYear = $pphScore->tahun;
        $newYear = (int) $validated['tahun'];

        $pphScore->update([
            'tahun' => $newYear,
            'skor_pph' => round((float) $validated['skor_pph'], 2),
            'target_renstra' => isset($validated['target_renstra']) && $validated['target_renstra'] !== ''
                ? round((float) $validated['target_renstra'], 2)
                : 94.00,
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
     * Display the public PPH dashboard page.
     */
    public function publicIndex(Request $request): Response
    {
        // 1. Available years (ensure current year is always available and set as default)
        $currentYear = (int) now()->year;
        $yearsFromScores = PphScore::pluck('tahun')->map(fn ($y) => (int) $y);
        $yearsFromDetails = PphScoreDetail::distinct()->pluck('tahun')->map(fn ($y) => (int) $y);
        $availableYears = $yearsFromScores
            ->concat($yearsFromDetails)
            ->push($currentYear)
            ->unique()
            ->sortDesc()
            ->values()
            ->all();

        $defaultYear = $currentYear;
        $selectedYear = (int) $request->query('year', $defaultYear);

        if (! in_array($selectedYear, $availableYears, true)) {
            $selectedYear = $defaultYear;
        }

        // 2. Multi-year scores for trend chart (ascending)
        $rawScores = PphScore::orderBy('tahun', 'asc')->get();
        $yearlyScores = [];
        $prevScoreVal = null;

        foreach ($rawScores as $s) {
            $scoreVal = (float) $s->skor_pph;
            $diff = $prevScoreVal !== null ? round($scoreVal - $prevScoreVal, 2) : 0;
            $diffPercentage = ($prevScoreVal !== null && $prevScoreVal > 0) ? round(($diff / $prevScoreVal) * 100, 2) : 0;

            $status = 'Kurang';
            if ($scoreVal >= 90) {
                $status = 'Sangat Baik';
            } elseif ($scoreVal >= 80) {
                $status = 'Baik';
            } elseif ($scoreVal >= 70) {
                $status = 'Sedang';
            }

            $yearlyScores[] = [
                'id' => $s->id,
                'tahun' => (int) $s->tahun,
                'skor_pph' => $scoreVal,
                'target_ideal' => 100.0,
                'target_renstra' => (float) ($s->target_renstra ?? 94.0),
                'keterangan' => $s->keterangan,
                'status' => $status,
                'diff_previous' => $diff,
                'diff_percentage' => $diffPercentage,
            ];

            $prevScoreVal = $scoreVal;
        }

        // 3. Commodity details for all available years (enables instant client comparison)
        $foodGroups = PphFoodGroup::where('is_active', true)->orderBy('order')->get();
        $allDetailsByYear = PphScoreDetail::all()->groupBy('tahun');

        $allYearCommodities = [];
        $allYearTotals = [];

        foreach ($availableYears as $yr) {
            $yrDetails = $allDetailsByYear->get($yr, collect())->keyBy('pph_food_group_id');
            $yrCommodityDetails = $foodGroups->map(function (PphFoodGroup $group) use ($yrDetails): array {
                $detail = $yrDetails->get($group->id);
                $bobot = $detail ? (float) $detail->bobot : (float) $group->bobot;
                $skorMaksimal = $detail ? (float) $detail->skor_maksimal : (float) $group->skor_maksimal;
                $energi = $detail ? (float) $detail->energi : 0;
                $akePercentage = $detail ? (float) $detail->ake_percentage : 0;
                $skorRiil = $detail ? (float) $detail->skor_riil : 0;
                $skorPph = $detail ? (float) $detail->skor_pph : 0;
                $capaianPercentage = $skorMaksimal > 0 ? round(($skorPph / $skorMaksimal) * 100, 1) : 0;

                return [
                    'id' => $detail?->id,
                    'pph_food_group_id' => $group->id,
                    'food_group_name' => $group->name,
                    'food_group_slug' => $group->slug,
                    'food_group_order' => (int) $group->order,
                    'food_group_description' => $group->description,
                    'food_group_image' => $group->image,
                    'food_group_image_url' => $group->image_url,
                    'energi' => $energi,
                    'ake_percentage' => $akePercentage,
                    'bobot' => $bobot,
                    'skor_riil' => $skorRiil,
                    'skor_pph' => $skorPph,
                    'skor_maksimal' => $skorMaksimal,
                    'capaian_percentage' => $capaianPercentage,
                    'keterangan' => $detail?->keterangan,
                    'is_recorded' => $detail !== null,
                ];
            });

            $recordedCommodities = $yrCommodityDetails->filter(fn (array $i) => $i['is_recorded']);
            $totSkor = round($recordedCommodities->sum('skor_pph'), 2);
            $parent = PphScore::where('tahun', $yr)->first();
            if ($parent && $parent->skor_pph > 0 && $totSkor === 0.0) {
                $totSkor = (float) $parent->skor_pph;
            }

            $allYearCommodities[$yr] = $yrCommodityDetails->values()->all();
            $allYearTotals[$yr] = [
                'total_energi' => round($recordedCommodities->sum('energi'), 2),
                'total_ake' => round($recordedCommodities->sum('ake_percentage'), 2),
                'total_bobot' => round($yrCommodityDetails->sum('bobot'), 2),
                'total_skor_riil' => round($recordedCommodities->sum('skor_riil'), 2),
                'total_skor_maksimal' => round($yrCommodityDetails->sum('skor_maksimal'), 2),
                'total_skor_pph' => $totSkor,
            ];
        }

        // 4. Totals for selected year
        $commodityDetails = collect($allYearCommodities[$selectedYear] ?? []);
        $totals = $allYearTotals[$selectedYear] ?? [
            'total_energi' => 0,
            'total_ake' => 0,
            'total_bobot' => 0,
            'total_skor_riil' => 0,
            'total_skor_maksimal' => 0,
            'total_skor_pph' => 0,
        ];

        // Previous year score for comparison
        $prevYearScore = PphScore::where('tahun', '<', $selectedYear)->orderByDesc('tahun')->first();
        $diffFromPrevYear = $prevYearScore ? round($totals['total_skor_pph'] - (float) $prevYearScore->skor_pph, 2) : 0;
        $diffPercentageFromPrevYear = ($prevYearScore && $prevYearScore->skor_pph > 0)
            ? round(($diffFromPrevYear / (float) $prevYearScore->skor_pph) * 100, 2)
            : 0;

        $scoreStatus = 'Kurang';
        if ($totals['total_skor_pph'] >= 90) {
            $scoreStatus = 'Sangat Baik (Mutu Gizi Prima)';
        } elseif ($totals['total_skor_pph'] >= 80) {
            $scoreStatus = 'Baik (Pangan Beragam & Bergizi)';
        } elseif ($totals['total_skor_pph'] >= 70) {
            $scoreStatus = 'Sedang (Perlu Peningkatan Diversifikasi)';
        }

        $parentScore = PphScore::where('tahun', $selectedYear)->first();

        $statistics = [
            'selected_year' => $selectedYear,
            'current_score' => $totals['total_skor_pph'],
            'prev_score' => $prevYearScore ? (float) $prevYearScore->skor_pph : null,
            'prev_year' => $prevYearScore ? (int) $prevYearScore->tahun : null,
            'diff_score' => $diffFromPrevYear,
            'diff_percentage' => $diffPercentageFromPrevYear,
            'status' => $scoreStatus,
            'achieved_count' => $commodityDetails->filter(fn ($c) => $c['skor_pph'] >= $c['skor_maksimal'] && $c['skor_maksimal'] > 0)->count(),
            'total_groups' => $foodGroups->count(),
            'standard_ake' => 2100,
            'ideal_score' => 100.0,
            'target_renstra' => $parentScore ? (float) ($parentScore->target_renstra ?? 94.0) : 94.0,
        ];

        $reqCompare = (int) $request->query('compare');
        $initialCompareYear = ($reqCompare && in_array($reqCompare, $availableYears, true) && $reqCompare !== $selectedYear)
            ? $reqCompare
            : null;

        return Inertia::render('pph', [
            'yearlyScores' => $yearlyScores,
            'selectedYear' => $selectedYear,
            'availableYears' => $availableYears,
            'commodityDetails' => $commodityDetails->values(),
            'totals' => $totals,
            'allYearCommodities' => $allYearCommodities,
            'allYearTotals' => $allYearTotals,
            'initialCompareYear' => $initialCompareYear,
            'statistics' => $statistics,
        ]);
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
