<?php

namespace Database\Seeders;

use App\Models\Commodity;
use App\Models\ConsumerPrice;
use App\Models\Market;
use Illuminate\Database\Seeder;

class ConsumerPriceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $markets = Market::all();
        $primaryMarket = $markets->first();
        if (! $primaryMarket) {
            return;
        }

        $today = now()->format('Y-m-d');
        $yesterday = now()->subDay()->format('Y-m-d');

        $priceMap = [
            'beras-premium' => 14800,
            'beras-medium' => 13000,
            'beras-sphp' => 12500,
            'beras-medium-non-sphp' => 13200,
            'jagung-tk-peternak' => 5200,
            'kedelai-biji-kering-impor' => 11800,
            'bawang-merah' => 38000,
            'bawang-putih-bonggol' => 33000,
            'cabai-merah-keriting' => 35000,
            'cabai-merah-besar' => 36000,
            'daging-sapi-murni' => 135000,
            'cabai-rawit-merah' => 43500,
            'daging-ayam-ras' => 37000,
            'telur-ayam-ras' => 28500,
            'gula-konsumsi' => 18000,
            'minyak-goreng-kemasan' => 17500,
            'minyak-goreng-curah' => 15500,
            'tepung-terigu-curah' => 11000,
            'minyakita' => 16000,
            'tepung-terigu-kemasan' => 13000,
            'ikan-kembung' => 42000,
            'ikan-tongkol' => 34000,
            'ikan-bandeng' => 32000,
            'garam-konsumsi' => 9500,
            'daging-kerbau-beku-impor' => 78000,
        ];

        $commodities = Commodity::all();

        foreach ($commodities as $commodity) {
            $basePrice = $priceMap[$commodity->slug] ?? 20000;

            // Seed today price in primary market
            ConsumerPrice::updateOrCreate(
                [
                    'commodity_id' => $commodity->id,
                    'market_id' => $primaryMarket->id,
                    'recorded_date' => $today,
                ],
                [
                    'price' => $basePrice,
                    'notes' => 'Pemantauan harian DKPP',
                ]
            );

            // Seed yesterday price with slight variation
            ConsumerPrice::updateOrCreate(
                [
                    'commodity_id' => $commodity->id,
                    'market_id' => $primaryMarket->id,
                    'recorded_date' => $yesterday,
                ],
                [
                    'price' => round($basePrice * 0.99),
                    'notes' => 'Pemantauan harian DKPP',
                ]
            );
        }

        // Seed historical price in 2023 to test historical HET comparison
        $berasMedium = $commodities->firstWhere('slug', 'beras-medium');
        if ($berasMedium) {
            ConsumerPrice::updateOrCreate(
                [
                    'commodity_id' => $berasMedium->id,
                    'market_id' => $primaryMarket->id,
                    'recorded_date' => '2023-05-15',
                ],
                [
                    'price' => 11200,
                    'notes' => 'Data historis 2023 (HET lama Rp 10.900)',
                ]
            );
        }
    }
}
