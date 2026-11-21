<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'slug',
    'description',
    'color',
    'is_system',
    'is_active',
    'permissions',
])]
class Role extends Model
{
    /**
     * Daftar aksi standar pada matriks hak akses.
     *
     * @var array<string, array{key: string, label: string, short: string, description: string}>
     */
    public const ACTIONS = [
        'view' => [
            'key' => 'view',
            'label' => 'Lihat & Akses',
            'short' => 'Lihat',
            'description' => 'Melihat halaman modul dan daftar data di menu admin',
        ],
        'create' => [
            'key' => 'create',
            'label' => 'Tambah Data',
            'short' => 'Tambah',
            'description' => 'Menambahkan data baru atau input form harian/bulanan',
        ],
        'update' => [
            'key' => 'update',
            'label' => 'Ubah Data',
            'short' => 'Ubah',
            'description' => 'Memperbarui data yang sudah ada atau mengubah status aktif',
        ],
        'delete' => [
            'key' => 'delete',
            'label' => 'Hapus Data',
            'short' => 'Hapus',
            'description' => 'Menghapus rekaman data dari sistem',
        ],
        'import_export' => [
            'key' => 'import_export',
            'label' => 'Import / Export & Bulk',
            'short' => 'Import/Export',
            'description' => 'Mengimpor file Excel, input massal (copy-paste), dan unduh laporan',
        ],
    ];

    /**
     * Daftar modul sistem DKPP untuk matriks hak akses.
     *
     * @var array<int, array{key: string, name: string, category: string, route_hint: string, description: string}>
     */
    public const MODULES = [
        [
            'key' => 'dashboard',
            'name' => 'Dashboard Utama',
            'category' => 'Menu Utama',
            'route_hint' => '/dashboard',
            'description' => 'Ringkasan eksekutif seluruh indikator ketahanan pangan daerah',
        ],
        [
            'key' => 'ikp',
            'name' => 'Indeks Ketahanan Pangan (IKP)',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/ikp-scores',
            'description' => 'Pengelolaan skor komposit IKP tahunan dan indikator pendukung',
        ],
        [
            'key' => 'skpg',
            'name' => 'SKPG (Kewaspadaan Pangan & Gizi)',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/skpg-admin',
            'description' => 'Pengelolaan peta peringatan dini kerawanan pangan per kecamatan',
        ],
        [
            'key' => 'fsva',
            'name' => 'FSVA (Peta Kerentanan Pangan)',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/fsva-admin',
            'description' => 'Pengelolaan data indeks komposit FSVA dan prioritas wilayah',
        ],
        [
            'key' => 'cppd',
            'name' => 'CPPD (Cadangan Pangan Daerah)',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/cppd-admin',
            'description' => 'Pencatatan stok awal, pengadaan, dan penyaluran cadangan pangan',
        ],
        [
            'key' => 'consumer_prices',
            'name' => 'Harga Pangan Konsumen',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/consumer-prices',
            'description' => 'Pencatatan harga harian 25 komoditas pangan tingkat konsumen per pasar',
        ],
        [
            'key' => 'producer_prices',
            'name' => 'Harga Pangan Produsen',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/producer-prices',
            'description' => 'Pencatatan harga harian komoditas gabah, beras, dan pangan tingkat produsen',
        ],
        [
            'key' => 'food_balances',
            'name' => 'Neraca Pangan Bulanan',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/food-balances',
            'description' => 'Rekapitulasi ketersediaan, kebutuhan, dan surplus/defisit pangan bulanan',
        ],
        [
            'key' => 'pph_scores',
            'name' => 'Skor PPH & Detail Skor PPH',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/pph-scores & /pph-score-details',
            'description' => 'Perhitungan skor Pola Pangan Harapan (PPH) ketersediaan/konsumsi',
        ],
        [
            'key' => 'hets_haps',
            'name' => 'Kelola HET Konsumen & HAP Produsen',
            'category' => 'Pemantauan Pangan',
            'route_hint' => '/hets & /producer-haps',
            'description' => 'Pengaturan Harga Eceran Tertinggi (HET) dan Harga Acuan Pembelian (HAP)',
        ],
        [
            'key' => 'commodities',
            'name' => 'Master Komoditas (Konsumen, Produsen, Neraca)',
            'category' => 'Data Master',
            'route_hint' => '/commodities, /producer-commodities, /food-balance-commodities',
            'description' => 'Pengelolaan daftar komoditas, satuan, kategori, dan foto komoditas',
        ],
        [
            'key' => 'pph_food_groups',
            'name' => 'Master Kelompok Pangan PPH',
            'category' => 'Data Master',
            'route_hint' => '/pph-food-groups',
            'description' => 'Pengelolaan 9 kelompok bahan pangan PPH, bobot, dan skor maksimal',
        ],
        [
            'key' => 'markets',
            'name' => 'Master Pasar Pantauan',
            'category' => 'Data Master',
            'route_hint' => '/markets',
            'description' => 'Pengelolaan lokasi pasar pantauan harga pangan di Kabupaten Indramayu',
        ],
        [
            'key' => 'sppd_dalam_kota',
            'name' => 'SPPD Dalam Kota & Master Perjalanan Dinas',
            'category' => 'Administrasi Sistem',
            'route_hint' => '/sppd-dalam-kota',
            'description' => 'Pembuatan SPT/SPPD Dalam Kota beserta Master Pegawai, Kepala Dinas, PPTK, Bendahara, dan Zonasi',
        ],
        [
            'key' => 'users_roles',
            'name' => 'Kelola User, Role & Matriks Hak Akses',
            'category' => 'Administrasi Sistem',
            'route_hint' => '/users-roles',
            'description' => 'Manajemen akun pengguna, peran organisasi, dan matriks otorisasi modul',
        ],
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'is_active' => 'boolean',
            'permissions' => 'array',
        ];
    }

    /**
     * Get the users assigned to this role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Build a complete normalized permission matrix for this role.
     *
     * @return array<string, array<string, bool>>
     */
    public function getNormalizedPermissions(): array
    {
        $raw = is_array($this->permissions) ? $this->permissions : [];
        $isSuper = $this->slug === 'super-admin';
        $normalized = [];

        foreach (self::MODULES as $module) {
            $mKey = $module['key'];
            $normalized[$mKey] = [];

            foreach (array_keys(self::ACTIONS) as $aKey) {
                if ($isSuper) {
                    $normalized[$mKey][$aKey] = true;
                } else {
                    $normalized[$mKey][$aKey] = (bool) ($raw[$mKey][$aKey] ?? false);
                }
            }
        }

        return $normalized;
    }

    /**
     * Check whether this role grants a specific permission on a module.
     */
    public function hasPermission(string $moduleKey, string $actionKey = 'view'): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->slug === 'super-admin') {
            return true;
        }

        $perms = is_array($this->permissions) ? $this->permissions : [];

        return (bool) ($perms[$moduleKey][$actionKey] ?? false);
    }

    /**
     * Helper to build a matrix map given allowed modules and actions.
     *
     * @param  array<string, array<int, string>|string>  $config
     * @return array<string, array<string, bool>>
     */
    public static function buildMatrix(array $config): array
    {
        $allActions = array_keys(self::ACTIONS);
        $matrix = [];

        foreach (self::MODULES as $mod) {
            $mKey = $mod['key'];
            $spec = $config[$mKey] ?? ($config['*'] ?? []);

            $allowedActions = [];
            if ($spec === '*' || $spec === 'all') {
                $allowedActions = $allActions;
            } elseif ($spec === 'crud') {
                $allowedActions = ['view', 'create', 'update', 'delete'];
            } elseif ($spec === 'operator') {
                $allowedActions = ['view', 'create', 'update', 'import_export'];
            } elseif ($spec === 'view') {
                $allowedActions = ['view'];
            } elseif (is_array($spec)) {
                $allowedActions = $spec;
            }

            $matrix[$mKey] = [];
            foreach ($allActions as $action) {
                $matrix[$mKey][$action] = in_array($action, $allowedActions, true);
            }
        }

        return $matrix;
    }

    /**
     * Default roles for DKPP Kabupaten Indramayu.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function defaultRoles(): array
    {
        return [
            [
                'name' => 'Super Administrator',
                'slug' => 'super-admin',
                'description' => 'Akses penuh ke seluruh modul pemantauan pangan, data master, serta manajemen pengguna & matriks hak akses.',
                'color' => 'emerald',
                'is_system' => true,
                'is_active' => true,
                'permissions' => self::buildMatrix(['*' => 'all']),
            ],
            [
                'name' => 'Admin Ketersediaan & Kerawanan Pangan',
                'slug' => 'admin-ketersediaan',
                'description' => 'Pengelola modul IKP, SKPG, FSVA, CPPD, dan Neraca Pangan Bulanan beserta komoditas neraca.',
                'color' => 'teal',
                'is_system' => true,
                'is_active' => true,
                'permissions' => self::buildMatrix([
                    'dashboard' => 'view',
                    'ikp' => 'all',
                    'skpg' => 'all',
                    'fsva' => 'all',
                    'cppd' => 'all',
                    'food_balances' => 'all',
                    'commodities' => ['view', 'create', 'update'],
                    'consumer_prices' => 'view',
                    'producer_prices' => 'view',
                    'pph_scores' => 'view',
                ]),
            ],
            [
                'name' => 'Admin Distribusi & Harga Pangan',
                'slug' => 'admin-distribusi',
                'description' => 'Pengelola modul Harga Konsumen, Harga Produsen, HET/HAP, Master Komoditas, dan Master Pasar.',
                'color' => 'blue',
                'is_system' => true,
                'is_active' => true,
                'permissions' => self::buildMatrix([
                    'dashboard' => 'view',
                    'consumer_prices' => 'all',
                    'producer_prices' => 'all',
                    'hets_haps' => 'all',
                    'commodities' => 'all',
                    'markets' => 'all',
                    'food_balances' => 'view',
                    'cppd' => 'view',
                ]),
            ],
            [
                'name' => 'Admin Konsumsi & Skor PPH',
                'slug' => 'admin-konsumsi',
                'description' => 'Pengelola modul Skor PPH, Detail Skor PPH, dan Master Kelompok Bahan Pangan PPH.',
                'color' => 'indigo',
                'is_system' => true,
                'is_active' => true,
                'permissions' => self::buildMatrix([
                    'dashboard' => 'view',
                    'pph_scores' => 'all',
                    'pph_food_groups' => 'all',
                    'food_balances' => 'view',
                    'ikp' => 'view',
                ]),
            ],
            [
                'name' => 'Enumerator / Petugas Pasar',
                'slug' => 'enumerator-pasar',
                'description' => 'Petugas lapangan pencatat data harian harga pangan tingkat konsumen dan produsen.',
                'color' => 'amber',
                'is_system' => false,
                'is_active' => true,
                'permissions' => self::buildMatrix([
                    'dashboard' => 'view',
                    'consumer_prices' => 'operator',
                    'producer_prices' => 'operator',
                    'hets_haps' => 'view',
                    'commodities' => 'view',
                    'markets' => 'view',
                ]),
            ],
            [
                'name' => 'Eksekutif / Pimpinan (Read-Only)',
                'slug' => 'eksekutif-viewer',
                'description' => 'Akses pemantauan dan unduh laporan di seluruh modul tanpa hak mengubah atau menghapus data.',
                'color' => 'purple',
                'is_system' => false,
                'is_active' => true,
                'permissions' => self::buildMatrix([
                    'dashboard' => ['view', 'import_export'],
                    'ikp' => ['view', 'import_export'],
                    'skpg' => ['view', 'import_export'],
                    'fsva' => ['view', 'import_export'],
                    'cppd' => ['view', 'import_export'],
                    'consumer_prices' => ['view', 'import_export'],
                    'producer_prices' => ['view', 'import_export'],
                    'food_balances' => ['view', 'import_export'],
                    'pph_scores' => ['view', 'import_export'],
                    'hets_haps' => ['view'],
                    'commodities' => ['view'],
                    'pph_food_groups' => ['view'],
                    'markets' => ['view'],
                ]),
            ],
        ];
    }
}
