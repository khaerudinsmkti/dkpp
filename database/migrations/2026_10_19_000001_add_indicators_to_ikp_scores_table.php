<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ikp_scores', function (Blueprint $table) {
            $table->decimal('indeks_ketersediaan', 6, 2)->nullable()->after('target_renstra')->comment('Indeks Ketersediaan Pangan (Pilar 1)');
            $table->decimal('indeks_keterjangkauan', 6, 2)->nullable()->after('indeks_ketersediaan')->comment('Indeks Keterjangkauan Pangan (Pilar 2)');
            $table->decimal('indeks_pemanfaatan', 6, 2)->nullable()->after('indeks_keterjangkauan')->comment('Indeks Pemanfaatan Pangan (Pilar 3)');
            $table->string('kelompok_ikp', 50)->nullable()->after('indeks_pemanfaatan')->comment('Kelompok IKP (1 - 6)');
            $table->string('status_kerentanan', 50)->nullable()->after('kelompok_ikp')->comment('Status Kerentanan Pangan');
        });

        // Seed realistic historical data for Indramayu (2021 - 2026)
        $updates = [
            2021 => [
                'indeks_ketersediaan' => 86.20,
                'indeks_keterjangkauan' => 78.50,
                'indeks_pemanfaatan' => 79.65,
                'kelompok_ikp' => 'Kelompok 6',
                'status_kerentanan' => 'Sangat Tahan',
            ],
            2022 => [
                'indeks_ketersediaan' => 87.50,
                'indeks_keterjangkauan' => 80.10,
                'indeks_pemanfaatan' => 80.80,
                'kelompok_ikp' => 'Kelompok 6',
                'status_kerentanan' => 'Sangat Tahan',
            ],
            2023 => [
                'indeks_ketersediaan' => 89.10,
                'indeks_keterjangkauan' => 81.20,
                'indeks_pemanfaatan' => 82.00,
                'kelompok_ikp' => 'Kelompok 6',
                'status_kerentanan' => 'Sangat Tahan',
            ],
            2024 => [
                'indeks_ketersediaan' => 90.80,
                'indeks_keterjangkauan' => 82.90,
                'indeks_pemanfaatan' => 83.55,
                'kelompok_ikp' => 'Kelompok 6',
                'status_kerentanan' => 'Sangat Tahan',
            ],
            2025 => [
                'indeks_ketersediaan' => 92.40,
                'indeks_keterjangkauan' => 84.30,
                'indeks_pemanfaatan' => 84.90,
                'kelompok_ikp' => 'Kelompok 6',
                'status_kerentanan' => 'Sangat Tahan',
            ],
            2026 => [
                'indeks_ketersediaan' => 93.80,
                'indeks_keterjangkauan' => 85.60,
                'indeks_pemanfaatan' => 86.40,
                'kelompok_ikp' => 'Kelompok 6',
                'status_kerentanan' => 'Sangat Tahan',
            ],
        ];

        foreach ($updates as $tahun => $data) {
            DB::table('ikp_scores')->where('tahun', $tahun)->update($data);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ikp_scores', function (Blueprint $table) {
            $table->dropColumn([
                'indeks_ketersediaan',
                'indeks_keterjangkauan',
                'indeks_pemanfaatan',
                'kelompok_ikp',
                'status_kerentanan',
            ]);
        });
    }
};

