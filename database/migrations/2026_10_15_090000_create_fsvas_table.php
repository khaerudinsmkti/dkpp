<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fsvas', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('tahun')->index()->comment('Tahun evaluasi FSVA');
            $table->string('kecamatan', 100)->index()->comment('Nama Kecamatan');
            $table->string('desa', 100)->index()->comment('Nama Desa / Kelurahan');

            // 13 Indikator & Komposit FSVA
            $table->decimal('ncpr', 10, 2)->nullable()->comment('Rasio Konsumsi Kalori terhadap Ketersediaan Bersih (NCPR)');
            $table->decimal('energy', 10, 2)->nullable()->comment('Kecukupan Energi (kkal/kapita/hari)');
            $table->decimal('protein', 10, 2)->nullable()->comment('Kecukupan Protein (g/kapita/hari)');
            $table->decimal('food_reserves', 10, 2)->nullable()->comment('Cadangan Pangan (ton)');
            $table->decimal('poverty', 10, 2)->nullable()->comment('Persentase Penduduk Miskin (%)');
            $table->decimal('price_cv', 10, 2)->nullable()->comment('Variabilitas / Koefisien Variasi Harga Pangan (%)');
            $table->decimal('pou', 10, 2)->nullable()->comment('Prevalensi Ketidakcukupan Pangan / Prevalence of Undernourishment (%)');
            $table->decimal('female_school', 10, 2)->nullable()->comment('Rata-rata Lama Sekolah Perempuan (tahun)');
            $table->decimal('no_water', 10, 2)->nullable()->comment('Persentase Rumah Tangga Tanpa Akses Air Minum Layak (%)');
            $table->decimal('pph', 10, 2)->nullable()->comment('Skor Pola Pangan Harapan (PPH)');
            $table->decimal('stunting', 10, 2)->nullable()->comment('Prevalensi Balita Stunting (%)');
            $table->decimal('ikp', 10, 2)->nullable()->comment('Indeks Ketahanan Pangan (IKP) Desa');
            $table->unsignedSmallInteger('rank')->nullable()->comment('Peringkat Desa (Rank)');
            $table->unsignedTinyInteger('komposit')->default(1)->comment('Prioritas Komposit FSVA (1-6)');

            $table->text('keterangan')->nullable()->comment('Catatan atau keterangan');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['tahun', 'kecamatan', 'desa'], 'fsvas_tahun_kecamatan_desa_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fsvas');
    }
};

