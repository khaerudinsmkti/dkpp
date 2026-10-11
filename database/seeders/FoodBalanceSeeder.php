<?php

namespace Database\Seeders;

use App\Models\FoodBalance;
use App\Models\FoodBalanceCommodity;
use Illuminate\Database\Seeder;

class FoodBalanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $commodities = FoodBalanceCommodity::all()->keyBy('name');
        if ($commodities->isEmpty()) {
            return;
        }

        // Years to seed: 2025 and 2026
        $years = [2025, 2026];

        // Base profile per commodity for a monthly scale in Indramayu (Ton)
        $profiles = [
            'Beras' => ['prod' => 65000, 'ket' => 68000, 'kbt' => 19500, 'seasonal' => 0.25],
            'Gula Pasir' => ['prod' => 120, 'ket' => 1450, 'kbt' => 1350, 'seasonal' => 0.05],
            'Minyak Goreng' => ['prod' => 80, 'ket' => 1950, 'kbt' => 1800, 'seasonal' => 0.05],
            'Daging Sapi' => ['prod' => 95, 'ket' => 160, 'kbt' => 150, 'seasonal' => 0.20],
            'Daging Ayam Ras' => ['prod' => 850, 'ket' => 920, 'kbt' => 860, 'seasonal' => 0.10],
            'Telur Ayam Ras' => ['prod' => 620, 'ket' => 780, 'kbt' => 740, 'seasonal' => 0.08],
            'Bawang Merah' => ['prod' => 1100, 'ket' => 1150, 'kbt' => 820, 'seasonal' => 0.30],
            'Bawang Putih' => ['prod' => 10, 'ket' => 450, 'kbt' => 480, 'seasonal' => 0.05],
            'Jagung' => ['prod' => 3200, 'ket' => 3400, 'kbt' => 2100, 'seasonal' => 0.15],
            'Cabai Besar' => ['prod' => 520, 'ket' => 560, 'kbt' => 510, 'seasonal' => 0.25],
            'Cabai Rawit' => ['prod' => 480, 'ket' => 510, 'kbt' => 490, 'seasonal' => 0.25],
        ];

        $userId = \App\Models\User::first()?->id;

        foreach ($years as $year) {
            for ($month = 1; $month <= 12; $month++) {
                $periodDate = sprintf('%04d-%02d-01', $year, $month);

                // For each month, seed with realistic variations
                foreach ($commodities as $name => $comm) {
                    $profile = $profiles[$name] ?? ['prod' => 500, 'ket' => 600, 'kbt' => 550, 'seasonal' => 0.1];

                    // Seasonal fluctuation factor based on month
                    $sinFactor = sin(($month / 12) * 2 * M_PI);
                    $prodVariation = 1 + ($sinFactor * $profile['seasonal']);
                    $kbtVariation = 1 + (cos(($month / 12) * 2 * M_PI) * 0.05);

                    // Add slight variance between 2025 and 2026
                    $yearMultiplier = ($year === 2026) ? 1.03 : 1.0;

                    $produksi = round($profile['prod'] * $prodVariation * $yearMultiplier, 2);
                    $ketersediaan = round($profile['ket'] * $prodVariation * $yearMultiplier, 2);
                    $kebutuhan = round($profile['kbt'] * $kbtVariation * $yearMultiplier, 2);
                    $selisih = round($ketersediaan - $kebutuhan, 2);
                    $keterangan = $selisih >= 0 ? 'Surplus' : 'Defisit';

                    FoodBalance::updateOrCreate(
                        [
                            'food_balance_commodity_id' => $comm->id,
                            'year' => $year,
                            'month' => $month,
                        ],
                        [
                            'period_date' => $periodDate,
                            'produksi' => $produksi,
                            'ketersediaan' => $ketersediaan,
                            'kebutuhan' => $kebutuhan,
                            'selisih' => $selisih,
                            'keterangan' => $keterangan,
                            'notes' => $selisih < 0 ? 'Perlu pemantauan pasokan dari distributor antar daerah.' : 'Pasokan aman terkendali.',
                            'created_by' => $userId,
                        ]
                    );
                }
            }
        }
    }
}
