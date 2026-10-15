<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Skpg extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'skpgs';

    /**
     * 31 Kecamatan di Kabupaten Indramayu (urutan resmi SKPG)
     *
     * @var list<string>
     */
    public const KECAMATAN_LIST = [
        'HAURGEULIS',
        'KROYA',
        'GABUSWETAN',
        'CIKEDUNG',
        'LELEA',
        'BANGODUA',
        'WIDASARI',
        'KERTASEMAYA',
        'KRANGKENG',
        'KARANGAMPEL',
        'JUNTINYUAT',
        'SLIYEG',
        'JATIBARANG',
        'BALONGAN',
        'INDRAMAYU',
        'SINDANG',
        'CANTIGI',
        'LOHBENER',
        'ARAHAN',
        'LOSARANG',
        'KANDANGHAUR',
        'BONGAS',
        'ANJATAN',
        'SUKRA',
        'GANTAR',
        'TRISI',
        'SUKAGUMIWANG',
        'KEDOKAN BUNDER',
        'PASEKAN',
        'TUKDANA',
        'PATROL',
    ];

    /**
     * Kode BPS untuk tiap kecamatan
     *
     * @var array<string, string>
     */
    public const KECAMATAN_CODES = [
        'HAURGEULIS' => '3212010',
        'GANTAR' => '3212011',
        'KROYA' => '3212020',
        'GABUSWETAN' => '3212030',
        'CIKEDUNG' => '3212040',
        'TRISI' => '3212041',
        'TERISI' => '3212041',
        'LELEA' => '3212050',
        'BANGODUA' => '3212060',
        'TUKDANA' => '3212061',
        'WIDASARI' => '3212070',
        'KERTASEMAYA' => '3212080',
        'SUKAGUMIWANG' => '3212081',
        'KRANGKENG' => '3212090',
        'KARANGAMPEL' => '3212100',
        'KEDOKAN BUNDER' => '3212101',
        'JUNTINYUAT' => '3212110',
        'SLIYEG' => '3212120',
        'JATIBARANG' => '3212130',
        'BALONGAN' => '3212140',
        'INDRAMAYU' => '3212150',
        'SINDANG' => '3212160',
        'CANTIGI' => '3212161',
        'PASEKAN' => '3212162',
        'LOHBENER' => '3212170',
        'ARAHAN' => '3212171',
        'LOSARANG' => '3212180',
        'KANDANGHAUR' => '3212190',
        'BONGAS' => '3212200',
        'ANJATAN' => '3212210',
        'SUKRA' => '3212220',
        'PATROL' => '3212221',
    ];

    /**
     * Daftar Indikator SKPG
     *
     * @var array<string, string>
     */
    public const INDICATORS = [
        'ikb' => 'Komposit (IKB)',
        'ik' => 'Ketersediaan (IK)',
        'ia' => 'Keterjangkauan (IA)',
        'ip' => 'Pemanfaatan (IP)',
        'potensi_kering' => 'Potensi Kering',
        'potensi_basah' => 'Potensi Basah',
        'kondisi_iklim' => 'Kondisi Iklim',
    ];

    /**
     * Nilai status resmi SKPG Ketahanan Pangan (IK, IA, IP, IKB)
     */
    public const STATUS_AMAN = 'AMAN';

    public const STATUS_WASPADA = 'WASPADA';

    public const STATUS_RENTAN = 'RENTAN';

    public const STATUS_LIST = [
        self::STATUS_AMAN,
        self::STATUS_WASPADA,
        self::STATUS_RENTAN,
    ];

    /**
     * Nilai status resmi Indikator Iklim & Bencana (Potensi Kering, Potensi Basah, Kondisi Iklim):
     * 4 Status: AMAN, WASPADA, SIAGA, AWAS
     */
    public const STATUS_SIAGA = 'SIAGA';

    public const STATUS_AWAS = 'AWAS';

    public const CLIMATE_STATUS_LIST = [
        self::STATUS_AMAN,
        self::STATUS_WASPADA,
        self::STATUS_SIAGA,
        self::STATUS_AWAS,
    ];

    public const ALL_STATUSES = [
        self::STATUS_AMAN,
        self::STATUS_WASPADA,
        self::STATUS_SIAGA,
        self::STATUS_AWAS,
        self::STATUS_RENTAN,
    ];

    /**
     * Daftar kunci indikator iklim / kebencanaan
     *
     * @var list<string>
     */
    public const CLIMATE_INDICATORS = [
        'potensi_kering',
        'potensi_basah',
        'kondisi_iklim',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kecamatan',
        'kode_kecamatan',
        'year',
        'month',
        'ik',
        'ia',
        'ip',
        'ikb',
        'potensi_kering',
        'potensi_basah',
        'kondisi_iklim',
        'keterangan',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
        ];
    }

    /**
     * Relasi ke user pembuat data
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Normalisasi nama kecamatan (menghubungkan TRISI dan TERISI)
     */
    public static function normalizeName(string $name): string
    {
        $clean = strtoupper(trim($name));
        if ($clean === 'TERISI') {
            return 'TRISI';
        }

        return $clean;
    }

    /**
     * Mendapatkan nama alias GeoJSON untuk kecamatan (misal TRISI -> TERISI)
     */
    public static function getGeoJsonName(string $name): string
    {
        $clean = strtoupper(trim($name));
        if ($clean === 'TRISI') {
            return 'TERISI';
        }

        return $clean;
    }
}
