<?php

namespace Database\Factories;

use App\Models\Cppd;
use App\Models\User;
use App\Services\IndramayuTerritoryService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cppd>
 */
class CppdFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $kecamatans = IndramayuTerritoryService::getKecamatanList();
        $kecamatan = fake()->randomElement($kecamatans ?: ['HAURGEULIS', 'INDRAMAYU', 'JATIBARANG']);
        $desas = IndramayuTerritoryService::getDesaList($kecamatan);
        $desa = fake()->randomElement($desas ?: ['HAURKOLOT', 'WANAKAYA']);

        $status = fake()->randomElement([
            Cppd::STATUS_PENGADAAN,
            Cppd::STATUS_PENYALURAN,
            Cppd::STATUS_ADDENDUM,
        ]);

        return [
            'tanggal' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'status' => $status,
            'kecamatan' => $kecamatan,
            'desa' => $desa,
            'jumlah' => fake()->randomFloat(2, 500, 25000),
            'keterangan' => fake()->sentence(),
            'created_by' => User::factory(),
        ];
    }

    /**
     * State for penyaluran.
     */
    public function penyaluran(): static
    {
        return $this->state(fn () => [
            'status' => Cppd::STATUS_PENYALURAN,
        ]);
    }

    /**
     * State for pengadaan.
     */
    public function pengadaan(): static
    {
        return $this->state(fn () => [
            'status' => Cppd::STATUS_PENGADAAN,
        ]);
    }

    /**
     * State for addendum.
     */
    public function addendum(): static
    {
        return $this->state(fn () => [
            'status' => Cppd::STATUS_ADDENDUM,
        ]);
    }
}
