<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('realisasi_sub_kegiatans')) {
            Schema::create('realisasi_sub_kegiatans', function (Blueprint $table) {
                $table->id();
                $table->unsignedSmallInteger('tahun_anggaran')->index();
                $table->string('urusan', 255)->nullable();
                $table->string('bidang', 255)->nullable();
                $table->string('unit_organisasi', 255)->nullable();
                $table->string('sub_unit_organisasi', 255)->nullable();
                $table->string('program', 500)->nullable();
                $table->text('kegiatan')->nullable();
                $table->string('kode_sub_kegiatan', 100)->index();
                $table->text('nama_sub_kegiatan');
                $table->string('sumber_pendanaan', 255)->nullable();
                $table->string('lokasi', 255)->nullable();
                $table->string('waktu_pelaksanaan', 150)->nullable();
                $table->decimal('total_anggaran', 18, 2)->default(0);
                $table->string('rka_file_path', 255)->nullable();
                $table->timestamps();

                $table->unique(['tahun_anggaran', 'kode_sub_kegiatan'], 'realisasi_sk_tahun_kode_unique');
            });
        }

        if (! Schema::hasTable('realisasi_rekenings')) {
            Schema::create('realisasi_rekenings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('realisasi_sub_kegiatan_id')
                    ->constrained('realisasi_sub_kegiatans')
                    ->cascadeOnDelete();
                $table->string('kode_rekening', 80);
                $table->string('uraian', 500);
                $table->decimal('pagu_anggaran', 18, 2)->default(0);
                $table->unsignedInteger('urutan')->default(1);
                $table->timestamps();

                $table->unique(['realisasi_sub_kegiatan_id', 'kode_rekening'], 'realisasi_rek_sk_kode_unique');
            });
        }

        if (! Schema::hasTable('realisasi_bulanans')) {
            Schema::create('realisasi_bulanans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('realisasi_rekening_id')
                    ->constrained('realisasi_rekenings')
                    ->cascadeOnDelete();
                $table->unsignedTinyInteger('bulan'); // 1..12
                $table->decimal('nominal', 18, 2)->default(0);
                $table->string('catatan', 500)->nullable();
                $table->timestamps();

                $table->unique(['realisasi_rekening_id', 'bulan'], 'realisasi_bln_rek_bulan_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('realisasi_bulanans');
        Schema::dropIfExists('realisasi_rekenings');
        Schema::dropIfExists('realisasi_sub_kegiatans');
    }
};
