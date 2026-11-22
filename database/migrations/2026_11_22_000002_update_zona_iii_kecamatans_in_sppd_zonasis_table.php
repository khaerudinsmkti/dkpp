<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // 1. Rapikan penamaan 'Trisi' -> 'Terisi'
        DB::table('sppd_zonasis')
            ->where('nama_kecamatan', 'Trisi')
            ->update([
                'nama_kecamatan' => 'Terisi',
                'updated_at' => $now,
            ]);

        // Ambil tarif eksisting per golongan untuk Zona III agar perubahan tarif user tetap terjaga
        $tarifZona3 = DB::table('sppd_zonasis')
            ->where('zona', 'Zona III')
            ->pluck('uang_saku', 'golongan')
            ->all();

        $defaultTarifZona3 = [
            'Golongan IV' => $tarifZona3['Golongan IV'] ?? 200000,
            'Golongan III' => $tarifZona3['Golongan III'] ?? 175000,
            'Golongan II' => $tarifZona3['Golongan II'] ?? 150000,
            'Golongan I' => $tarifZona3['Golongan I'] ?? 130000,
        ];

        // Daftar resmi 14 Kecamatan Zona III sesuai lampiran
        $zona3Kecamatans = [
            'Anjatan',
            'Bangodua',
            'Bongas',
            'Gabuswetan',
            'Gantar',
            'Haurgeulis',
            'Kandanghaur',
            'Kertasemaya',
            'Kroya',
            'Patrol',
            'Sukagumiwang',
            'Sukra',
            'Terisi',
            'Tukdana',
        ];

        // 2. Pastikan seluruh 14 Kecamatan Zona III terdaftar di Zona III dengan lengkap 4 golongan
        foreach ($zona3Kecamatans as $kec) {
            foreach ($defaultTarifZona3 as $gol => $tarif) {
                $existing = DB::table('sppd_zonasis')
                    ->where('nama_kecamatan', $kec)
                    ->where('golongan', $gol)
                    ->first();

                if ($existing) {
                    DB::table('sppd_zonasis')
                        ->where('id', $existing->id)
                        ->update([
                            'zona' => 'Zona III',
                            'uang_saku' => $existing->zona === 'Zona III' ? $existing->uang_saku : $tarif,
                            'updated_at' => $now,
                        ]);
                } else {
                    DB::table('sppd_zonasis')->insert([
                        'nama_kecamatan' => $kec,
                        'zona' => 'Zona III',
                        'golongan' => $gol,
                        'uang_saku' => $tarif,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }

        // 3. Hapus entri Zona III lain di luar 14 kecamatan resmi jika ada
        DB::table('sppd_zonasis')
            ->where('zona', 'Zona III')
            ->whereNotIn('nama_kecamatan', $zona3Kecamatans)
            ->delete();
    }

    public function down(): void
    {
        // No destructive rollback needed
    }
};
