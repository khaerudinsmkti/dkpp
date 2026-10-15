<?php

namespace Database\Factories;

use App\Models\Skpg;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Skpg>
 */
class SkpgFactory extends Factory
{
    protected $model = Skpg::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $kecamatan = fake()->randomElement(Skpg::KECAMATAN_LIST);
        $code = Skpg::KECAMATAN_CODES[$kecamatan] ?? '3212000';
        $statuses = [Skpg::STATUS_AMAN, Skpg::STATUS_WASPADA, Skpg::STATUS_RENTAN];

        return [
            'kecamatan' => $kecamatan,
            'kode_kecamatan' => $code,
            'year' => fake()->numberBetween(2025, 2027),
            'month' => fake()->numberBetween(1, 12),
            'ik' => fake()->randomElement($statuses),
            'ia' => fake()->randomElement($statuses),
            'ip' => fake()->randomElement($statuses),
            'ikb' => fake()->randomElement($statuses),
            'potensi_kering' => fake()->randomElement($statuses),
            'potensi_basah' => fake()->randomElement($statuses),
            'kondisi_iklim' => fake()->randomElement($statuses),
            'keterangan' => fake()->sentence(),
            'created_by' => User::factory(),
        ];
    }
}
