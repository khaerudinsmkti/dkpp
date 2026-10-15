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
            'unit' => 'Prioritas (1-6)',
            'description' => 'Indeks gabungan akumulasi seluruh indikator ketersediaan, keterjangkauan, dan pemanfaatan pangan untuk menentukan klasifikasi kerentanan desa.',
        ],
        'ikp' => [
            'label' => 'Indeks Ketahanan Pangan (IKP)',
            'short' => 'IKP',
            'unit' => 'Skor (0-100)',
            'description' => 'Nilai komposit ketahanan pangan desa berdasarkan metodologi IKP Bapanas.',
        ],
        'ncpr' => [
            'label' => 'Rasio Konsumsi Kalori (NCPR)',
            'short' => 'NCPR',
            'unit' => 'Rasio',
            'description' => 'Net Calorie Availability Ratio: Rasio kebutuhan konsumsi normatif energi per kapita terhadap produksi pangan bersih.',
        ],
        'energy' => [
            'label' => 'Kecukupan Energi',
            'short' => 'Energi',
            'unit' => 'kkal/kapita/hari',
            'description' => 'Rata-rata ketersediaan dan konsumsi kalori energi penduduk per hari (standar Angka Kecukupan Energi/AKE).',
        ],
        'protein' => [
            'label' => 'Kecukupan Protein',
            'short' => 'Protein',
            'unit' => 'gram/kapita/hari',
            'description' => 'Rata-rata konsumsi protein harian per kapita (standar Angka Kecukupan Protein/AKP).',
        ],
        'food_reserves' => [
            'label' => 'Cadangan Pangan',
            'short' => 'Cadangan',
            'unit' => 'ton',
            'description' => 'Kuantitas cadangan pangan pokok desa atau lumbung pangan masyarakat.',
        ],
        'poverty' => [
            'label' => 'Persentase Kemiskinan',
            'short' => 'Kemiskinan',
            'unit' => '%',
            'description' => 'Persentase penduduk yang hidup di bawah garis kemiskinan pada tingkat desa.',
        ],
        'price_cv' => [
            'label' => 'Variabilitas Harga (Price CV)',
            'short' => 'Price CV',
            'unit' => '%',
            'description' => 'Koefisien variasi fluktuasi harga komoditas pangan pokok strategis di tingkat lokal.',
        ],
        'pou' => [
            'label' => 'Prevalensi Ketidakcukupan Pangan (PoU)',
            'short' => 'PoU',
            'unit' => '%',
            'description' => 'Prevalence of Undernourishment: Estimasi proporsi penduduk dengan asupan energi tidak mencukupi kebutuhan minimum.',
        ],
        'female_school' => [
            'label' => 'Lama Sekolah Perempuan',
            'short' => 'Sekolah Perempuan',
            'unit' => 'tahun',
            'description' => 'Rata-rata lama sekolah perempuan usia 15 tahun ke atas sebagai cerminan pengetahuan gizi dan pengasuhan keluarga.',
        ],
        'no_water' => [
            'label' => 'Tanpa Akses Air Bersih',
            'short' => 'Tanpa Air',
            'unit' => '%',
            'description' => 'Persentase rumah tangga yang belum memiliki akses terhadap sumber air minum terlindung/layak.',
        ],
        'pph' => [
            'label' => 'Pola Pangan Harapan (PPH)',
            'short' => 'Skor PPH',
            'unit' => 'Skor (0-100)',
            'description' => 'Skor mutu gizi dan keragaman konsumsi makanan berdasarkan 9 kelompok pangan.',
        ],
        'stunting' => [
            'label' => 'Prevalensi Balita Stunting',
            'short' => 'Stunting',
            'unit' => '%',
            'description' => 'Persentase balita pendek dan sangat pendek berdasarkan pengukuran tinggi/panjang badan menurut umur.',
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