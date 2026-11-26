<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('npd_rekenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_kegiatan_id')->constrained('sppd_sub_kegiatans')->cascadeOnDelete();
            $table->unsignedSmallInteger('tahun_anggaran')->default(2026);
            $table->string('nama_program', 255)->nullable();
            $table->string('kode_rekening', 60);
            $table->string('uraian', 255);
            $table->decimal('anggaran', 16, 2)->default(0);
            $table->unsignedSmallInteger('urutan')->default(1);
            $table->timestamps();

            $table->index(['sub_kegiatan_id', 'tahun_anggaran']);
        });

        Schema::create('npds', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_npd', 80)->nullable();
            $table->date('tanggal_npd')->nullable();
            $table->foreignId('sub_kegiatan_id')->constrained('sppd_sub_kegiatans')->cascadeOnDelete();
            $table->unsignedSmallInteger('tahun_anggaran')->default(2026);
            $table->string('nama_program', 255)->nullable();
            $table->foreignId('pptk_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
            $table->foreignId('pengguna_anggaran_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
            $table->decimal('total_anggaran', 16, 2)->default(0);
            $table->decimal('total_akumulasi_sebelumnya', 16, 2)->default(0);
            $table->decimal('total_pencairan_saat_ini', 16, 2)->default(0);
            $table->decimal('total_sisa', 16, 2)->default(0);
            $table->decimal('potongan_ppn', 16, 2)->default(0);
            $table->decimal('potongan_pph21', 16, 2)->default(0);
            $table->decimal('potongan_pph22', 16, 2)->default(0);
            $table->decimal('potongan_pph23', 16, 2)->default(0);
            $table->decimal('potongan_pph4_2', 16, 2)->default(0);
            $table->decimal('total_potongan', 16, 2)->default(0);
            $table->decimal('jumlah_dibayarkan', 16, 2)->default(0);
            $table->json('linked_sppd_dalam_kota_batches')->nullable();
            $table->json('linked_sppd_luar_kota_batches')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['sub_kegiatan_id', 'tahun_anggaran']);
        });

        Schema::create('npd_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('npd_id')->constrained('npds')->cascadeOnDelete();
            $table->foreignId('npd_rekening_id')->nullable()->constrained('npd_rekenings')->nullOnDelete();
            $table->unsignedSmallInteger('urutan')->default(1);
            $table->string('kode_rekening', 60);
            $table->string('uraian', 255);
            $table->decimal('anggaran', 16, 2)->default(0);
            $table->decimal('akumulasi_sebelumnya', 16, 2)->default(0);
            $table->decimal('pencairan_saat_ini', 16, 2)->default(0);
            $table->decimal('sisa', 16, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('npd_items');
        Schema::dropIfExists('npds');
        Schema::dropIfExists('npd_rekenings');
    }
};
