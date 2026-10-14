<?php

namespace Database\Factories;

use App\Models\PphFoodGroup;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PphFoodGroup>
 */
class PphFoodGroupFactory extends Factory
{
    protected $model = PphFoodGroup::class;

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
            'bobot' => fake()->randomElement([0.5, 1.0, 2.0, 5.0]),
            'skor_maksimal' => fake()->randomFloat(2, 5, 30),
            'order' => fake()->numberBetween(1, 20),
            'is_active' => true,
            'description' => fake()->sentence(),
        ];
    }
}
