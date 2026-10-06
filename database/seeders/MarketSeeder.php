<?php

namespace Database\Seeders;

use App\Models\Market;
use Illuminate\Database\Seeder;

class MarketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $markets = [
            ['name' => 'Pasar Daerah Indramayu', 'location' => 'Kecamatan Indramayu', 'order' => 1],
            ['name' => 'Pasar Jatibarang', 'location' => 'Kecamatan Jatibarang', 'order' => 2],
            ['name' => 'Pasar Karangampel', 'location' => 'Kecamatan Karangampel', 'order' => 3],
            ['name' => 'Pasar Haurgeulis', 'location' => 'Kecamatan Haurgeulis', 'order' => 4],
            ['name' => 'Pasar Patrol', 'location' => 'Kecamatan Patrol', 'order' => 5],
        ];

        foreach ($markets as $market) {
            Market::firstOrCreate(
                ['name' => $market['name']],
                [
                    'location' => $market['location'],
                    'is_active' => true,
                    'order' => $market['order'],
                ]
            );
        }
    }
}
