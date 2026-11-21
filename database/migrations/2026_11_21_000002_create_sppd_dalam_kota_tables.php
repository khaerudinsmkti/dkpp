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
        // 1. Master Data Pegawai
        Schema::create('sppd_pegawais', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('nip', 40)->nullable();
            $table->string('pangkat', 100)->nullable();
            $table->string('golongan', 50)->nullable();
            $table->string('jabatan', 150)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2, 3, 4. Master Data Kepala Dinas, PPTK, Bendahara
        Schema::create('sppd_pejabats', function (Blueprint $table) {
            $table->id();
            $table->string('tipe', 30); // kepala_dinas | pptk | bendahara
            $table->string('nama');
            $table->string('nip', 40)->nullable();
            $table->string('pangkat', 100)->nullable();
            $table->string('golongan', 50)->nullable();
            $table->string('jabatan', 150)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 5. Master Data Zonasi (Kecamatan, Zona, Golongan, Uang Saku)
        Schema::create('sppd_zonasis', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kecamatan', 100);
            $table->string('zona', 50); // Zona I, Zona II, Zona III
            $table->string('golongan', 50); // Golongan I, Golongan II, Golongan III, Golongan IV
            $table->decimal('uang_saku', 15, 2)->default(0);
            $table->timestamps();
        });

        // 6. Data Transaksi SPPD Dalam Kota
        Schema::create('sppd_dalam_kotas', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_spt', 100)->nullable();
            $table->date('tanggal_spt');
            $table->date('tanggal_berangkat');
            $table->text('tujuan');
            $table->string('nama_kecamatan', 100);
            $table->string('zona', 50)->nullable();
            $table->foreignId('kepala_dinas_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
            $table->foreignId('pptk_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
            $table->foreignId('bendahara_id')->nullable()->constrained('sppd_pejabats')->nullOnDelete();
            $table->decimal('total_uang_saku', 15, 2)->default(0);
            $table->timestamps();
        });

        // Detail Pegawai / Pengikut dalam SPPD Dalam Kota
        Schema::create('sppd_dalam_kota_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sppd_dalam_kota_id')->constrained('sppd_dalam_kotas')->cascadeOnDelete();
            $table->foreignId('pegawai_id')->nullable()->constrained('sppd_pegawais')->nullOnDelete();
            $table->unsignedInteger('urutan')->default(1);
            $table->string('nama');
            $table->string('nip', 40)->nullable();
            $table->string('pangkat', 100)->nullable();
            $table->string('golongan', 50)->nullable();
            $table->string('jabatan', 150)->nullable();
            $table->date('tanggal_berangkat');
            $table->date('tanggal_spt');
            $table->text('tujuan');
            $table->string('nama_kecamatan', 100);
            $table->string('zona', 50)->nullable();
            $table->decimal('uang_saku', 15, 2)->default(0);
            $table->timestamps();
        });

        // Seed representative initial Master Data for DKPP Indramayu
        $now = now();

        DB::table('sppd_pegawais')->insert([
            [
                'nama' => 'Ir. H. Sugeng Raharjo, M.Si',
                'nip' => '196904121995031002',
                'pangkat' => 'Pembina Utama Muda',
                'golongan' => 'IV/c',
                'jabatan' => 'Kepala Dinas Ketahanan Pangan dan Pertanian',
                'tanggal_lahir' => '1969-04-12',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'H. Bambang Sutrisno, S.P., M.P.',
                'nip' => '197508192001121003',
                'pangkat' => 'Pembina',
                'golongan' => 'IV/a',
                'jabatan' => 'Kepala Bidang Ketersediaan dan Kerawanan Pangan',
                'tanggal_lahir' => '1975-08-19',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Hj. Ratna Dewi, S.TP., M.Si.',
                'nip' => '197811042003122001',
                'pangkat' => 'Pembina',
                'golongan' => 'IV/a',
                'jabatan' => 'Kepala Bidang Distribusi dan Cadangan Pangan',
                'tanggal_lahir' => '1978-11-04',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Dedi Kurniawan, S.P.',
                'nip' => '198402152009021004',
                'pangkat' => 'Penata Tingkat I',
                'golongan' => 'III/d',
                'jabatan' => 'Analis Ketahanan Pangan Ahli Muda',
                'tanggal_lahir' => '1984-02-15',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Siti Nurhaliza, S.P.',
                'nip' => '199007212015032002',
                'pangkat' => 'Penata Muda Tingkat I',
                'golongan' => 'III/b',
                'jabatan' => 'Pengawas Harga Pangan',
                'tanggal_lahir' => '1990-07-21',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Ahmad Fauzi, A.Md.',
                'nip' => '199403102019031005',
                'pangkat' => 'Pengatur Tingkat I',
                'golongan' => 'II/d',
                'jabatan' => 'Pengelola Data Ketersediaan Pangan',
                'tanggal_lahir' => '1994-03-10',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('sppd_pejabats')->insert([
            [
                'tipe' => 'kepala_dinas',
                'nama' => 'Ir. H. Sugeng Raharjo, M.Si',
                'nip' => '196904121995031002',
                'pangkat' => 'Pembina Utama Muda',
                'golongan' => 'IV/c',
                'jabatan' => 'Kepala Dinas Ketahanan Pangan dan Pertanian',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'tipe' => 'pptk',
                'nama' => 'Dedi Kurniawan, S.P.',
                'nip' => '198402152009021004',
                'pangkat' => 'Penata Tingkat I',
                'golongan' => 'III/d',
                'jabatan' => 'PPTK Bidang Distribusi & Ketersediaan Pangan',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'tipe' => 'bendahara',
                'nama' => 'Wahyu Hidayat, S.E.',
                'nip' => '198705182011011002',
                'pangkat' => 'Penata',
                'golongan' => 'III/c',
                'jabatan' => 'Bendahara Pengeluaran DKPP',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Seed Zonasi Kecamatan Kabupaten Indramayu (Zona I, Zona II, Zona III) per Golongan
        $zonasiMap = [
            'Zona I' => [
                'kecamatan' => ['Indramayu', 'Sindang', 'Balongan', 'Pasekan', 'Lohbener', 'Arahan', 'Cantigi'],
                'tarif' => [
                    'Golongan IV' => 150000,
                    'Golongan III' => 130000,
                    'Golongan II' => 110000,
                    'Golongan I' => 100000,
                ],
            ],
            'Zona II' => [
                'kecamatan' => ['Jatibarang', 'Sliyeg', 'Kertasemaya', 'Karangampel', 'Juntinyuat', 'Krangkeng', 'Kedokan Bunder', 'Widasari', 'Bangodua', 'Tukdana', 'Losarang', 'Lelea', 'Cikedung'],
                'tarif' => [
                    'Golongan IV' => 170000,
                    'Golongan III' => 150000,
                    'Golongan II' => 130000,
                    'Golongan I' => 115000,
                ],
            ],
            'Zona III' => [
                'kecamatan' => ['Haurgeulis', 'Gantar', 'Anjatan', 'Sukra', 'Patrol', 'Kandanghaur', 'Bongas', 'Gabuswetan', 'Kroya', 'Trisi', 'Sukagumiwang'],
                'tarif' => [
                    'Golongan IV' => 200000,
                    'Golongan III' => 175000,
                    'Golongan II' => 150000,
                    'Golongan I' => 130000,
                ],
            ],
        ];

        $zonasiRows = [];
        foreach ($zonasiMap as $zonaName => $cfg) {
            foreach ($cfg['kecamatan'] as $kec) {
                foreach ($cfg['tarif'] as $gol => $uangSaku) {
                    $zonasiRows[] = [
                        'nama_kecamatan' => $kec,
                        'zona' => $zonaName,
                        'golongan' => $gol,
                        'uang_saku' => $uangSaku,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        foreach (array_chunk($zonasiRows, 50) as $chunk) {
            DB::table('sppd_zonasis')->insert($chunk);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sppd_dalam_kota_participants');
        Schema::dropIfExists('sppd_dalam_kotas');
        Schema::dropIfExists('sppd_zonasis');
        Schema::dropIfExists('sppd_pejabats');
        Schema::dropIfExists('sppd_pegawais');
    }
};
