<?php

namespace Database\Seeders;

use App\Models\Commodity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CommoditySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $commodities = [
            ['name' => 'Beras Premium', 'category' => 'Beras', 'unit' => 'Kg', 'order' => 1],
            ['name' => 'Beras Medium', 'category' => 'Beras', 'unit' => 'Kg', 'order' => 2],
            ['name' => 'Beras SPHP', 'category' => 'Beras', 'unit' => 'Kg', 'order' => 3],
            ['name' => 'Beras Medium Non SPHP', 'category' => 'Beras', 'unit' => 'Kg', 'order' => 4],
            ['name' => 'Jagung Tk Peternak', 'category' => 'Jagung & Kedelai', 'unit' => 'Kg', 'order' => 5],
            ['name' => 'Kedelai Biji Kering (Impor)', 'category' => 'Jagung & Kedelai', 'unit' => 'Kg', 'order' => 6],
            ['name' => 'Bawang Merah', 'category' => 'Bawang & Cabai', 'unit' => 'Kg', 'order' => 7],
            ['name' => 'Bawang Putih Bonggol', 'category' => 'Bawang & Cabai', 'unit' => 'Kg', 'order' => 8],
            ['name' => 'Cabai Merah Keriting', 'category' => 'Bawang & Cabai', 'unit' => 'Kg', 'order' => 9],
            ['name' => 'Cabai Merah Besar', 'category' => 'Bawang & Cabai', 'unit' => 'Kg', 'order' => 10],
            ['name' => 'Daging Sapi Murni', 'category' => 'Daging & Telur', 'unit' => 'Kg', 'order' => 11],
            ['name' => 'Cabai Rawit Merah', 'category' => 'Bawang & Cabai', 'unit' => 'Kg', 'order' => 12],
            ['name' => 'Daging Ayam Ras', 'category' => 'Daging & Telur', 'unit' => 'Kg', 'order' => 13],
            ['name' => 'Telur Ayam Ras', 'category' => 'Daging & Telur', 'unit' => 'Kg', 'order' => 14],
            ['name' => 'Gula Konsumsi', 'category' => 'Gula & Minyak', 'unit' => 'Kg', 'order' => 15],
            ['name' => 'Minyak Goreng Kemasan', 'category' => 'Gula & Minyak', 'unit' => 'Liter', 'order' => 16],
            ['name' => 'Minyak Goreng Curah', 'category' => 'Gula & Minyak', 'unit' => 'Liter', 'order' => 17],
            ['name' => 'Tepung Terigu (Curah)', 'category' => 'Tepung Terigu', 'unit' => 'Kg', 'order' => 18],
            ['name' => 'Minyakita', 'category' => 'Gula & Minyak', 'unit' => 'Liter', 'order' => 19],
            ['name' => 'Tepung Terigu Kemasan', 'category' => 'Tepung Terigu', 'unit' => 'Kg', 'order' => 20],
            ['name' => 'Ikan Kembung', 'category' => 'Perikanan', 'unit' => 'Kg', 'order' => 21],
            ['name' => 'Ikan Tongkol', 'category' => 'Perikanan', 'unit' => 'Kg', 'order' => 22],
            ['name' => 'Ikan Bandeng', 'category' => 'Perikanan', 'unit' => 'Kg', 'order' => 23],
            ['name' => 'Garam Konsumsi', 'category' => 'Garam & Bumbu', 'unit' => 'Kg', 'order' => 24],
            ['name' => 'Daging Kerbau Beku (Impor Luar Negeri)', 'category' => 'Daging & Telur', 'unit' => 'Kg', 'order' => 25],
        ];

        foreach ($commodities as $item) {
            Commodity::firstOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'unit' => $item['unit'],
                    'is_active' => true,
                    'order' => $item['order'],
                ]
            );
        }
    }
}
