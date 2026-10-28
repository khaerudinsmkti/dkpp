<?php

namespace App\Http\Controllers;

use App\Models\PphFoodGroup;
use App\Models\PphScore;
use App\Models\PphScoreDetail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PphScoreDetailController extends Controller
{
    /**
     * Display a listing of PPH score details for a specific year.
     */
    public function index(Request $request): Response
    {
        // Available recorded years
        $yearsFromScores = PphScore::pluck('tahun');
        $yearsFromDetails = PphScoreDetail::distinct()->pluck('tahun');
        $availableYears = $yearsFromScores->concat($yearsFromDetails)->unique()->sortDesc()->values()->all();

        if (empty($availableYears)) {
            $availableYears = [now()->year];
        }

        $defaultYear = $availableYears[0];
        $selectedYear = (int) $request->query('year', $defaultYear);

        if (! in_array($selectedYear, $availableYears, true)) {
            // Keep user selected year even if not in DB yet
            if ($selectedYear < 2000 || $selectedYear > 2100) {
                $selectedYear = $defaultYear;
            }
        }

        // Get all active food groups ordered by order
        $foodGroups = PphFoodGroup::orderBy('order')->get();

        // Get existing details for selected year
        $details = PphScoreDetail::where('tahun', $selectedYear)
            ->with('foodGroup')
            ->get()
            ->keyBy('pph_food_group_id');

        // Build composite rows: ensuring all active food groups are represented
        $items = $foodGroups->map(function (PphFoodGroup $group) use ($details, $selectedYear): array {
            $detail = $details->get($group->id);

            return [
                'id' => $detail?->id,
                'pph_food_group_id' => $group->id,
                'tahun' => $selectedYear,
                'food_group_name' => $group->name,
                'food_group_slug' => $group->slug,
                'food_group_order' => (int) $group->order,
                'food_group_is_active' => (bool) $group->is_active,
                'food_group_description' => $group->description,
                'food_group_image' => $group->image,
                'food_group_image_url' => $group->image_url,
                'energi' => $detail ? (float) $detail->energi : 0,
                'ake_percentage' => $detail ? (float) $detail->ake_percentage : 0,
                'bobot' => $detail ? (float) $detail->bobot : (float) $group->bobot,
                'skor_riil' => $detail ? (float) $detail->skor_riil : 0,
                'skor_pph' => $detail ? (float) $detail->skor_pph : 0,
                'skor_maksimal' => $detail ? (float) $detail->skor_maksimal : (float) $group->skor_maksimal,
                'keterangan' => $detail?->keterangan,
                'is_recorded' => $detail !== null,
                'created_at' => $detail?->created_at?->format('d/m/Y H:i'),
                'updated_at' => $detail?->updated_at?->format('d/m/Y H:i'),
            ];
        });

        // Totals for this year
        $recordedItems = $items->filter(fn (array $i) => $i['is_recorded']);
        $totalEnergi = round($recordedItems->sum('energi'), 2);
        $totalAke = round($recordedItems->sum('ake_percentage'), 2);
        $totalBobot = round($items->sum('bobot'), 2);
        $totalSkorRiil = round($recordedItems->sum('skor_riil'), 2);
        $totalSkorPph = round($recordedItems->sum('skor_pph'), 2);
        $totalSkorMaksimal = round($items->sum('skor_maksimal'), 2);

        // Find parent PphScore for this year
        $parentScore = PphScore::where('tahun', $selectedYear)->first();

        return Inertia::render('pph-score-details/index', [
            'items' => $items->values(),
            'foodGroups' => $foodGroups->map(fn (PphFoodGroup $g): array => [
                'id' => $g->id,
                'name' => $g->name,
                'slug' => $g->slug,
                'bobot' => (float) $g->bobot,
                'skor_maksimal' => (float) $g->skor_maksimal,
                'is_active' => (bool) $g->is_active,
                'image_url' => $g->image_url,
            ]),
            'selectedYear' => $selectedYear,
            'availableYears' => $availableYears,
            'totals' => [
                'total_energi' => $totalEnergi,
                'total_ake' => $totalAke,
                'total_bobot' => $totalBobot,
                'total_skor_riil' => $totalSkorRiil,
                'total_skor_pph' => $totalSkorPph,
                'total_skor_maksimal' => $totalSkorMaksimal,
                'recorded_count' => $recordedItems->count(),
                'total_groups' => $foodGroups->count(),
            ],
            'parentScore' => $parentScore ? [
                'id' => $parentScore->id,
                'tahun' => (int) $parentScore->tahun,
                'skor_pph' => (float) $parentScore->skor_pph,
                'keterangan' => $parentScore->keterangan,
            ] : null,
        ]);
    }

    /**
     * Store a single PPH score detail row in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun' => ['required', 'integer', 'min:2000', 'max:2100'],
            'pph_food_group_id' => ['required', 'exists:pph_food_groups,id'],
            'energi' => ['required', 'numeric', 'min:0'],
            'ake_percentage' => ['required', 'numeric', 'min:0'],
            'bobot' => ['required', 'numeric', 'min:0'],
            'skor_riil' => ['required', 'numeric', 'min:0'],
            'skor_pph' => ['required', 'numeric', 'min:0'],
            'skor_maksimal' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $score = PphScore::firstOrCreate(
            ['tahun' => (int) $validated['tahun']],
            [
                'skor_pph' => 0,
                'keterangan' => "Pola Pangan Harapan Tahun {$validated['tahun']}",
                'created_by' => $request->user()?->id,
            ]
        );

        PphScoreDetail::updateOrCreate(
            [
                'tahun' => (int) $validated['tahun'],
                'pph_food_group_id' => (int) $validated['pph_food_group_id'],
            ],
            [
                'pph_score_id' => $score->id,
                'energi' => round((float) $validated['energi'], 2),
                'ake_percentage' => round((float) $validated['ake_percentage'], 2),
                'bobot' => round((float) $validated['bobot'], 2),
                'skor_riil' => round((float) $validated['skor_riil'], 2),
                'skor_pph' => round((float) $validated['skor_pph'], 2),
                'skor_maksimal' => round((float) $validated['skor_maksimal'], 2),
                'keterangan' => $validated['keterangan'] ?? null,
                'created_by' => $request->user()?->id,
            ]
        );

        // Auto-sync parent score
        $score->recalculateFromDetails();

        $group = PphFoodGroup::find($validated['pph_food_group_id']);

        return back()->with('success', "Detail PPH untuk kelompok '{$group?->name}' tahun {$validated['tahun']} berhasil disimpan.");
    }

    /**
     * Store bulk PPH score details for a specific year.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun' => ['required', 'integer', 'min:2000', 'max:2100'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.pph_food_group_id' => ['required', 'exists:pph_food_groups,id'],
            'items.*.energi' => ['required', 'numeric', 'min:0'],
            'items.*.ake_percentage' => ['required', 'numeric', 'min:0'],
            'items.*.bobot' => ['required', 'numeric', 'min:0'],
            'items.*.skor_riil' => ['required', 'numeric', 'min:0'],
            'items.*.skor_pph' => ['required', 'numeric', 'min:0'],
            'items.*.skor_maksimal' => ['required', 'numeric', 'min:0'],
            'items.*.keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $score = PphScore::firstOrCreate(
            ['tahun' => (int) $validated['tahun']],
            [
                'skor_pph' => 0,
                'keterangan' => "Pola Pangan Harapan Tahun {$validated['tahun']}",
                'created_by' => $request->user()?->id,
            ]
        );

        $totalScore = 0;
        foreach ($validated['items'] as $item) {
            $skorPph = round((float) $item['skor_pph'], 2);
            $totalScore += $skorPph;

            PphScoreDetail::updateOrCreate(
                [
                    'tahun' => (int) $validated['tahun'],
                    'pph_food_group_id' => (int) $item['pph_food_group_id'],
                ],
                [
                    'pph_score_id' => $score->id,
                    'energi' => round((float) $item['energi'], 2),
                    'ake_percentage' => round((float) $item['ake_percentage'], 2),
                    'bobot' => round((float) $item['bobot'], 2),
                    'skor_riil' => round((float) $item['skor_riil'], 2),
                    'skor_pph' => $skorPph,
                    'skor_maksimal' => round((float) $item['skor_maksimal'], 2),
                    'keterangan' => $item['keterangan'] ?? null,
                    'created_by' => $request->user()?->id,
                ]
            );
        }

        $score->update(['skor_pph' => round($totalScore, 2)]);

        return back()->with('success', "Seluruh data Detail Skor PPH Tahun {$validated['tahun']} berhasil disimpan. Total Skor PPH: ".round($totalScore, 2));
    }

    /**
     * Update the specified PPH score detail row in storage.
     */
    public function update(Request $request, PphScoreDetail $pphScoreDetail): RedirectResponse
    {
        $validated = $request->validate([
            'energi' => ['required', 'numeric', 'min:0'],
            'ake_percentage' => ['required', 'numeric', 'min:0'],
            'bobot' => ['required', 'numeric', 'min:0'],
            'skor_riil' => ['required', 'numeric', 'min:0'],
            'skor_pph' => ['required', 'numeric', 'min:0'],
            'skor_maksimal' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $pphScoreDetail->update([
            'energi' => round((float) $validated['energi'], 2),
            'ake_percentage' => round((float) $validated['ake_percentage'], 2),
            'bobot' => round((float) $validated['bobot'], 2),
            'skor_riil' => round((float) $validated['skor_riil'], 2),
            'skor_pph' => round((float) $validated['skor_pph'], 2),
            'skor_maksimal' => round((float) $validated['skor_maksimal'], 2),
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        // Auto sync parent score
        $parentScore = PphScore::where('tahun', $pphScoreDetail->tahun)->first();
        $parentScore?->recalculateFromDetails();

        return back()->with('success', "Data detail {$pphScoreDetail->foodGroup?->name} tahun {$pphScoreDetail->tahun} berhasil diperbarui.");
    }

    /**
     * Remove the specified PPH score detail row from storage.
     */
    public function destroy(PphScoreDetail $pphScoreDetail): RedirectResponse
    {
        $year = $pphScoreDetail->tahun;
        $name = $pphScoreDetail->foodGroup?->name ?? 'Kelompok pangan';

        $pphScoreDetail->delete();

        // Auto sync parent score
        $parentScore = PphScore::where('tahun', $year)->first();
        $parentScore?->recalculateFromDetails();

        return back()->with('success', "Data detail '{$name}' tahun {$year} berhasil dihapus.");
    }
}
