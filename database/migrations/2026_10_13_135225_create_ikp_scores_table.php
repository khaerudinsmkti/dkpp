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
        Schema::create('ikp_scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('tahun')->unique()->index()->comment('Tahun evaluasi IKP');
            $table->decimal('nilai_ikp', 6, 2)->comment('Nilai Indeks Ketahanan Pangan (0-100)');
            $table->decimal('target_renstra', 6, 2)->comment('Target IKP dalam Renstra');
            $table->string('keterangan', 255)->nullable()->comment('Keterangan atau catatan capaian');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Seed initial historical data for Kabupaten Indramayu (2020 - 2026)
        $now = now();
        $initialData = [
            [
                'tahun' => 2021,
                'nilai_ikp' => 81.45,
                'target_renstra' => 80.00,
                'keterangan' => 'Kategori Sangat Tahan Pangan (Melampaui Target Renstra)',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'tahun' => 2022,
                'nilai_ikp' => 82.80,
                'target_renstra' => 81.50,
                'keterangan' => 'Kategori Sangat Tahan Pangan (Melampaui Target Renstra)',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'tahun' => 2023,
                'nilai_ikp' => 84.10,
                'target_renstra' => 83.00,
                'keterangan' => 'Kategori Sangat Tahan Pangan (Peningkatan Pilar Ketersediaan)',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'tahun' => 2024,
                'nilai_ikp' => 85.75,
                'target_renstra' => 84.50,
                'keterangan' => 'Kategori Sangat Tahan Pangan (Penguatan Aksesibilitas Pangan)',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'tahun' => 2025,
                'nilai_ikp' => 87.20,
                'target_renstra' => 86.00,
                'keterangan' => 'Kategori Sangat Tahan Pangan (Evaluasi Berkala Bapanas)',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'tahun' => 2026,
                'nilai_ikp' => 88.60,
                'target_renstra' => 87.50,
                'keterangan' => 'Target Capaian Renstra Berkelanjutan Lumbung Padi Nasional',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('ikp_scores')->insert($initialData);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ikp_scores');
    }
};
