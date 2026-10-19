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

            // The 11 FSVA indicators are scores from 1 to 6 (Prioritas 1 s/d 6)
            $clamp1to6 = fn ($val) => max(1, min(6, (int) $val));
            $v1 = ($mod100 % 3) - 1; // -1, 0, or 1
            $v2 = (($mod100 * 3) % 3) - 1;
            $v3 = (($mod100 * 7) % 3) - 1;

            $ncpr = $clamp1to6($komposit + $v1);
            $energy = $clamp1to6($komposit + $v2);
            $protein = $clamp1to6($komposit + $v3);
            $foodReserves = $clamp1to6($komposit + $v1);
            $poverty = $clamp1to6($komposit + $v2);
            $priceCv = $clamp1to6($komposit + $v3);
            $pou = $clamp1to6($komposit + $v1);
            $femaleSchool = $clamp1to6($komposit + $v2);
            $noWater = $clamp1to6($komposit + $v3);
            $pph = $clamp1to6($komposit + $v1);
            $stunting = $clamp1to6($komposit + $v2);

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
