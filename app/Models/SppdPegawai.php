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
     * Normalisasi golongan (misal "IV/c" -> "Golongan IV", "PPPK" -> "Golongan II" setara Gol I & II) untuk pencocokan zonasi.
     */
    public static function normalizeGolonganGroup(?string $golongan): string
    {
        if (! $golongan) {
            return 'Golongan III';
        }

        $upper = strtoupper(trim($golongan));
        if (str_contains($upper, 'PPPK') || str_contains($upper, 'P3K')) {
            return 'Golongan II';
        }
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

    /**
     * Urutan peringkat golongan dari tertinggi ke terendah untuk pengurutan Master Pegawai.
     * PNS (IV/e .. I/a) di atas, PPPK/P3K di paling bawah.
     */
    public static function golonganRank(?string $golongan, ?string $pangkat = null): int
    {
        $raw = strtoupper(trim((string) $golongan));
        $pangkatUp = strtoupper(trim((string) $pangkat));

        if ($raw === '' && $pangkatUp === '') {
            return 0;
        }

        // PPPK / P3K selalu di paling bawah (di bawah PNS Golongan I/a)
        if (
            str_contains($raw, 'PPPK')
            || str_contains($raw, 'P3K')
            || str_contains($pangkatUp, 'PPPK')
            || str_contains($pangkatUp, 'P3K')
            || preg_match('/^(IX|VIII|VII|VI|V|X|XI|XII)$/', $raw)
        ) {
            if (preg_match('/\bXI\b/', $raw)) {
                return 9;
            }
            if (preg_match('/\bX\b/', $raw)) {
                return 8;
            }
            if (preg_match('/\bIX\b/', $raw)) {
                return 7;
            }
            if (preg_match('/\bVII\b/', $raw)) {
                return 5;
            }
            if (preg_match('/\bV\b/', $raw)) {
                return 3;
            }

            return 1;
        }

        $compact = str_replace([' ', '.'], ['', '/'], $raw);

        $rankMap = [
            'IV/E' => 27,
            'IV/D' => 26,
            'IV/C' => 25,
            'IV/B' => 24,
            'IV/A' => 23,
            'III/D' => 22,
            'III/C' => 21,
            'III/B' => 20,
            'III/A' => 19,
            'II/D' => 18,
            'II/C' => 17,
            'II/B' => 16,
            'II/A' => 15,
            'I/D' => 14,
            'I/C' => 13,
            'I/B' => 12,
            'I/A' => 11,
        ];

        if (isset($rankMap[$compact])) {
            return $rankMap[$compact];
        }

        // Tangkap pola seperti "GOL. III/D" atau "PENATA TK. I / III/D"
        foreach ($rankMap as $key => $score) {
            if (str_contains($compact, $key)) {
                return $score;
            }
        }

        if (str_contains($compact, 'IV')) {
            return 23;
        }
        if (str_contains($compact, 'III')) {
            return 19;
        }
        if (str_contains($compact, 'II')) {
            return 15;
        }
        if (str_contains($compact, 'I')) {
            return 11;
        }

        return 0;
    }
}
