<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $tarifMatrix = [
            'Zona I' => [
                'Golongan I' => 130000,
                'Golongan II' => 130000,
                'Golongan III' => 140000,
                'Golongan IV' => 150000,
            ],
            'Zona II' => [
                'Golongan I' => 150000,
                'Golongan II' => 150000,
                'Golongan III' => 160000,
                'Golongan IV' => 170000,
            ],
            'Zona III' => [
                'Golongan I' => 190000,
                'Golongan II' => 190000,
                'Golongan III' => 200000,
                'Golongan IV' => 210000,
            ],
        ];

        foreach ($tarifMatrix as $zona => $golonganTarifs) {
            foreach ($golonganTarifs as $golongan => $uangSaku) {
                DB::table('sppd_zonasis')
                    ->where('zona', $zona)
                    ->where('golongan', $golongan)
                    ->update([
                        'uang_saku' => $uangSaku,
                        'updated_at' => $now,
                    ]);
            }
        }
    }

    public function down(): void
    {
        // No destructive rollback needed
    }
};
