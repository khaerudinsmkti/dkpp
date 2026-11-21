<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'nama',
    'nip',
    'pangkat',
    'golongan',
    'jabatan',
    'tanggal_lahir',
    'is_active',
])]
class SppdPegawai extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Otomatis ekstrak tanggal lahir (YYYY-MM-DD) dari 8 digit pertama NIP.
     */
    public static function extractBirthDateFromNip(?string $nip): ?string
    {
        if (! $nip) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $nip);
        if (strlen($digits) < 8) {
            return null;
        }

        $year = (int) substr($digits, 0, 4);
        $month = (int) substr($digits, 4, 2);
        $day = (int) substr($digits, 6, 2);

        if ($year >= 1930 && $year <= 2025 && checkdate($month, $day, $year)) {
            return sprintf('%04d-%02d-%02d', $year, $month, $day);
        }

        return null;
    }

    /**
     * Normalisasi golongan (misal "IV/c" -> "Golongan IV") untuk pencocokan zonasi.
     */
    public static function normalizeGolonganGroup(?string $golongan): string
    {
        if (! $golongan) {
            return 'Golongan III';
        }

        $upper = strtoupper(trim($golongan));
        if (str_contains($upper, 'IV')) {
            return 'Golongan IV';
        }
        if (str_contains($upper, 'III')) {
            return 'Golongan III';
        }
        if (str_contains($upper, 'II')) {
            return 'Golongan II';
        }
        if (str_contains($upper, 'I')) {
            return 'Golongan I';
        }

        return $golongan;
    }
}
