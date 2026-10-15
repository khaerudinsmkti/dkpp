<?php

namespace Database\Factories;

use App\Models\CppdInitialStock;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CppdInitialStock>
 */
class CppdInitialStockFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'year' => fake()->unique()->numberBetween(2020, 2035),
            'amount' => fake()->randomFloat(2, 50000, 200000),
            'keterangan' => 'Stok awal beras cadangan pangan pemerintah daerah',
            'created_by' => User::factory(),
        ];
    }
}
