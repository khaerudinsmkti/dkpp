<?php

namespace Database\Factories;

use App\Models\Commodity;
use App\Models\CommodityHet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommodityHet>
 */
class CommodityHetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'commodity_id' => Commodity::factory(),
            'price' => fake()->randomElement([12000, 14000, 16000, 25000, 35000]),
            'effective_date' => fake()->date(),
            'source_regulation' => 'Perbadan No. '.fake()->numberBetween(1, 20).'/2024',
            'notes' => fake()->sentence(),
        ];
    }
}
