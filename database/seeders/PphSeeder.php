<?php

namespace Database\Seeders;

use App\Models\PphFoodGroup;
use App\Models\PphScore;
use App\Models\PphScoreDetail;
use Illuminate\Database\Seeder;

class PphSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $groups = PphFoodGroup::orderBy('order')->get();

        if ($groups->isEmpty()) {
            return;
        }

        // Data realistik contoh PPH Kabupaten Indramayu 2025 (Standar AKE 2100 kkal)
        $sample2025 = [
            'padi-padian' => ['energi' => 1250.0, 'ake' => 59.52, 'keterangan' => 'Konsumsi padi-padian tinggi'],
            'umbi-umbian' => ['energi' => 75.0, 'ake' => 3.57, 'keterangan' => 'Diversifikasi umbi baik'],
            'pangan-hewani' => ['energi' => 245.0, 'ake' => 11.67, 'keterangan' => 'Konsumsi ikan dan unggas'],
            'minyak-dan-lemak' => ['energi' => 210.0, 'ake' => 10.00, 'keterangan' => 'Minyak goreng'],
            'buah-biji-berminyak' => ['energi' => 45.0, 'ake' => 2.14, 'keterangan' => 'Kelapa dan santan'],
            'kacang-kacangan' => ['energi' => 115.0, 'ake' => 5.48, 'keterangan' => 'Tahu dan tempe'],
            'gula' => ['energi' => 68.0, 'ake' => 3.24, 'keterangan' => 'Gula pasir'],
            'sayuran-dan-buah' => ['energi' => 125.0, 'ake' => 5.95, 'keterangan' => 'Sayuran lokal dan buah'],
            'lain-lain' => ['energi' => 15.0, 'ake' => 0.71, 'keterangan' => 'Bumbu dan rempah'],
        ];

        $score2025 = PphScore::firstOrCreate(
            ['tahun' => 2025],
            ['skor_pph' => 0, 'keterangan' => 'Pola Pangan Harapan Kabupaten Indramayu Tahun 2025']
        );

        $totalScore2025 = 0;
        foreach ($groups as $group) {
            $data = $sample2025[$group->slug] ?? ['energi' => 100, 'ake' => 5.0, 'keterangan' => null];
            $bobot = (float) $group->bobot;
            $skorMaksimal = (float) $group->skor_maksimal;
            $skorRiil = round($data['ake'] * $bobot, 2);
            $skorPph = min($skorRiil, $skorMaksimal);
            $totalScore2025 += $skorPph;

            PphScoreDetail::updateOrCreate(
                ['tahun' => 2025, 'pph_food_group_id' => $group->id],
                [
                    'pph_score_id' => $score2025->id,
                    'energi' => $data['energi'],
                    'ake_percentage' => $data['ake'],
                    'bobot' => $bobot,
                    'skor_riil' => $skorRiil,
                    'skor_pph' => $skorPph,
                    'skor_maksimal' => $skorMaksimal,
                    'keterangan' => $data['keterangan'],
                ]
            );
        }

        $score2025->update(['skor_pph' => round($totalScore2025, 2)]);

        // Sample 2024
        $score2024 = PphScore::firstOrCreate(
            ['tahun' => 2024],
            ['skor_pph' => 88.50, 'keterangan' => 'Pola Pangan Harapan Kabupaten Indramayu Tahun 2024']
        );
    }
}

