<?php

namespace Database\Factories;

use App\Models\PphScore;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PphScore>
 */
class PphScoreFactory extends Factory
{
    protected $model = PphScore::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tahun' => fake()->unique()->numberBetween(2020, 2030),
            'skor_pph' => fake()->randomFloat(2, 70, 98),
            'keterangan' => fake()->randomElement(['Kategori Baik', 'Kategori Sangat Baik', 'Perlu Peningkatan Diversifikasi']),
            'created_by' => null,
        ];
    }
}

