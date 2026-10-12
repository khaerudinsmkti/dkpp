<?php

namespace Database\Seeders;

use App\Models\ProducerPrice;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ProducerPriceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $today = Carbon::today();

        $samples = [
            [
                'days_ago' => 0,
                'gkp_petani' => 6800,
                'gkp_penggilingan' => 7000,
                'gkg_penggilingan' => 7900,
                'beras_medium_penggilingan' => 12200,
                'beras_premium_penggilingan' => 14200,
                'sapi_hidup' => 58000,
                'notes' => 'Pencatatan harga harian sentra pertanian dan peternakan Indramayu',
            ],
            [
                'days_ago' => 1,
                'gkp_petani' => 6750,
                'gkp_penggilingan' => 6950,
                'gkg_penggilingan' => 7850,
                'beras_medium_penggilingan' => 12150,
                'beras_premium_penggilingan' => 14100,
                'sapi_hidup' => 58000,
                'notes' => 'Pasokan panen lancar di wilayah barat Indramayu',
            ],
            [
                'days_ago' => 2,
                'gkp_petani' => 6700,
                'gkp_penggilingan' => 6900,
                'gkg_penggilingan' => 7800,
                'beras_medium_penggilingan' => 12100,
                'beras_premium_penggilingan' => 14000,
                'sapi_hidup' => 57500,
                'notes' => 'Transaksi gabah stabil',
            ],
            [
                'days_ago' => 3,
                'gkp_petani' => 6650,
                'gkp_penggilingan' => 6850,
                'gkg_penggilingan' => 7750,
                'beras_medium_penggilingan' => 12050,
                'beras_premium_penggilingan' => 13950,
                'sapi_hidup' => 57500,
                'notes' => null,
            ],
            [
                'days_ago' => 4,
                'gkp_petani' => 6600,
                'gkp_penggilingan' => 6800,
                'gkg_penggilingan' => 7700,
                'beras_medium_penggilingan' => 12000,
                'beras_premium_penggilingan' => 13900,
                'sapi_hidup' => 57000,
                'notes' => null,
            ],
        ];

        $firstUser = User::first();
        $userId = $firstUser?->id;

        foreach ($samples as $sample) {
            $date = $today->copy()->subDays($sample['days_ago'])->format('Y-m-d');
            ProducerPrice::updateOrCreate(
                ['recorded_date' => $date],
                [
                    'gkp_petani' => $sample['gkp_petani'],
                    'gkp_penggilingan' => $sample['gkp_penggilingan'],
                    'gkg_penggilingan' => $sample['gkg_penggilingan'],
                    'beras_medium_penggilingan' => $sample['beras_medium_penggilingan'],
                    'beras_premium_penggilingan' => $sample['beras_premium_penggilingan'],
                    'sapi_hidup' => $sample['sapi_hidup'],
                    'notes' => $sample['notes'],
                    'created_by' => $userId,
                ]
            );
        }
    }
}
