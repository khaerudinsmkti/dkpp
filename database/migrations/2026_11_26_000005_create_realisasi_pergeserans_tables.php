<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('realisasi_rekenings', function (Blueprint $table): void {
            $table->decimal('pagu_murni', 18, 2)->nullable()->after('pagu_anggaran');
        });

        // Kunci pagu awal yang sudah ada sebagai pagu_murni
        DB::statement('UPDATE realisasi_rekenings SET pagu_murni = pagu_anggaran WHERE pagu_murni IS NULL');

        Schema::create('realisasi_pergeserans', function (Blueprint $table): void {
            $table->id();
            $table->unsignedSmallInteger('tahun_anggaran')->index();
            $table->string('nama_tahap', 150);
            $table->string('jenis', 30)->default('pergeseran_manual'); // pergeseran_manual | rka_perubahan_pdf
            $table->date('tanggal');
            $table->string('nomor_dokumen', 150)->nullable();
            $table->text('keterangan')->nullable();
            $table->decimal('total_sebelum', 18, 2)->default(0);
            $table->decimal('total_sesudah', 18, 2)->default(0);
            $table->decimal('total_selisih', 18, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('realisasi_pergeseran_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('realisasi_pergeseran_id')
                ->constrained('realisasi_pergeserans')
                ->cascadeOnDelete();
            $table->foreignId('realisasi_sub_kegiatan_id')
                ->constrained('realisasi_sub_kegiatans')
                ->cascadeOnDelete();
            $table->foreignId('realisasi_rekening_id')
                ->nullable()
                ->constrained('realisasi_rekenings')
                ->nullOnDelete();
            $table->string('kode_sub_kegiatan', 100);
            $table->string('nama_sub_kegiatan', 500);
            $table->string('kode_rekening', 80);
            $table->string('uraian', 500);
            $table->decimal('pagu_sebelum', 18, 2)->default(0);
            $table->decimal('pagu_sesudah', 18, 2)->default(0);
            $table->decimal('selisih', 18, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('realisasi_pergeseran_items');
        Schema::dropIfExists('realisasi_pergeserans');

        Schema::table('realisasi_rekenings', function (Blueprint $table): void {
            $table->dropColumn('pagu_murni');
        });
    }
};
