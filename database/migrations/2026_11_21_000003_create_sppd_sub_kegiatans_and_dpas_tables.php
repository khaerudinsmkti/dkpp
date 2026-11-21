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
        // Master Data Sub Kegiatan
        Schema::create('sppd_sub_kegiatans', function (Blueprint $table) {
            $table->id();
            $table->string('no_rekening', 100);
            $table->string('nama_kegiatan', 255);
            $table->string('sub_kegiatan', 255);
            $table->string('kode_sub_kegiatan', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Master Data Nomor DPA
        Schema::create('sppd_dpas', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_dpa', 150);
            $table->date('tanggal_dpa')->nullable();
            $table->unsignedSmallInteger('tahun_anggaran')->default((int) date('Y'));
            $table->string('keterangan', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Tambahkan relasi sub_kegiatan_id dan dpa_id pada sppd_dalam_kotas
        Schema::table('sppd_dalam_kotas', function (Blueprint $table) {
            $table->foreignId('sub_kegiatan_id')
                ->nullable()
                ->after('id')
                ->constrained('sppd_sub_kegiatans')
                ->nullOnDelete();
            $table->foreignId('dpa_id')
                ->nullable()
                ->after('sub_kegiatan_id')
                ->constrained('sppd_dpas')
                ->nullOnDelete();
        });

        $now = now();

        // Seed representative Sub Kegiatan DKPP Indramayu
        DB::table('sppd_sub_kegiatans')->insert([
            [
                'no_rekening' => '5.1.02.04.01.0003',
                'nama_kegiatan' => 'stabilisasi Pasokan dan Harga Pangan Tingkat Konsumen dan Produsen',
                'sub_kegiatan' => 'Pemantauan Stok, Pasokan dan Harga Pangan di Pasar Daerah',
                'kode_sub_kegiatan' => '2.09.03.2.02.0001',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'no_rekening' => '5.1.02.04.01.0003',
                'nama_kegiatan' => 'Penanganan Kerawanan Pangan Kewenangan Kabupaten/Kota',
                'sub_kegiatan' => 'Penyusunan Peta Ketahanan dan Kerentanan Pangan (FSVA) & SKPG',
                'kode_sub_kegiatan' => '2.09.02.2.01.0002',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'no_rekening' => '5.1.02.04.01.0003',
                'nama_kegiatan' => 'Pengadaan, Pengelolaan, dan Penyaluran Cadangan Pangan pada Kerawanan Pangan',
                'sub_kegiatan' => 'Koordinasi dan Evaluasi Pengelolaan Cadangan Pangan Pemerintah Daerah (CPPD)',
                'kode_sub_kegiatan' => '2.09.02.2.03.0001',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'no_rekening' => '5.1.02.04.01.0003',
                'nama_kegiatan' => 'Pemberdayaan Masyarakat dalam Penganekaragaman Konsumsi Pangan Berbasis Sumber Daya Lokal',
                'sub_kegiatan' => 'Koordinasi dan Sinkronisasi Pemantauan Skor Pola Pangan Harapan (PPH)',
                'kode_sub_kegiatan' => '2.09.04.2.01.0003',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Seed representative Nomor DPA DKPP Indramayu
        DB::table('sppd_dpas')->insert([
            [
                'nomor_dpa' => 'DPA/A.1/2.09.3.27.0.00.01.0000/001/2026',
                'tanggal_dpa' => '2026-01-02',
                'tahun_anggaran' => 2026,
                'keterangan' => 'DPA Induk Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu TA 2026',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nomor_dpa' => 'DPPA/A.2/2.09.3.27.0.00.01.0000/001/2026',
                'tanggal_dpa' => '2026-09-15',
                'tahun_anggaran' => 2026,
                'keterangan' => 'DPPA Perubahan Dinas Ketahanan Pangan dan Pertanian Kabupaten Indramayu TA 2026',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sppd_dalam_kotas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sub_kegiatan_id');
            $table->dropConstrainedForeignId('dpa_id');
        });

        Schema::dropIfExists('sppd_dpas');
        Schema::dropIfExists('sppd_sub_kegiatans');
    }
};
