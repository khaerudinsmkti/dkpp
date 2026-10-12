<?php

namespace Database\Seeders;

use App\Models\ProducerCommodity;
use App\Models\ProducerHap;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProducerCommoditySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $userId = User::first()?->id;

        $items = [
            [
                'name' => 'GKP Tingkat Petani',
                'slug' => 'gkp-tingkat-petani',
                'key' => 'gkp_petani',
                'category' => 'Gabah',
                'unit' => 'Kg',
                'order' => 1,
                'description' => 'Gabah Kering Panen di tingkat petani sawah',
                'hap' => 6000,
                'regulation' => 'Perbadan No. 6/2023',
            ],
            [
                'name' => 'GKP Tingkat Penggilingan',
                'slug' => 'gkp-tingkat-penggilingan',
                'key' => 'gkp_penggilingan',
                'category' => 'Gabah',
                'unit' => 'Kg',
                'order' => 2,
                'description' => 'Gabah Kering Panen di tingkat usaha penggilingan padi',
                'hap' => 6200,
                'regulation' => 'Perbadan No. 6/2023',
            ],
            [
                'name' => 'GKG Tingkat Penggilingan',
                'slug' => 'gkg-tingkat-penggilingan',
                'key' => 'gkg_penggilingan',
                'category' => 'Gabah',
                'unit' => 'Kg',
                'order' => 3,
                'description' => 'Gabah Kering Giling di tingkat usaha penggilingan padi',
                'hap' => 7400,
                'regulation' => 'Perbadan No. 6/2023',
            ],
            [
                'name' => 'Beras Medium Penggilingan',
                'slug' => 'beras-medium-penggilingan',
                'key' => 'beras_medium_penggilingan',
                'category' => 'Beras',
                'unit' => 'Kg',
                'order' => 4,
                'description' => 'Beras Medium hasil produksi di tingkat penggilingan',
                'hap' => 12000,
                'regulation' => 'Perbadan No. 6/2023',
            ],
            [
                'name' => 'Beras Premium Penggilingan',
                'slug' => 'beras-premium-penggilingan',
                'key' => 'beras_premium_penggilingan',
                'category' => 'Beras',
                'unit' => 'Kg',
                'order' => 5,
                'description' => 'Beras Premium hasil produksi di tingkat penggilingan',
                'hap' => 13900,
                'regulation' => 'Perbadan No. 6/2023',
            ],
            [
                'name' => 'Sapi Hidup',
                'slug' => 'sapi-hidup',
                'key' => 'sapi_hidup',
                'category' => 'Peternakan',
                'unit' => 'Kg',
                'order' => 6,
                'description' => 'Sapi potong hidup di tingkat peternak / produsen (Farm Gate)',
                'hap' => 56000,
                'regulation' => 'Perbadan No. 6/2023',
            ],
        ];

        foreach ($items as $item) {
            $comm = ProducerCommodity::firstOrCreate(
                ['key' => $item['key']],
                [
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'category' => $item['category'],
                    'unit' => $item['unit'],
                    'order' => $item['order'],
                    'description' => $item['description'],
                    'is_active' => true,
                ]
            );

            if ($comm->haps()->count() === 0) {
                ProducerHap::create([
                    'producer_commodity_id' => $comm->id,
                    'price' => $item['hap'],
                    'effective_date' => '2026-01-01',
                    'source_regulation' => $item['regulation'],
                    'notes' => 'Penetapan HAP acuan batas bawah Bapanas',
                    'created_by' => $userId,
                ]);
            }
        }
    }
}
