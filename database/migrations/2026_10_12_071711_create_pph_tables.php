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
        // 1. Kelompok Bahan Pangan (Dinamis / Dapat dikelola)
        Schema::create('pph_food_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('bobot', 5, 2)->default(0);
            $table->decimal('skor_maksimal', 5, 2)->default(0);
            $table->unsignedInteger('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Skor PPH (Tahunan)
        Schema::create('pph_scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('tahun')->unique();
            $table->decimal('skor_pph', 6, 2)->default(0);
            $table->string('keterangan', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('tahun');
        });

        // 3. Detail Skor PPH
        Schema::create('pph_score_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pph_score_id')->nullable()->constrained('pph_scores')->cascadeOnDelete();
            $table->unsignedSmallInteger('tahun');
            $table->foreignId('pph_food_group_id')->constrained('pph_food_groups')->cascadeOnDelete();
            $table->decimal('energi', 10, 2)->default(0)->comment('Energi (Kalori)');
            $table->decimal('ake_percentage', 6, 2)->default(0)->comment('% AKE');
            $table->decimal('bobot', 5, 2)->default(0)->comment('Bobot');
            $table->decimal('skor_riil', 6, 2)->default(0)->comment('Skor Riil');
            $table->decimal('skor_pph', 6, 2)->default(0)->comment('Skor PPH');
            $table->decimal('skor_maksimal', 6, 2)->default(0)->comment('Skor Maksimal');
            $table->string('keterangan', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['tahun', 'pph_food_group_id'], 'pph_detail_tahun_food_group_unique');
            $table->index('tahun');
        });

        // Seed default standard 9 food groups
        $groups = [
            [
                'name' => 'Padi-padian',
                'slug' => 'padi-padian',
                'bobot' => 0.5,
                'skor_maksimal' => 25.0,
                'order' => 1,
                'is_active' => true,
                'description' => 'Beras, jagung, gandum, tepung terigu, dan olahannya',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Umbi-umbian',
                'slug' => 'umbi-umbian',
                'bobot' => 0.5,
                'skor_maksimal' => 2.5,
                'order' => 2,
                'is_active' => true,
                'description' => 'Ubi kayu/singkong, ubi jalar, kentang, talas, sagu',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pangan Hewani',
                'slug' => 'pangan-hewani',
                'bobot' => 2.0,
                'skor_maksimal' => 24.0,
                'order' => 3,
                'is_active' => true,
                'description' => 'Daging sapi, ayam, ikan/seafood, telur, susu, dan olahannya',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Minyak dan Lemak',
                'slug' => 'minyak-dan-lemak',
                'bobot' => 0.5,
                'skor_maksimal' => 5.0,
                'order' => 4,
                'is_active' => true,
                'description' => 'Minyak kelapa, minyak sawit, mentega, margarin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Buah/Biji Berminyak',
                'slug' => 'buah-biji-berminyak',
                'bobot' => 0.5,
                'skor_maksimal' => 1.0,
                'order' => 5,
                'is_active' => true,
                'description' => 'Kelapa, santan, kemiri, kenari, cokelat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Kacang-kacangan',
                'slug' => 'kacang-kacangan',
                'bobot' => 2.0,
                'skor_maksimal' => 10.0,
                'order' => 6,
                'is_active' => true,
                'description' => 'Kedelai, tahu, tempe, kacang tanah, kacang hijau',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Gula',
                'slug' => 'gula',
                'bobot' => 0.5,
                'skor_maksimal' => 2.5,
                'order' => 7,
                'is_active' => true,
                'description' => 'Gula pasir, gula merah, sirup',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sayuran dan Buah',
                'slug' => 'sayuran-dan-buah',
                'bobot' => 5.0,
                'skor_maksimal' => 30.0,
                'order' => 8,
                'is_active' => true,
                'description' => 'Aneka sayuran segar dan buah-buahan lokal',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Lain-lain',
                'slug' => 'lain-lain',
                'bobot' => 0.0,
                'skor_maksimal' => 0.0,
                'order' => 9,
                'is_active' => true,
                'description' => 'Bumbu-bumbuan, rempah, kopi, teh, dan bahan penyegar',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('pph_food_groups')->insert($groups);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pph_score_details');
        Schema::dropIfExists('pph_scores');
        Schema::dropIfExists('pph_food_groups');
    }
};

