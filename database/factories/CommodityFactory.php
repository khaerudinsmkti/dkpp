<?php

namespace Database\Factories;

use App\Models\Commodity;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Commodity>
 */
class CommodityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'category' => fake()->randomElement(['Beras', 'Hortikultura', 'Protein Hewani', 'Gula & Minyak', 'Perikanan']),
            'unit' => 'Kg',
            'description' => fake()->sentence(),
            'is_active' => true,
            'order' => fake()->numberBetween(1, 50),
        ];
    }
}
