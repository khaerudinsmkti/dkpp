<?php

namespace Database\Seeders;

use App\Models\Commodity;
use App\Models\CommodityHet;
use Illuminate\Database\Seeder;

class CommodityHetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $hets = [
            // Beras
            ['slug' => 'beras-premium', 'price' => 14900, 'effective_date' => '2024-06-01', 'source_regulation' => 'Perbadan No. 05/2024', 'notes' => 'HET Beras Premium Zona 1 (Jawa, Lampung, Sumsel)'],
            ['slug' => 'beras-medium', 'price' => 10900, 'effective_date' => '2023-03-15', 'source_regulation' => 'Perbadan No. 07/2023', 'notes' => 'HET Beras Medium Lama Zona 1'],
            ['slug' => 'beras-medium', 'price' => 13100, 'effective_date' => '2024-06-01', 'source_regulation' => 'Perbadan No. 05/2024', 'notes' => 'Relaksasi/Pembaruan HET Beras Medium Zona 1'],
            ['slug' => 'beras-sphp', 'price' => 12500, 'effective_date' => '2024-05-01', 'source_regulation' => 'Penugasan Bapanas 2024', 'notes' => 'HET Beras SPHP Bulog tingkat konsumen'],
            ['slug' => 'beras-medium-non-sphp', 'price' => 13100, 'effective_date' => '2024-06-01', 'source_regulation' => 'Perbadan No. 05/2024', 'notes' => 'Beras Medium Non SPHP Zona 1'],
            // Jagung & Kedelai
            ['slug' => 'jagung-tk-peternak', 'price' => 5000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Perbadan No. 11/2022', 'notes' => 'Harga Acuan Pembelian/Penjualan (HAP)'],
            ['slug' => 'kedelai-biji-kering-impor', 'price' => 12000, 'effective_date' => '2024-01-01', 'source_regulation' => 'HAP Bapanas 2024', 'notes' => 'Kedelai Kering Impor Konsumen'],
            // Bawang & Cabai
            ['slug' => 'bawang-merah', 'price' => 36500, 'effective_date' => '2024-01-01', 'source_regulation' => 'Perbadan No. 11/2022', 'notes' => 'Bawang Merah Rogol Kering Panen / Konsumsi'],
            ['slug' => 'bawang-putih-bonggol', 'price' => 32000, 'effective_date' => '2024-01-01', 'source_regulation' => 'HAP Bapanas 2024', 'notes' => 'Bawang Putih Bonggol'],
            ['slug' => 'cabai-merah-keriting', 'price' => 37000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Perbadan No. 11/2022', 'notes' => 'Cabai Merah Keriting Tingkat Konsumen'],
            ['slug' => 'cabai-merah-besar', 'price' => 37000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Perbadan No. 11/2022', 'notes' => 'Cabai Merah Besar Tingkat Konsumen'],
            ['slug' => 'cabai-rawit-merah', 'price' => 40000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Perbadan No. 11/2022', 'notes' => 'Cabai Rawit Merah Tingkat Konsumen'],
            // Daging & Telur
            ['slug' => 'daging-sapi-murni', 'price' => 140000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Perbadan No. 11/2022', 'notes' => 'Daging Sapi Paha Belakang/Segar'],
            ['slug' => 'daging-ayam-ras', 'price' => 36750, 'effective_date' => '2024-01-01', 'source_regulation' => 'Perbadan No. 05/2022', 'notes' => 'Daging Ayam Ras Pedaging Karkas'],
            ['slug' => 'telur-ayam-ras', 'price' => 27000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Perbadan No. 05/2022', 'notes' => 'Telur Ayam Ras Tingkat Konsumen'],
            ['slug' => 'daging-kerbau-beku-impor', 'price' => 80000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Penugasan Bapanas/Bulog', 'notes' => 'Daging Kerbau Beku Impor'],
            // Gula & Minyak
            ['slug' => 'gula-konsumsi', 'price' => 14500, 'effective_date' => '2023-08-01', 'source_regulation' => 'Perbadan No. 11/2022', 'notes' => 'HET Gula Konsumsi Lama'],
            ['slug' => 'gula-konsumsi', 'price' => 17500, 'effective_date' => '2024-04-05', 'source_regulation' => 'SE Bapanas No. 142/2024', 'notes' => 'Relaksasi HET Gula Konsumsi'],
            ['slug' => 'minyak-goreng-kemasan', 'price' => 17000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Permendag No. 18/2024', 'notes' => 'Minyak Goreng Kemasan Premium'],
            ['slug' => 'minyak-goreng-curah', 'price' => 14000, 'effective_date' => '2023-01-01', 'source_regulation' => 'Permendag No. 49/2022', 'notes' => 'HET Lama Minyak Curah'],
            ['slug' => 'minyak-goreng-curah', 'price' => 15700, 'effective_date' => '2024-07-15', 'source_regulation' => 'Permendag No. 18/2024', 'notes' => 'HET Baru Minyak Goreng Curah'],
            ['slug' => 'minyakita', 'price' => 14000, 'effective_date' => '2022-07-06', 'source_regulation' => 'Permendag No. 41/2022', 'notes' => 'HET Awal Minyakita'],
            ['slug' => 'minyakita', 'price' => 15700, 'effective_date' => '2024-07-15', 'source_regulation' => 'Permendag No. 18/2024', 'notes' => 'Penyesuaian HET Minyakita'],
            // Terigu
            ['slug' => 'tepung-terigu-curah', 'price' => 11000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Standar Pasar DKPP', 'notes' => 'Tepung Terigu Curah Konsumen'],
            ['slug' => 'tepung-terigu-kemasan', 'price' => 13000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Standar Pasar DKPP', 'notes' => 'Tepung Terigu Kemasan Konsumen'],
            // Perikanan & Bumbu
            ['slug' => 'ikan-kembung', 'price' => 40000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Standar Pangan Bapanas', 'notes' => 'Ikan Kembung Segar'],
            ['slug' => 'ikan-tongkol', 'price' => 35000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Standar Pangan Bapanas', 'notes' => 'Ikan Tongkol Segar'],
            ['slug' => 'ikan-bandeng', 'price' => 33000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Standar Pangan Bapanas', 'notes' => 'Ikan Bandeng Segar'],
            ['slug' => 'garam-konsumsi', 'price' => 10000, 'effective_date' => '2024-01-01', 'source_regulation' => 'Standar Pangan DKPP', 'notes' => 'Garam Beryodium Halus'],
        ];

        foreach ($hets as $h) {
            $commodity = Commodity::where('slug', $h['slug'])->first();
            if ($commodity) {
                CommodityHet::firstOrCreate(
                    [
                        'commodity_id' => $commodity->id,
                        'effective_date' => $h['effective_date'],
                    ],
                    [
                        'price' => $h['price'],
                        'source_regulation' => $h['source_regulation'],
                        'notes' => $h['notes'],
                    ]
                );
            }
        }
    }
}
