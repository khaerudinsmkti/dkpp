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
        Schema::table('pph_scores', function (Blueprint $table) {
            $table->decimal('target_renstra', 6, 2)
                ->default(94.00)
                ->after('skor_pph')
                ->comment('Target Skor PPH RENSTRA');
        });

        // Set realistic historical targets for existing data if available
        $targets = [
            2022 => 90.00,
            2023 => 91.50,
            2024 => 92.50,
            2025 => 93.50,
            2026 => 94.00,
        ];

        foreach ($targets as $tahun => $target) {
            DB::table('pph_scores')
                ->where('tahun', $tahun)
                ->update(['target_renstra' => $target]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pph_scores', function (Blueprint $table) {
            $table->dropColumn('target_renstra');
        });
    }
};
