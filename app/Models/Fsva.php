<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Fsva extends Model
{
    use HasFactory;

    protected $table = 'fsvas';

    protected $fillable = [
        'tahun',
        'kecamatan',
        'desa',
        'ncpr',
        'energy',
        'protein',
        'food_reserves',
        'poverty',
        'price_cv',
        'pou',
        'female_school',
        'no_water',
        'pph',
        'stunting',
        'ikp',
        'rank',
        'komposit',
        'keterangan',
        'created_by',
    ];

    protected $casts = [
        'tahun' => 'integer',
        'ncpr' => 'float',
        'energy' => 'float',
        'protein' => 'float',
        'food_reserves' => 'float',
        'poverty' => 'float',
        'price_cv' => 'float',
        'pou' => 'float',
        'female_school' => 'float',
        'no_water' => 'float',
        'pph' => 'float',
        'stunting' => 'float',
        'ikp' => 'float',
        'rank' => 'integer',
        'komposit' => 'integer',
    ];

    /**
     * 6 Tingkat Prioritas FSVA (Klasifikasi Resmi Ketahanan Pangan)
     */
    public const PRIORITIES = [
        1 => [
            'label' => 'Prioritas 1 (Sangat Rentan)',
            'short' => 'Sangat Rentan',
            'color' => '#dc2626',
            'bg_class' => 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
            'category' => 'rentan',
            'desc' => 'Tingkat kerentanan pangan sangat tinggi, memerlukan prioritas intervensi utama dan penanganan darurat.',
        ],
        2 => [
            'label' => 'Prioritas 2 (Rentan)',
            'short' => 'Rentan',
            'color' => '#ea580c',
            'bg_class' => 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
            'category' => 'rentan',
            'desc' => 'Tingkat kerentanan pangan tinggi, memerlukan penanganan program pengentasan kerawanan pangan secara berkelanjutan.',
        ],
        3 => [
            'label' => 'Prioritas 3 (Agak Rentan)',
            'short' => 'Agak Rentan',
            'color' => '#f59e0b',
            'bg_class' => 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
            'category' => 'rentan',
            'desc' => 'Tingkat kerentanan pangan sedang menuju rentan, memerlukan penguatan akses pangan dan pemantauan berkala.',
        ],
        4 => [
            'label' => 'Prioritas 4 (Agak Tahan)',
            'short' => 'Agak Tahan',
            'color' => '#84cc16',
            'bg_class' => 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/40 dark:text-lime-400 dark:border-lime-800',
            'category' => 'aman',
            'desc' => 'Tingkat ketahanan pangan cukup baik, berada pada ambang batas aman namun perlu dipertahankan stabilitasnya.',
        ],
        5 => [
            'label' => 'Prioritas 5 (Tahan)',
            'short' => 'Tahan',
            'color' => '#10b981',
            'bg_class' => 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
            'category' => 'aman',
            'desc' => 'Tingkat ketahanan pangan aman dan stabil dengan ketersediaan dan pemanfaatan pangan yang mencukupi.',
        ],
        6 => [
            'label' => 'Prioritas 6 (Sangat Tahan)',
            'short' => 'Sangat Tahan',
            'color' => '#047857',
            'bg_class' => 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
            'category' => 'aman',
            'desc' => 'Tingkat ketahanan pangan sangat mandiri dan kuat pada seluruh pilar ketersediaan, akses, dan pemanfaatan.',
        ],
    ];

    /**
     * Daftar 13 Indikator FSVA
     */
    public const INDICATORS = [
        'komposit' => [
            'label' => 'Komposit FSVA (Prioritas 1-6)',
            'short' => 'Komposit',
            'pillar' => 'Semua Pilar',
            'unit' => 'Prioritas (1-6)',
            'description' => 'Indeks gabungan akumulasi seluruh indikator ketersediaan, keterjangkauan, dan pemanfaatan pangan untuk menentukan klasifikasi kerentanan desa.',
        ],
        'ncpr' => [
            'label' => 'Rasio Konsumsi Normatif Per Kapita (NCPR)',
            'short' => 'NCPR',
            'pillar' => 'Ketersediaan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Rasio konsumsi normatif per kapita terhadap produksi beras/pangan bersih di desa (Skor Prioritas 1-6).',
        ],
        'energy' => [
            'label' => 'Ketersediaan Energi',
            'short' => 'Energi',
            'pillar' => 'Ketersediaan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Tingkat ketersediaan kalori energi penduduk per hari (Skor Prioritas 1-6).',
        ],
        'protein' => [
            'label' => 'Ketersediaan Protein Hewani',
            'short' => 'Protein',
            'pillar' => 'Ketersediaan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Tingkat ketersediaan dan konsumsi protein hewani harian per kapita (Skor Prioritas 1-6).',
        ],
        'food_reserves' => [
            'label' => 'Cadangan Pangan',
            'short' => 'Cadangan Pangan',
            'pillar' => 'Ketersediaan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Kuantitas cadangan beras pemerintah dan lumbung pangan masyarakat (Skor Prioritas 1-6).',
        ],
        'poverty' => [
            'label' => 'Penduduk Miskin (Kemiskinan)',
            'short' => 'Kemiskinan',
            'pillar' => 'Keterjangkauan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Tingkat kerentanan kemiskinan penduduk pada tingkat desa (Skor Prioritas 1-6).',
        ],
        'price_cv' => [
            'label' => 'Koefisien Variasi Harga Pangan (Price CV)',
            'short' => 'Price CV',
            'pillar' => 'Keterjangkauan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Variasi dan fluktuasi harga komoditas pangan pokok strategis (Skor Prioritas 1-6).',
        ],
        'pou' => [
            'label' => 'Prevalence of Undernourishment (PoU)',
            'short' => 'PoU',
            'pillar' => 'Keterjangkauan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Estimasi prevalensi ketidakcukupan konsumsi pangan penduduk desa (Skor Prioritas 1-6).',
        ],
        'female_school' => [
            'label' => 'Rata-rata Lama Sekolah Perempuan',
            'short' => 'Sekolah Perempuan',
            'pillar' => 'Pemanfaatan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Rata-rata lama sekolah perempuan usia 15 tahun ke atas (Skor Prioritas 1-6).',
        ],
        'no_water' => [
            'label' => 'Rumah Tangga Tanpa Akses Air Bersih (Tanpa Air)',
            'short' => 'Tanpa Air',
            'pillar' => 'Pemanfaatan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Tingkat rumah tangga tanpa akses terhadap air minum layak/bersih (Skor Prioritas 1-6).',
        ],
        'pph' => [
            'label' => 'Skor Pola Pangan Harapan (PPH) Konsumsi',
            'short' => 'PPH',
            'pillar' => 'Pemanfaatan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Mutu dan keragaman gizi konsumsi pangan masyarakat desa (Skor Prioritas 1-6).',
        ],
        'stunting' => [
            'label' => 'Balita Stunting (Stunting)',
            'short' => 'Stunting',
            'pillar' => 'Pemanfaatan',
            'unit' => 'Nilai (1-6)',
            'description' => 'Tingkat prevalensi balita stunting akibat kekurangan gizi kronis (Skor Prioritas 1-6).',
        ],
    ];

    public const VILLAGE_DATA = [
        'ANJATAN' => [
            'MANGUNJAYA',
            'BUGISTUA',
            'BUGIS',
            'SALAMDARMA',
            'KEDUNGWUNGU',
            'WANGUK',
            'LEMPUYANG',
            'KOPYAH',
            'ANJATAN BARU',
            'ANJATAN',
            'CILANDAK',
            'CILANDAK LOR',
            'ANJATAN UTARA',
        ],
        'ARAHAN' => [
            'SUKASARI',
            'ARAHAN KIDUL',
            'ARAHAN LOR',
            'LINGGAJATI',
            'TAWANGSARI',
            'SUKADADI',
            'PRANGGONG',
            'CIDEMPET',
        ],
        'BALONGAN' => [
            'TEGALSEMBADRA',
            'SUKAREJA',
            'SUKAURIP',
            'RAWADALEM',
            'GELARMENDALA',
            'TEGALURUNG',
            'BALONGAN',
            'SUDIMAMPIR',
            'SUDIMAMPIRLOR',
            'MAJAKERTA',
        ],
        'BANGODUA' => [
            'MULYASARI',
            'BANGODUA',
            'BEDUYUT',
            'KARANGGETAS',
            'TEGALGIRANG',
            'WANASARI',
            'MALANGSARI',
            'RANCASARI',
        ],
        'BONGAS' => [
            'CIPEDANG',
            'SIDAMULYA',
            'MARGAMULYA',
            'KERTAJAYA',
            'BONGAS',
            'CIPAAT',
            'KERTAMULYA',
            'PLAWANGAN',
        ],
        'CANTIGI' => [
            'CANGKRING',
            'CANTIGI KULON',
            'CANTIGI WETAN',
            'PANYINGKIRAN LOR',
            'PANYINGKIRAN KIDUL',
            'LAMARANTARUNG',
            'CEMARA',
        ],
        'CIKEDUNG' => [
            'LOYANG',
            'AMIS',
            'JATISURA',
            'JAMBAK',
            'CIKEDUNG',
            'CIKEDUNG LOR',
            'MUNDAKJAYA',
        ],
        'GABUSWETAN' => [
            'KEDUNGDAWA',
            'BABAKANJAYA',
            'GABUSKULON',
            'SEKARMULYA',
            'KEDOKANGABUS',
            'RANCAMULYA',
            'RANCAHAN',
            'GABUSWETAN',
            'DRUNTEN WETAN',
            'DRUNTEN KULON',
        ],
        'GANTAR' => [
            'BANTARWARU',
            'SANCA',
            'MEKARJAYA',
            'GANTAR',
            'SITURAJA',
            'BALERAJA',
            'MEKARWARU',
        ],
        'HAURGEULIS' => [
            'HAURKOLOT',
            'HAURGEULIS',
            'SUKAJATI',
            'WANAKAYA',
            'KARANGTUMARITIS',
            'KERTANEGARA',
            'CIPANCUH',
            'MEKARJATI',
            'SIDADADI',
            'SUMBERMULYA',
        ],
        'INDRAMAYU' => [
            'TELUKAGUNG',
            'PLUMBON',
            'DUKUH',
            'PEKANDANGAN JAYA',
            'SINGARAJA',
            'SINGAJAYA',
            'PEKANDANGAN',
            'BOJONGSARI',
            'KEPANDEAN',
            'KARANGMALANG',
            'KARANGANYAR',
            'LEMAHMEKAR',
            'LEMAHABANG',
            'MARGADADI',
            'PAOMAN',
            'KARANGSONG',
            'PABEANUDIK',
            'TAMBAK',
        ],
        'JATIBARANG' => [
            'SUKALILA',
            'PILANGSARI',
            'JATIBARANG BARU',
            'BULAK',
            'BULAK LOR',
            'JATIBARANG',
            'KEBULEN',
            'PAWIDEAN',
            'JATISAWIT',
            'JATISAWIT LOR',
            'KRASAK',
            'KALIMATI',
            'MALANGSEMIRANG',
            'LOBENER',
            'LOBENER LOR',
        ],
        'JUNTINYUAT' => [
            'SEGERAN KIDUL',
            'SEGERAN',
            'JUNTIWEDEN',
            'JUNTIKEBON',
            'DADAP',
            'JUNTINYUAT',
            'JUNTIKEDOKAN',
            'PONDOH',
            'SAMBIMAYA',
            'TINUMPUK',
            'LOMBANG',
            'LIMBANGAN',
        ],
        'KANDANGHAUR' => [
            'CURUG',
            'PRANTI',
            'WIRAKANAN',
            'KARANGMULYA',
            'KARANGANYAR',
            'WIRAPANJUNAN',
            'PAREAN GIRANG',
            'BULAK',
            'ILIR',
            'SOGE',
            'ERETAN WETAN',
            'ERETAN KULON',
            'KERTAWINANGUN',
        ],
        'KARANGAMPEL' => [
            'KAPLONGANLOR',
            'TANJUNGPURA',
            'TANJUNGSARI',
            'PRINGGACALA',
            'BENDA',
            'SENDANG',
            'KARANGAMPEL KIDUL',
            'KARANGAMPEL',
            'DUKUHJERUK',
            'DUKUHTENGAH',
            'MUNDU',
        ],
        'KEDOKAN BUNDER' => [
            'KEDOKANBUNDER WETAN',
            'KAPLONGAN',
            'KEDOKAN AGUNG',
            'KEDOKANBUNDER',
            'JAYAWINANGUN',
            'CANGKINGAN',
            'JAYALAKSANA',
        ],
        'KERTASEMAYA' => [
            'TULUNGAGUNG',
            'JENGKOK',
            'TEGALWIRANGRONG',
            'MANGUNTARA',
            'JAMBE',
            'LEMAHAYU',
            'TENAJAR KIDUL',
            'KERTASEMAYA',
            'KLIWED',
            'TENAJAR',
            'LARANGANJAMBE',
            'TENAJAR LOR',
            'SUKAWERA',
        ],
        'KRANGKENG' => [
            'PURWAJAYA',
            'KAPRINGAN',
            'SINGAKERTA',
            'DUKUHJATI',
            'TEGALMULYA',
            'KEDUNGWUNGU',
            'SRENGSENG',
            'LUWUNGGESIK',
            'KALIANYAR',
            'KRANGKENG',
            'TANJAKAN',
        ],
        'KROYA' => [
            'SUKASLAMET',
            'TANJUNGKERTA',
            'KROYA',
            'SUMBON',
            'SUKAMELANG',
            'TEMIYANG',
            'TEMIYANGSARI',
            'JAYAMULYA',
            'SUMBERJAYA',
        ],
        'LELEA' => [
            'TUNGGULPAYUNG',
            'TUGU',
            'NUNUK',
            'TEMPEL',
            'PANGAUBAN',
            'TELAGASARI',
            'LANGGENGSARI',
            'TAMANSARI',
            'LELEA',
            'CEMPEH',
            'TEMPELKULON',
        ],
        'LOHBENER' => [
            'KIAJARAN KULON',
            'KIJARAN WETAN',
            'LANJAN',
            'LANGUT',
            'LARANGAN',
            'WARU',
            'LEGOK',
            'BOJONGSLAWI',
            'LOHBENER',
            'PAMAYAHAN',
            'SINDANGKERTA',
            'RAMBATAN KULON',
        ],
        'LOSARANG' => [
            'RANJENG',
            'KRIMUN',
            'PUNTANG',
            'PEGAGAN',
            'RAJAIYANG',
            'JANGGA',
            'JUMBLENG',
            'PANGKALAN',
            'LOSARANG',
            'MUNTUR',
            'SANTING',
            'CEMARA KULON',
        ],
        'PASEKAN' => [
            'PAGIRIKAN',
            'PASEKAN',
            'BRONDONG',
            'PABEANILIR',
            'TOTORAN',
            'KARANGANYAR',
        ],
        'PATROL' => [
            'LIMPAS',
            'PATROL',
            'ARJASARI',
            'SUKAHAJI',
            'BUGEL',
            'PATROLLOR',
            'PATROL BARU',
            'MEKARSARI',
        ],
        'SINDANG' => [
            'PANYINDANGAN KULON',
            'RAMBATAN WETAN',
            'PANYINDANGAN WETAN',
            'KENANGA',
            'TERUSAN',
            'DERMAYU',
            'SINDANG',
            'PENGANJANG',
            'BABADAN',
            'WANANTARA',
        ],
        'SLIYEG' => [
            'SLEMAN',
            'TAMBI',
            'SUDIKAMPIRAN',
            'TAMBI LOR',
            'SLEMAN LOR',
            'MAJASARI',
            'MAJASIH',
            'SLIYEG',
            'GADINGAN',
            'MEKARGADING',
            'SLIYEGLOR',
            'TUGU KIDUL',
            'TUGU',
            'LONGOK',
        ],
        'SUKAGUMIWANG' => [
            'CIBEBER',
            'BONDAN',
            'GUNUNGSARI',
            'SUKAGUMIWANG',
            'TERSANA',
            'CADANGPINGGAN',
            'GEDANGAN',
        ],
        'SUKRA' => [
            'BOGOR',
            'SUKRA',
            'UJUNGGEBANG',
            'TEGALTAMAN',
            'SUKRAWETAN',
            'SUMURADEM',
            'SUMURADEM TIMUR',
            'KARANGLAYUNG',
        ],
        'TERISI' => [
            'CIKAWUNG',
            'JATIMUNGGUL',
            'JATIMULYA',
            'PLOSOKEREP',
            'RAJASINGA',
            'KARANGASEM',
            'CIBERENG',
            'KENDAYAKAN',
            'MANGGUNGAN',
        ],
        'TUKDANA' => [
            'BODAS',
            'GADEL',
            'RANCAJAWAT',
            'KERTICALA',
            'SUKAMULYA',
            'KARANGKERTA',
            'CANGKO',
            'PAGEDANGAN',
            'SUKAPERNA',
            'SUKADANA',
            'TUKDANA',
            'LAJER',
            'MEKARSARI',
        ],
        'WIDASARI' => [
            'BANGKALOA ILIR',
            'WIDASARI',
            'KALENSARI',
            'BUNDER',
            'UJUNGARIS',
            'KONGSIJAYA',
            'UJUNGJAYA',
            'UJUNGPENDOKJAYA',
            'LEUWIGEDE',
            'KASMARAN',
        ],
    ];


    /**
     * User who created or last imported this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Normalize name for matching.
     */
    public static function normalizeName(string $name): string
    {
        return strtoupper(trim(preg_replace('/[^A-Za-z0-9]/', '', $name)));
    }

    /**
     * Get Priority info helper.
     */
    public static function getPriorityInfo(int $priority): array
    {
        return self::PRIORITIES[$priority] ?? self::PRIORITIES[1];
    }

    /**
     * Get all kecamatan list.
     *
     * @return list<string>
     */
    public static function getKecamatanList(): array
    {
        return array_keys(self::VILLAGE_DATA);
    }

    /**
     * Get all villages as flat array.
     *
     * @return array<int, array{kecamatan: string, desa: string}>
     */
    public static function getAllVillages(): array
    {
        $all = [];
        foreach (self::VILLAGE_DATA as $kec => $desas) {
            foreach ($desas as $desa) {
                $all[] = [
                    'kecamatan' => $kec,
                    'desa' => $desa,
                ];
            }
        }

        return $all;
    }
}