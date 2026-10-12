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

        $yearsData = [
            2022 => [
                'keterangan' => 'Pola Pangan Harapan Kabupaten Indramayu Tahun 2022',
                'details' => [
                    'padi-padian' => ['energi' => 1310.0, 'ake' => 62.38, 'keterangan' => 'Konsumsi padi dominan'],
                    'umbi-umbian' => ['energi' => 55.0, 'ake' => 2.62, 'keterangan' => 'Konsumsi umbi masih terbatas'],
                    'pangan-hewani' => ['energi' => 195.0, 'ake' => 9.29, 'keterangan' => 'Konsumsi ikan dan unggas lokal'],
                    'minyak-dan-lemak' => ['energi' => 195.0, 'ake' => 9.29, 'keterangan' => 'Minyak goreng dan margarin'],
                    'buah-biji-berminyak' => ['energi' => 38.0, 'ake' => 1.81, 'keterangan' => 'Kelapa parut dan santan'],
                    'kacang-kacangan' => ['energi' => 98.0, 'ake' => 4.67, 'keterangan' => 'Konsumsi tahu dan tempe'],
                    'gula' => ['energi' => 60.0, 'ake' => 2.86, 'keterangan' => 'Gula konsumsi harian'],
                    'sayuran-dan-buah' => ['energi' => 95.0, 'ake' => 4.52, 'keterangan' => 'Sayuran daun dan pisang lokal'],
                    'lain-lain' => ['energi' => 14.0, 'ake' => 0.67, 'keterangan' => 'Bumbu dapur dan rempah'],
                ],
            ],
            2023 => [
                'keterangan' => 'Pola Pangan Harapan Kabupaten Indramayu Tahun 2023',
                'details' => [
                    'padi-padian' => ['energi' => 1290.0, 'ake' => 61.43, 'keterangan' => 'Padi-padian masih mendominasi'],
                    'umbi-umbian' => ['energi' => 62.0, 'ake' => 2.95, 'keterangan' => 'Peningkatan konsumsi ubi jalar'],
                    'pangan-hewani' => ['energi' => 210.0, 'ake' => 10.00, 'keterangan' => 'Konsumsi ikan laut meningkat'],
                    'minyak-dan-lemak' => ['energi' => 205.0, 'ake' => 9.76, 'keterangan' => 'Minyak goreng sawit'],
                    'buah-biji-berminyak' => ['energi' => 42.0, 'ake' => 2.00, 'keterangan' => 'Kelapa dan olahan'],
                    'kacang-kacangan' => ['energi' => 106.0, 'ake' => 5.05, 'keterangan' => 'Tahu tempe dan kacang tanah'],
                    'gula' => ['energi' => 64.0, 'ake' => 3.05, 'keterangan' => 'Gula pasir dan aren'],
                    'sayuran-dan-buah' => ['energi' => 108.0, 'ake' => 5.14, 'keterangan' => 'Sayur kangkung, bayam dan mangga'],
                    'lain-lain' => ['energi' => 14.0, 'ake' => 0.67, 'keterangan' => 'Bumbu dan penyedap'],
                ],
            ],
            2024 => [
                'keterangan' => 'Pola Pangan Harapan Kabupaten Indramayu Tahun 2024',
                'details' => [
                    'padi-padian' => ['energi' => 1270.0, 'ake' => 60.48, 'keterangan' => 'Tren diversifikasi mulai terasa'],
                    'umbi-umbian' => ['energi' => 68.0, 'ake' => 3.24, 'keterangan' => 'Singkong dan kentang'],
                    'pangan-hewani' => ['energi' => 228.0, 'ake' => 10.86, 'keterangan' => 'Ikan bandeng, lele, ayam, telur'],
                    'minyak-dan-lemak' => ['energi' => 208.0, 'ake' => 9.90, 'keterangan' => 'Minyak nabati'],
                    'buah-biji-berminyak' => ['energi' => 44.0, 'ake' => 2.10, 'keterangan' => 'Santan dan kelapa'],
                    'kacang-kacangan' => ['energi' => 112.0, 'ake' => 5.33, 'keterangan' => 'Olahan kedelai stabil'],
                    'gula' => ['energi' => 66.0, 'ake' => 3.14, 'keterangan' => 'Gula konsumsi'],
                    'sayuran-dan-buah' => ['energi' => 116.0, 'ake' => 5.52, 'keterangan' => 'Sayuran segar dan buah lokal'],
                    'lain-lain' => ['energi' => 15.0, 'ake' => 0.71, 'keterangan' => 'Rempah dan bumbu'],
                ],
            ],
            2025 => [
                'keterangan' => 'Pola Pangan Harapan Kabupaten Indramayu Tahun 2025',
                'details' => [
                    'padi-padian' => ['energi' => 1250.0, 'ake' => 59.52, 'keterangan' => 'Konsumsi padi-padian terkendali'],
                    'umbi-umbian' => ['energi' => 75.0, 'ake' => 3.57, 'keterangan' => 'Diversifikasi umbi baik'],
                    'pangan-hewani' => ['energi' => 245.0, 'ake' => 11.67, 'keterangan' => 'Konsumsi ikan dan unggas tinggi'],
                    'minyak-dan-lemak' => ['energi' => 210.0, 'ake' => 10.00, 'keterangan' => 'Minyak goreng proporsional'],
                    'buah-biji-berminyak' => ['energi' => 45.0, 'ake' => 2.14, 'keterangan' => 'Kelapa dan santan'],
                    'kacang-kacangan' => ['energi' => 115.0, 'ake' => 5.48, 'keterangan' => 'Tahu dan tempe bergizi'],
                    'gula' => ['energi' => 68.0, 'ake' => 3.24, 'keterangan' => 'Gula pasir terukur'],
                    'sayuran-dan-buah' => ['energi' => 125.0, 'ake' => 5.95, 'keterangan' => 'Sayuran lokal dan buah melimpah'],
                    'lain-lain' => ['energi' => 15.0, 'ake' => 0.71, 'keterangan' => 'Bumbu dan rempah'],
                ],
            ],
            2026 => [
                'keterangan' => 'Pola Pangan Harapan Kabupaten Indramayu Tahun 2026 (Proyeksi Berjalan)',
                'details' => [
                    'padi-padian' => ['energi' => 1235.0, 'ake' => 58.81, 'keterangan' => 'Pola konsumsi semakin seimbang'],
                    'umbi-umbian' => ['energi' => 80.0, 'ake' => 3.81, 'keterangan' => 'Peningkatan olahan singkong & talas'],
                    'pangan-hewani' => ['energi' => 252.0, 'ake' => 12.00, 'keterangan' => 'Capaian hewani maksimal optimal'],
                    'minyak-dan-lemak' => ['energi' => 210.0, 'ake' => 10.00, 'keterangan' => 'Konsumsi minyak stabil'],
                    'buah-biji-berminyak' => ['energi' => 46.0, 'ake' => 2.19, 'keterangan' => 'Kelapa dan biji-bijian'],
                    'kacang-kacangan' => ['energi' => 118.0, 'ake' => 5.62, 'keterangan' => 'Kacang-kacangan optimal'],
                    'gula' => ['energi' => 65.0, 'ake' => 3.10, 'keterangan' => 'Konsumsi gula terkendali'],
                    'sayuran-dan-buah' => ['energi' => 128.0, 'ake' => 6.10, 'keterangan' => 'Konsumsi sayur & buah meningkat'],
                    'lain-lain' => ['energi' => 16.0, 'ake' => 0.76, 'keterangan' => 'Bumbu dapur higienis'],
                ],
            ],
        ];

        foreach ($yearsData as $year => $data) {
            $scoreRecord = PphScore::updateOrCreate(
                ['tahun' => $year],
                ['keterangan' => $data['keterangan']]
            );

            $totalScoreYear = 0;
            foreach ($groups as $group) {
                $detailData = $data['details'][$group->slug] ?? ['energi' => 100, 'ake' => 5.0, 'keterangan' => null];
                $bobot = (float) $group->bobot;
                $skorMaksimal = (float) $group->skor_maksimal;
                $skorRiil = round($detailData['ake'] * $bobot, 2);
                $skorPph = min($skorRiil, $skorMaksimal);
                $totalScoreYear += $skorPph;

                PphScoreDetail::updateOrCreate(
                    ['tahun' => $year, 'pph_food_group_id' => $group->id],
                    [
                        'pph_score_id' => $scoreRecord->id,
                        'energi' => $detailData['energi'],
                        'ake_percentage' => $detailData['ake'],
                        'bobot' => $bobot,
                        'skor_riil' => $skorRiil,
                        'skor_pph' => $skorPph,
                        'skor_maksimal' => $skorMaksimal,
                        'keterangan' => $detailData['keterangan'],
                    ]
                );
            }

            $scoreRecord->update(['skor_pph' => round($totalScoreYear, 2)]);
        }
    }
}

