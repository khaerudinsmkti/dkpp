<?php

namespace App\Http\Controllers;

use App\Models\IkpScore;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IkpScoreController extends Controller
{
    /**
     * Display the public IKP (Indeks Ketahanan Pangan) page with hero banner & charts.
     */
    public function publicIndex(Request $request): Response
    {
        $allScores = IkpScore::orderBy('tahun', 'asc')->get();

        $yearlyScores = [];
        $prevScore = null;

        foreach ($allScores as $item) {
            $nilai = (float) $item->nilai_ikp;
            $target = (float) $item->target_renstra;
            $diffRenstra = round($nilai - $target, 2);
            $capaianPercent = $target > 0 ? round(($nilai / $target) * 100, 2) : 100;

            $diffPrev = $prevScore !== null ? round($nilai - $prevScore, 2) : 0;
            $diffPrevPercent = ($prevScore !== null && $prevScore > 0)
                ? round(($diffPrev / $prevScore) * 100, 2)
                : 0;

            $status = $item->category;

            $yearlyScores[] = [
                'id' => $item->id,
                'tahun' => (int) $item->tahun,
                'nilai_ikp' => $nilai,
                'target_renstra' => $target,
                'diff_renstra' => $diffRenstra,
                'capaian_percentage' => $capaianPercent,
                'diff_previous' => $diffPrev,
                'diff_percentage' => $diffPrevPercent,
                'status' => $status,
                'is_achieved' => $nilai >= $target,
                'keterangan' => $item->keterangan,
            ];

            $prevScore = $nilai;
        }

        // Summary stats
        $latestRecord = $allScores->last();
        $prevRecord = $allScores->count() > 1 ? $allScores->get($allScores->count() - 2) : null;

        $latestNilai = $latestRecord ? (float) $latestRecord->nilai_ikp : 0;
        $latestTarget = $latestRecord ? (float) $latestRecord->target_renstra : 0;
        $latestDiffRenstra = round($latestNilai - $latestTarget, 2);
        $latestDiffPrev = $prevRecord ? round($latestNilai - (float) $prevRecord->nilai_ikp, 2) : 0;

        $summary = [
            'total_years' => $allScores->count(),
            'latest_year' => $latestRecord ? (int) $latestRecord->tahun : (int) now()->year,
            'latest_nilai_ikp' => $latestNilai,
            'latest_target_renstra' => $latestTarget,
            'latest_status' => $latestRecord ? $latestRecord->category : 'Sangat Tahan',
            'latest_diff_renstra' => $latestDiffRenstra,
            'latest_diff_previous' => $latestDiffPrev,
            'avg_nilai_ikp' => $allScores->isNotEmpty() ? round((float) $allScores->avg('nilai_ikp'), 2) : 0,
            'avg_target_renstra' => $allScores->isNotEmpty() ? round((float) $allScores->avg('target_renstra'), 2) : 0,
            'highest_score' => $allScores->isNotEmpty() ? round((float) $allScores->max('nilai_ikp'), 2) : 0,
            'lowest_score' => $allScores->isNotEmpty() ? round((float) $allScores->min('nilai_ikp'), 2) : 0,
        ];

        return Inertia::render('ikp', [
            'yearlyScores' => $yearlyScores,
            'summary' => $summary,
        ]);
    }

    /**
     * Display a listing of the IKP scores in admin panel.
     */
    public function index(Request $request): Response
    {
        $search = (string) $request->query('search', '');

        $query = IkpScore::with('creator:id,name')
            ->orderByDesc('tahun');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('tahun', 'like', "%{$search}%")
                    ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        $scores = $query->get()->map(function (IkpScore $item): array {
            $nilai = (float) $item->nilai_ikp;
            $target = (float) $item->target_renstra;
            $diff = round($nilai - $target, 2);

            return [
                'id' => $item->id,
                'tahun' => (int) $item->tahun,
                'nilai_ikp' => $nilai,
                'target_renstra' => $target,
                'diff_renstra' => $diff,
                'capaian_percentage' => $target > 0 ? round(($nilai / $target) * 100, 2) : 100,
                'status' => $item->category,
                'is_achieved' => $nilai >= $target,
                'keterangan' => $item->keterangan,
                'creator_name' => $item->creator?->name,
                'created_at' => $item->created_at?->format('d/m/Y H:i'),
                'updated_at' => $item->updated_at?->format('d/m/Y H:i'),
            ];
        });

        $allScores = IkpScore::all();
        $achievedCount = $allScores->filter(fn ($s) => (float) $s->nilai_ikp >= (float) $s->target_renstra)->count();

        $statistics = [
            'total_years' => $allScores->count(),
            'avg_score' => $allScores->isNotEmpty() ? round((float) $allScores->avg('nilai_ikp'), 2) : 0,
            'avg_target' => $allScores->isNotEmpty() ? round((float) $allScores->avg('target_renstra'), 2) : 0,
            'max_score' => $allScores->isNotEmpty() ? round((float) $allScores->max('nilai_ikp'), 2) : 0,
            'min_score' => $allScores->isNotEmpty() ? round((float) $allScores->min('nilai_ikp'), 2) : 0,
            'latest_year' => $allScores->max('tahun') ?? now()->year,
            'latest_nilai_ikp' => $allScores->isNotEmpty() ? (float) ($allScores->sortByDesc('tahun')->first()->nilai_ikp) : 0,
            'latest_target_renstra' => $allScores->isNotEmpty() ? (float) ($allScores->sortByDesc('tahun')->first()->target_renstra) : 0,
            'achieved_count' => $achievedCount,
        ];

        return Inertia::render('ikp-scores/index', [
            'scores' => $scores,
            'filters' => [
                'search' => $search,
            ],
            'statistics' => $statistics,
        ]);
    }

    /**
     * Store a newly created IKP score in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tahun' => ['required', 'integer', 'min:2000', 'max:2100', 'unique:ikp_scores,tahun'],
            'nilai_ikp' => ['required', 'numeric', 'min:0', 'max:100'],
            'target_renstra' => ['required', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $item = IkpScore::create([
            'tahun' => (int) $validated['tahun'],
            'nilai_ikp' => round((float) $validated['nilai_ikp'], 2),
            'target_renstra' => round((float) $validated['target_renstra'], 2),
            'keterangan' => $validated['keterangan'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', "Data IKP Tahun {$item->tahun} berhasil ditambahkan.");
    }

    /**
     * Update the specified IKP score in storage.
     */
    public function update(Request $request, IkpScore $ikpScore): RedirectResponse
    {
        $validated = $request->validate([
            'tahun' => ['required', 'integer', 'min:2000', 'max:2100', 'unique:ikp_scores,tahun,'.$ikpScore->id],
            'nilai_ikp' => ['required', 'numeric', 'min:0', 'max:100'],
            'target_renstra' => ['required', 'numeric', 'min:0', 'max:100'],
            'keterangan' => ['nullable', 'string', 'max:255'],
        ]);

        $ikpScore->update([
            'tahun' => (int) $validated['tahun'],
            'nilai_ikp' => round((float) $validated['nilai_ikp'], 2),
            'target_renstra' => round((float) $validated['target_renstra'], 2),
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        return back()->with('success', "Data IKP Tahun {$ikpScore->tahun} berhasil diperbarui.");
    }

    /**
     * Remove the specified IKP score from storage.
     */
    public function destroy(IkpScore $ikpScore): RedirectResponse
    {
        $tahun = $ikpScore->tahun;
        $ikpScore->delete();

        return back()->with('success', "Data IKP Tahun {$tahun} berhasil dihapus.");
    }
}
