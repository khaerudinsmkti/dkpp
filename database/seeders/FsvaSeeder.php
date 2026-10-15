<?php

namespace Database\Seeders;

use App\Models\Fsva;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FsvaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $allVillages = Fsva::getAllVillages();
        $year = 2026;

        // Certain regions with higher risk (coastal tidal flood, drought-prone)
        $highRiskKec = ['CANTIGI', 'KRANGKENG', 'LOSARANG', 'PASEKAN', 'KANDANGHAUR', 'GANTAR', 'KROYA'];
        $mediumRiskKec = ['ARAHAN', 'BONGAS', 'SUKRA', 'TRISI', 'TERISI', 'CIKEDUNG', 'LELEA', 'PATROL'];

        $firstUser = \App\Models\User::first();
        $userId = $firstUser?->id;

        $records = [];
        $now = now();

        foreach ($allVillages as $idx => $item) {
            $kec = $item['kecamatan'];
            $desa = $item['desa'];

            // Deterministic hash based on name to get consistent, realistic numbers
            $hash = crc32($kec . '_' . $desa);
            $mod100 = abs($hash) % 100;

            if (in_array($kec, $highRiskKec, true)) {
                if ($mod100 < 25) {
                    $komposit = 1; // Prioritas 1 (Sangat Rentan)
                } elseif ($mod100 < 60) {
                    $komposit = 2; // Prioritas 2 (Rentan)
                } elseif ($mod100 < 85) {
                    $komposit = 3; // Prioritas 3 (Agak Rentan)
                } else {
                    $komposit = 4; // Prioritas 4 (Agak Tahan)
                }
            } elseif (in_array($kec, $mediumRiskKec, true)) {
                if ($mod100 < 15) {
                    $komposit = 2; // Prioritas 2 (Rentan)
                } elseif ($mod100 < 45) {
                    $komposit = 3; // Prioritas 3 (Agak Rentan)
                } elseif ($mod100 < 80) {
                    $komposit = 4; // Prioritas 4 (Agak Tahan)
                } else {
                    $komposit = 5; // Prioritas 5 (Tahan)
                }
            } else {
                // Favorable rice-producing regions
                if ($mod100 < 10) {
                    $komposit = 3; // Prioritas 3 (Agak Rentan)
                } elseif ($mod100 < 40) {
                    $komposit = 4; // Prioritas 4 (Agak Tahan)
                } elseif ($mod100 < 80) {
                    $komposit = 5; // Prioritas 5 (Tahan)
                } else {
                    $komposit = 6; // Prioritas 6 (Sangat Tahan)
                }
            }

            // Derive indicators realistically based on komposit
            $baseIkp = match ($komposit) {
                1 => 52.0 + ($mod100 % 10),
                2 => 62.0 + ($mod100 % 8),
                3 => 70.0 + ($mod100 % 7),
                4 => 77.0 + ($mod100 % 6),
                5 => 83.0 + ($mod100 % 6),
                6 => 89.0 + ($mod100 % 6),
            };

            $ncpr = round(match ($komposit) {
                1 => 0.70 + (($mod100 % 20) / 100),
                2 => 0.85 + (($mod100 % 20) / 100),
                3 => 1.00 + (($mod100 % 20) / 100),
                4 => 1.20 + (($mod100 % 25) / 100),
                5 => 1.45 + (($mod100 % 30) / 100),
                6 => 1.70 + (($mod100 % 35) / 100),
            }, 2);

            $energy = round(match ($komposit) {
                1 => 1850 + ($mod100 % 100),
                2 => 1950 + ($mod100 % 100),
                3 => 2050 + ($mod100 % 100),
                4 => 2150 + ($mod100 % 100),
                5 => 2250 + ($mod100 % 100),
                6 => 2350 + ($mod100 % 100),
            }, 1);

            $protein = round(match ($komposit) {
                1 => 52.0 + (($mod100 % 50) / 10),
                2 => 57.0 + (($mod100 % 50) / 10),
                3 => 62.0 + (($mod100 % 50) / 10),
                4 => 66.0 + (($mod100 % 50) / 10),
                5 => 70.0 + (($mod100 % 50) / 10),
                6 => 75.0 + (($mod100 % 50) / 10),
            }, 1);

            $foodReserves = round(match ($komposit) {
                1 => 15.0 + ($mod100 % 20),
                2 => 35.0 + ($mod100 % 30),
                3 => 65.0 + ($mod100 % 40),
                4 => 105.0 + ($mod100 % 50),
                5 => 150.0 + ($mod100 % 60),
                6 => 210.0 + ($mod100 % 80),
            }, 1);

            $poverty = round(match ($komposit) {
                1 => 16.5 + (($mod100 % 60) / 10),
                2 => 13.0 + (($mod100 % 40) / 10),
                3 => 10.5 + (($mod100 % 30) / 10),
                4 => 8.0 + (($mod100 % 25) / 10),
                5 => 6.0 + (($mod100 % 20) / 10),
                6 => 4.5 + (($mod100 % 15) / 10),
            }, 2);

            $priceCv = round(match ($komposit) {
                1 => 13.5 + (($mod100 % 30) / 10),
                2 => 11.0 + (($mod100 % 25) / 10),
                3 => 9.0 + (($mod100 % 20) / 10),
                4 => 7.5 + (($mod100 % 15) / 10),
                5 => 6.0 + (($mod100 % 15) / 10),
                6 => 4.5 + (($mod100 % 10) / 10),
            }, 2);

            $pou = round(match ($komposit) {
                1 => 12.0 + (($mod100 % 30) / 10),
                2 => 9.5 + (($mod100 % 25) / 10),
                3 => 7.5 + (($mod100 % 20) / 10),
                4 => 6.0 + (($mod100 % 15) / 10),
                5 => 4.5 + (($mod100 % 15) / 10),
                6 => 3.0 + (($mod100 % 10) / 10),
            }, 2);

            $femaleSchool = round(match ($komposit) {
                1 => 6.8 + (($mod100 % 15) / 10),
                2 => 7.5 + (($mod100 % 15) / 10),
                3 => 8.1 + (($mod100 % 15) / 10),
                4 => 8.8 + (($mod100 % 15) / 10),
                5 => 9.5 + (($mod100 % 15) / 10),
                6 => 10.2 + (($mod100 % 15) / 10),
            }, 1);

            $noWater = round(match ($komposit) {
                1 => 16.0 + (($mod100 % 50) / 10),
                2 => 12.0 + (($mod100 % 40) / 10),
                3 => 8.5 + (($mod100 % 35) / 10),
                4 => 6.0 + (($mod100 % 25) / 10),
                5 => 4.0 + (($mod100 % 20) / 10),
                6 => 2.0 + (($mod100 % 15) / 10),
            }, 2);

            $pph = round(match ($komposit) {
                1 => 72.0 + (($mod100 % 40) / 10),
                2 => 76.0 + (($mod100 % 40) / 10),
                3 => 81.0 + (($mod100 % 40) / 10),
                4 => 86.0 + (($mod100 % 35) / 10),
                5 => 89.5 + (($mod100 % 30) / 10),
                6 => 93.0 + (($mod100 % 30) / 10),
            }, 1);

            $stunting = round(match ($komposit) {
                1 => 22.0 + (($mod100 % 50) / 10),
                2 => 18.0 + (($mod100 % 40) / 10),
                3 => 15.0 + (($mod100 % 30) / 10),
                4 => 12.0 + (($mod100 % 25) / 10),
                5 => 9.5 + (($mod100 % 20) / 10),
                6 => 6.5 + (($mod100 % 20) / 10),
            }, 2);

            $records[] = [
                'tahun' => $year,
                'kecamatan' => $kec,
                'desa' => $desa,
                'ncpr' => $ncpr,
                'energy' => $energy,
                'protein' => $protein,
                'food_reserves' => $foodReserves,
                'poverty' => $poverty,
                'price_cv' => $priceCv,
                'pou' => $pou,
                'female_school' => $femaleSchool,
                'no_water' => $noWater,
                'pph' => $pph,
                'stunting' => $stunting,
                'ikp' => round($baseIkp, 2),
                'komposit' => $komposit,
                'keterangan' => "Evaluasi FSVA Desa {$desa} Kecamatan {$kec} Tahun {$year}",
                'created_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Sort records by IKP descending to assign rank 1 to 317
        usort($records, fn ($a, $b) => $b['ikp'] <=> $a['ikp']);
        foreach ($records as $i => &$rec) {
            $rec['rank'] = $i + 1;
        }
        unset($rec);

        // Insert in chunks
        DB::table('fsvas')->where('tahun', $year)->delete();
        foreach (array_chunk($records, 100) as $chunk) {
            DB::table('fsvas')->insert($chunk);
        }
    }
}
