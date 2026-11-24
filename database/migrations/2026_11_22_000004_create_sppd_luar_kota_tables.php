<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sppd_luar_kotas', function (Blueprint $table) {
            $table->id();
            $table->string('batch_code', 60)->index();
            $table->foreignId('sub_kegiatan_id')->nullable()->constrained('sppd_sub_kegiatans')->nullOnDelete();
            $table->foreignId('dpa_id')->nullable()->constrained('sppd_dpas')->nullOnDelete();
            $table->string('pengirim_surat', 255);
            $table->string('nomor_surat', 150)->nullable();
            $table->date('tanggal_surat');
            $table->date('tanggal_berangkat');
            $table->date('tanggal_kembali');
            $table->unsignedInteger('lama_hari')->default(1);
            $table->string('tujuan', 255);
            $table->text('alamat_lengkap');
            $table->string('kab_kota', 150)->nullable();
            $table->text('perihal');
            $table->foreignId('kepala_dinas_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
            $table->foreignId('pptk_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
            $table->foreignId('bendahara_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
            $table->decimal('total_uang_harian', 15, 2)->default(0);
            $table->decimal('total_uang_transport', 15, 2)->default(0);
            $table->decimal('total_biaya', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('sppd_luar_kota_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sppd_luar_kota_id')->constrained('sppd_luar_kotas')->cascadeOnDelete();
            $table->foreignId('pegawai_id')->nullable()->constrained('sppd_pegawais')->nullOnDelete();
            $table->unsignedInteger('urutan')->default(1);
            $table->string('nama');
            $table->string('nip', 40)->nullable();
            $table->string('pangkat', 100)->nullable();
            $table->string('golongan', 50)->nullable();
            $table->string('jabatan', 150)->nullable();
            $table->decimal('uang_harian', 15, 2)->default(0);
            $table->decimal('uang_transport', 15, 2)->default(0);
            $table->decimal('total_biaya', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sppd_luar_kota_participants');
        Schema::dropIfExists('sppd_luar_kotas');
    }
};
