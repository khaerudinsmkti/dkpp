<?php

namespace Database\Factories;

use App\Models\Commodity;
use App\Models\ConsumerPrice;
use App\Models\Market;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConsumerPrice>
 */
class ConsumerPriceFactory extends Factory
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
            'market_id' => Market::factory(),
            'recorded_date' => fake()->date(),
            'price' => fake()->randomFloat(2, 5000, 150000),
            'notes' => fake()->sentence(),
        ];
    }
}
