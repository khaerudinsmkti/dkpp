<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('surat_tugas')) {
            Schema::create('surat_tugas', function (Blueprint $table) {
                $table->id();
                $table->string('nomor_spt', 150)->nullable();
                $table->boolean('tanpa_surat')->default(false);
                $table->text('pengirim_surat');
                $table->string('nomor_surat', 150)->nullable();
                $table->date('tanggal_surat')->nullable();
                $table->date('tanggal_spt');
                $table->date('tanggal_berangkat');
                $table->date('tanggal_kembali');
                $table->unsignedInteger('lama_hari')->default(1);
                $table->text('tujuan');
                $table->string('nama_tempat', 255)->nullable();
                $table->string('nama_kecamatan', 150)->nullable();
                $table->text('alamat_lengkap')->nullable();
                $table->string('penandatangan_mode', 20)->default('database');
                $table->foreignId('kepala_dinas_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
                $table->string('ttd_jabatan', 255);
                $table->string('ttd_nama', 255);
                $table->string('ttd_pangkat_gol', 255)->nullable();
                $table->string('ttd_nip', 100)->nullable();
                $table->string('ttd_image_path', 255)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('surat_tugas_participants')) {
            Schema::create('surat_tugas_participants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('surat_tugas_id')->constrained('surat_tugas')->cascadeOnDelete();
                $table->foreignId('pegawai_id')->nullable()->constrained('sppd_pegawais')->nullOnDelete();
                $table->unsignedInteger('urutan')->default(1);
                $table->string('nama', 255);
                $table->string('nip', 100)->nullable();
                $table->string('pangkat', 150)->nullable();
                $table->string('golongan', 50)->nullable();
                $table->string('jabatan', 255)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_tugas_participants');
        Schema::dropIfExists('surat_tugas');
    }
};
