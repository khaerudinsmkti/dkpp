<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // 1. Rapikan penamaan 'Kedokan Bunder' -> 'Kedokanbunder'
        DB::table('sppd_zonasis')
            ->where('nama_kecamatan', 'Kedokan Bunder')
            ->update([
                'nama_kecamatan' => 'Kedokanbunder',
                'updated_at' => $now,
            ]);

        // Ambil tarif eksisting per golongan untuk Zona II & Zona III agar perubahan tarif user tetap terjaga
        $tarifZona2 = DB::table('sppd_zonasis')
            ->where('zona', 'Zona II')
            ->pluck('uang_saku', 'golongan')
            ->all();

        $tarifZona3 = DB::table('sppd_zonasis')
            ->where('zona', 'Zona III')
            ->pluck('uang_saku', 'golongan')
            ->all();

        $defaultTarifZona2 = [
            'Golongan IV' => $tarifZona2['Golongan IV'] ?? 170000,
            'Golongan III' => $tarifZona2['Golongan III'] ?? 150000,
            'Golongan II' => $tarifZona2['Golongan II'] ?? 130000,
            'Golongan I' => $tarifZona2['Golongan I'] ?? 115000,
        ];

        $defaultTarifZona3 = [
            'Golongan IV' => $tarifZona3['Golongan IV'] ?? 200000,
            'Golongan III' => $tarifZona3['Golongan III'] ?? 175000,
            'Golongan II' => $tarifZona3['Golongan II'] ?? 150000,
            'Golongan I' => $tarifZona3['Golongan I'] ?? 130000,
        ];

        // Daftar resmi 10 Kecamatan Zona II sesuai lampiran
        $zona2Kecamatans = [
            'Cikedung',
            'Jatibarang',
            'Juntinyuat',
            'Karangampel',
            'Kedokanbunder',
            'Krangkeng',
            'Lelea',
            'Losarang',
            'Sliyeg',
            'Widasari',
        ];

        // 2. Kecamatan yang sebelumnya di Zona II tetapi tidak masuk daftar Zona II -> pindahkan ke Zona III
        $movedToZona3 = DB::table('sppd_zonasis')
            ->where('zona', 'Zona II')
            ->whereNotIn('nama_kecamatan', $zona2Kecamatans)
            ->get();

        foreach ($movedToZona3 as $row) {
            DB::table('sppd_zonasis')
                ->where('id', $row->id)
                ->update([
                    'zona' => 'Zona III',
                    'uang_saku' => $defaultTarifZona3[$row->golongan] ?? $row->uang_saku,
                    'updated_at' => $now,
                ]);
        }

        // 3. Pastikan semua 10 Kecamatan Zona II berada di Zona II dengan lengkap 4 golongan
        foreach ($zona2Kecamatans as $kec) {
            foreach ($defaultTarifZona2 as $gol => $tarif) {
                $existing = DB::table('sppd_zonasis')
                    ->where('nama_kecamatan', $kec)
                    ->where('golongan', $gol)
                    ->first();

                if ($existing) {
                    DB::table('sppd_zonasis')
                        ->where('id', $existing->id)
                        ->update([
                            'zona' => 'Zona II',
                            'uang_saku' => $existing->zona === 'Zona II' ? $existing->uang_saku : $tarif,
                            'updated_at' => $now,
                        ]);
                } else {
                    DB::table('sppd_zonasis')->insert([
                        'nama_kecamatan' => $kec,
                        'zona' => 'Zona II',
                        'golongan' => $gol,
                        'uang_saku' => $tarif,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        // No destructive rollback needed
    }
};
