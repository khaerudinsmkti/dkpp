<?php

namespace Database\Seeders;

use App\Models\Skpg;
use Illuminate\Database\Seeder;

class SkpgSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $year = 2026;
        $now = now();

        $dryVulnerable = ['LOSARANG', 'KRANGKENG', 'KANDANGHAUR', 'GANTAR', 'KROYA', 'TRISI'];
        $floodVulnerable = ['CANTIGI', 'PASEKAN', 'INDRAMAYU', 'BALONGAN', 'SUKAGUMIWANG'];
        $accessVulnerable = ['LOSARANG', 'CANTIGI', 'SUKRA'];

        $records = [];

        for ($month = 1; $month <= 12; $month++) {
            foreach (Skpg::KECAMATAN_LIST as $kec) {
                $ik = 'AMAN';
                $ia = 'AMAN';
                $ip = 'AMAN';
                $ikb = 'AMAN';
                $potensiKering = 'AMAN';
                $potensiBasah = 'AMAN';
                $kondisiIklim = 'AMAN';
                $keterangan = 'Situasi ketersediaan dan ketahanan pangan kondusif';

                // Musim Hujan / Basah (Bulan 1, 2, 12)
                if (in_array($month, [1, 2, 12])) {
                    if (in_array($kec, $floodVulnerable)) {
                        $potensiBasah = 'WASPADA';
                        $kondisiIklim = 'WASPADA';
                        $keterangan = 'Antisipasi luapan saluran air dan pasang laut';
                    }
                    if ($kec === 'PASEKAN' && $month === 1) {
                        $potensiBasah = 'SIAGA';
                        $kondisiIklim = 'WASPADA';
                        $keterangan = 'Peringatan dini kenaikan pasang air laut di muara sungai';
                    }
                    if ($kec === 'CANTIGI' && $month === 1) {
                        $potensiBasah = 'AWAS';
                        $kondisiIklim = 'SIAGA';
                        $ikb = 'WASPADA';
                        $keterangan = 'Potensi banjir pasang air laut rob ekstrem di pesisir hilir';
                    }
                }

                // Musim Kemarau / Kering (Bulan 6, 7, 8, 9)
                if (in_array($month, [6, 7, 8, 9])) {
                    if (in_array($kec, $dryVulnerable)) {
                        $potensiKering = 'WASPADA';
                        $kondisiIklim = 'WASPADA';
                        $keterangan = 'Pemantauan ketersediaan air irigasi pertanian';
                    }
                    if (in_array($kec, ['GANTAR', 'LOSARANG']) && in_array($month, [7, 8])) {
                        $potensiKering = 'SIAGA';
                        $kondisiIklim = 'WASPADA';
                        $keterangan = 'Debit air irigasi teknis menurun, siaga pompa air cadangan';
                    }
                    if ($kec === 'KRANGKENG' && in_array($month, [7, 8])) {
                        $potensiKering = 'AWAS';
                        $kondisiIklim = 'SIAGA';
                        $ik = 'WASPADA';
                        $ikb = 'WASPADA';
                        $keterangan = 'Ancaman kekeringan kritis lahan pertanian tadah hujan';
                    }
                    if ($kec === 'LOSARANG' && $month === 8) {
                        $ia = 'WASPADA';
                        $ikb = 'WASPADA';
                        $potensiKering = 'SIAGA';
                        $keterangan = 'Stok pangan stabil namun pasokan air irigasi terbatas';
                    }
                }

                // Musim Panen (Bulan 3, 4, 5) - Sangat Aman
                if (in_array($month, [3, 4, 5])) {
                    $keterangan = 'Musim panen raya, pasokan melimpah dan harga stabil';
                }

                $records[] = [
                    'kecamatan' => $kec,
                    'kode_kecamatan' => Skpg::KECAMATAN_CODES[$kec] ?? '',
                    'year' => $year,
                    'month' => $month,
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
        }

        if (! empty($records)) {
            foreach (array_chunk($records, 100) as $chunk) {
                Skpg::upsert(
                    $chunk,
                    ['kecamatan', 'year', 'month'],
                    ['kode_kecamatan', 'ik', 'ia', 'ip', 'ikb', 'potensi_kering', 'potensi_basah', 'kondisi_iklim', 'keterangan', 'updated_at']
                );
            }
        }
    }
}
