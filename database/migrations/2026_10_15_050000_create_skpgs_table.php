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
        Schema::create('skpgs', function (Blueprint $table) {
            $table->id();
            $table->string('kecamatan', 100)->index()->comment('Nama Kecamatan');
            $table->string('kode_kecamatan', 20)->nullable()->comment('Kode BPS Kecamatan');
            $table->unsignedSmallInteger('year')->index()->comment('Tahun evaluasi SKPG');
            $table->unsignedTinyInteger('month')->index()->comment('Bulan evaluasi (1-12)');
            $table->string('ik', 20)->default('AMAN')->comment('Ketersediaan (IK): AMAN, WASPADA, RENTAN');
            $table->string('ia', 20)->default('AMAN')->comment('Keterjangkauan (IA): AMAN, WASPADA, RENTAN');
            $table->string('ip', 20)->default('AMAN')->comment('Pemanfaatan (IP): AMAN, WASPADA, RENTAN');
            $table->string('ikb', 20)->default('AMAN')->comment('Komposit (IKB): AMAN, WASPADA, RENTAN');
            $table->string('potensi_kering', 20)->default('AMAN')->comment('Potensi Kering: AMAN, WASPADA, RENTAN');
            $table->string('potensi_basah', 20)->default('AMAN')->comment('Potensi Basah: AMAN, WASPADA, RENTAN');
            $table->string('kondisi_iklim', 20)->default('AMAN')->comment('Kondisi Iklim: AMAN, WASPADA, RENTAN');
            $table->text('keterangan')->nullable()->comment('Catatan atau keterangan evaluasi');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['kecamatan', 'year', 'month'], 'skpg_kecamatan_year_month_unique');
        });

        // 31 Kecamatan Indramayu with BPS codes
        $kecamatanData = [
            ['name' => 'HAURGEULIS', 'code' => '3212010'],
            ['name' => 'KROYA', 'code' => '3212020'],
            ['name' => 'GABUSWETAN', 'code' => '3212030'],
            ['name' => 'CIKEDUNG', 'code' => '3212040'],
            ['name' => 'LELEA', 'code' => '3212050'],
            ['name' => 'BANGODUA', 'code' => '3212060'],
            ['name' => 'WIDASARI', 'code' => '3212070'],
            ['name' => 'KERTASEMAYA', 'code' => '3212080'],
            ['name' => 'KRANGKENG', 'code' => '3212090'],
            ['name' => 'KARANGAMPEL', 'code' => '3212100'],
            ['name' => 'JUNTINYUAT', 'code' => '3212110'],
            ['name' => 'SLIYEG', 'code' => '3212120'],
            ['name' => 'JATIBARANG', 'code' => '3212130'],
            ['name' => 'BALONGAN', 'code' => '3212140'],
            ['name' => 'INDRAMAYU', 'code' => '3212150'],
            ['name' => 'SINDANG', 'code' => '3212160'],
            ['name' => 'CANTIGI', 'code' => '3212161'],
            ['name' => 'LOHBENER', 'code' => '3212170'],
            ['name' => 'ARAHAN', 'code' => '3212171'],
            ['name' => 'LOSARANG', 'code' => '3212180'],
            ['name' => 'KANDANGHAUR', 'code' => '3212190'],
            ['name' => 'BONGAS', 'code' => '3212200'],
            ['name' => 'ANJATAN', 'code' => '3212210'],
            ['name' => 'SUKRA', 'code' => '3212220'],
            ['name' => 'GANTAR', 'code' => '3212011'],
            ['name' => 'TRISI', 'code' => '3212041'],
            ['name' => 'SUKAGUMIWANG', 'code' => '3212081'],
            ['name' => 'KEDOKAN BUNDER', 'code' => '3212101'],
            ['name' => 'PASEKAN', 'code' => '3212162'],
            ['name' => 'TUKDANA', 'code' => '3212061'],
            ['name' => 'PATROL', 'code' => '3212221'],
        ];

        $now = now();
        $seeds = [];

        // Seed 31 subdistricts for October 2026 (Month 10)
        foreach ($kecamatanData as $kec) {
            $name = $kec['name'];

            // Realistic status distribution: mostly AMAN, some WASPADA and RENTAN
            $ik = 'AMAN';
            $ia = 'AMAN';
            $ip = 'AMAN';
            $ikb = 'AMAN';
            $potensiKering = 'AMAN';
            $potensiBasah = 'AMAN';
            $kondisiIklim = 'AMAN';
            $keterangan = 'Kondisi pangan dan gizi terpantau stabil';

            if ($name === 'LOSARANG') {
                $ik = 'WASPADA';
                $ia = 'RENTAN';
                $ikb = 'RENTAN';
                $potensiKering = 'WASPADA';
                $keterangan = 'Perlu pemantauan intensif distribusi dan harga';
            } elseif ($name === 'KRANGKENG') {
                $ik = 'WASPADA';
                $ikb = 'WASPADA';
                $potensiKering = 'RENTAN';
                $kondisiIklim = 'WASPADA';
                $keterangan = 'Terdapat potensi kekeringan lahan tadah hujan';
            } elseif ($name === 'KANDANGHAUR') {
                $ikb = 'WASPADA';
                $potensiKering = 'WASPADA';
                $kondisiIklim = 'WASPADA';
                $keterangan = 'Intensitas air irigasi hilir mulai menurun';
            } elseif ($name === 'CANTIGI') {
                $ia = 'WASPADA';
                $ikb = 'WASPADA';
                $potensiBasah = 'WASPADA';
                $keterangan = 'Daerah pesisir waspada pasang air laut (rob)';
            } elseif ($name === 'GANTAR') {
                $ikb = 'WASPADA';
                $potensiKering = 'WASPADA';
                $keterangan = 'Peringatan dini cadangan air waduk';
            } elseif ($name === 'PASEKAN') {
                $potensiBasah = 'WASPADA';
                $kondisiIklim = 'WASPADA';
                $keterangan = 'Cuaca pesisir dan wilayah kepulauan fluktuatif';
            }

            $seeds[] = [
                'kecamatan' => $name,
                'kode_kecamatan' => $kec['code'],
                'year' => 2026,
                'month' => 10,
                'ik' => $ik,
                'ia' => $ia,
                'ip' => $ip,
                'ikb' => $ikb,
                'potensi_kering' => $potensiKering,
                'potensi_basah' => $potensiBasah,
                'kondisi_iklim' => $kondisiIklim,
                'keterangan' => $keterangan,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Seed 31 subdistricts for September 2026 (Month 9)
        foreach ($kecamatanData as $kec) {
            $name = $kec['name'];
            $ikb = in_array($name, ['LOSARANG', 'KRANGKENG', 'KANDANGHAUR']) ? 'WASPADA' : 'AMAN';
            $potensiKering = in_array($name, ['KRANGKENG', 'GANTAR', 'CIKEDUNG']) ? 'WASPADA' : 'AMAN';

            $seeds[] = [
                'kecamatan' => $name,
                'kode_kecamatan' => $kec['code'],
                'year' => 2026,
                'month' => 9,
                'ik' => 'AMAN',
                'ia' => 'AMAN',
                'ip' => 'AMAN',
                'ikb' => $ikb,
                'potensi_kering' => $potensiKering,
                'potensi_basah' => 'AMAN',
                'kondisi_iklim' => 'AMAN',
                'keterangan' => 'Evaluasi SKPG bulan September',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('skpgs')->insert($seeds);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skpgs');
    }
};
