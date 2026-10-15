<?php

namespace App\Services;

class IndramayuTerritoryService
{
    /**
     * @var array<string, list<string>>|null
     */
    protected static ?array $desaByKecamatan = null;

    /**
     * @var array<string, array<string, array{lon: float, lat: float, svgX: float, svgY: float}>>|null
     */
    protected static ?array $centroids = null;

    /**
     * Load territory data from JSON cache or source file.
     */
    protected static function load(): void
    {
        if (self::$desaByKecamatan !== null) {
            return;
        }

        $cachePath = resource_path('js/data/indramayu-desa.json');
        if (file_exists($cachePath)) {
            $json = json_decode((string) file_get_contents($cachePath), true);
            self::$desaByKecamatan = $json['desa_by_kecamatan'] ?? [];
            self::$centroids = $json['desa_centroids'] ?? [];

            return;
        }

        // Fallback to storage/peta/indramayu_desa.json
        $sourcePath = storage_path('peta/indramayu_desa.json');
        if (! file_exists($sourcePath)) {
            self::$desaByKecamatan = [];
            self::$centroids = [];

            return;
        }

        $source = json_decode((string) file_get_contents($sourcePath), true);
        $data = [];
        foreach ($source['features'] ?? [] as $f) {
            $kec = strtoupper(trim((string) ($f['properties']['KECAMATAN'] ?? '')));
            $desa = strtoupper(trim((string) ($f['properties']['DESA'] ?? '')));
            if ($kec === '' || $desa === '') {
                continue;
            }
            if (! isset($data[$kec])) {
                $data[$kec] = [];
            }
            if (! in_array($desa, $data[$kec], true)) {
                $data[$kec][] = $desa;
            }
        }

        ksort($data);
        foreach ($data as &$desas) {
            sort($desas);
        }

        self::$desaByKecamatan = $data;
        self::$centroids = [];
    }

    /**
     * Get sorted list of all 31 kecamatan in Indramayu.
     *
     * @return list<string>
     */
    public static function getKecamatanList(): array
    {
        self::load();

        return array_keys(self::$desaByKecamatan ?? []);
    }

    /**
     * Get associative array of [Kecamatan => [Desa1, Desa2, ...]].
     *
     * @return array<string, list<string>>
     */
    public static function getDesaByKecamatan(): array
    {
        self::load();

        return self::$desaByKecamatan ?? [];
    }

    /**
     * Get all desa for a specific kecamatan.
     *
     * @return list<string>
     */
    public static function getDesaList(?string $kecamatan): array
    {
        self::load();
        $kec = strtoupper(trim((string) $kecamatan));

        return self::$desaByKecamatan[$kec] ?? [];
    }

    /**
     * Check if a kecamatan name is valid in Indramayu.
     */
    public static function isValidKecamatan(?string $kecamatan): bool
    {
        self::load();
        $kec = strtoupper(trim((string) $kecamatan));

        return isset(self::$desaByKecamatan[$kec]);
    }

    /**
     * Check if a desa name is valid in a kecamatan.
     */
    public static function isValidDesa(?string $kecamatan, ?string $desa): bool
    {
        self::load();
        $kec = strtoupper(trim((string) $kecamatan));
        $des = strtoupper(trim((string) $desa));

        if (! isset(self::$desaByKecamatan[$kec])) {
            return false;
        }

        return in_array($des, self::$desaByKecamatan[$kec], true);
    }

    /**
     * Get centroids coordinate data for desas.
     *
     * @return array<string, array<string, array{lon: float, lat: float, svgX: float, svgY: float}>>
     */
    public static function getCentroids(): array
    {
        self::load();

        return self::$centroids ?? [];
    }
}
