<?php

namespace Database\Factories;

use App\Models\PphFoodGroup;
use App\Models\PphScore;
use App\Models\PphScoreDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PphScoreDetail>
 */
class PphScoreDetailFactory extends Factory
{
    protected $model = PphScoreDetail::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $energi = fake()->randomFloat(2, 50, 1200);
        $ake = fake()->randomFloat(2, 2.5, 60);
        $bobot = fake()->randomElement([0.5, 1.0, 2.0, 5.0]);
        $skorRiil = round($ake * $bobot, 2);
        $skorMaksimal = fake()->randomFloat(2, 5, 30);
        $skorPph = min($skorRiil, $skorMaksimal);

        return [
            'pph_score_id' => PphScore::factory(),
            'tahun' => fake()->numberBetween(2020, 2030),
            'pph_food_group_id' => PphFoodGroup::factory(),
            'energi' => $energi,
            'ake_percentage' => $ake,
            'bobot' => $bobot,
            'skor_riil' => $skorRiil,
            'skor_pph' => $skorPph,
            'skor_maksimal' => $skorMaksimal,
            'keterangan' => null,
            'created_by' => null,
        ];
    }
}
