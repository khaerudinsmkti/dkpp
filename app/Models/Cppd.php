<?php

namespace App\Models;

use Database\Factories\CppdFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cppd extends Model
{
    /** @use HasFactory<CppdFactory> */
    use HasFactory;

    public const STATUS_PENGADAAN = 'pengadaan';

    public const STATUS_PENYALURAN = 'penyaluran';

    public const STATUS_ADDENDUM = 'addendum';

    public const STATUSES = [
        self::STATUS_PENGADAAN => 'Pengadaan',
        self::STATUS_PENYALURAN => 'Penyaluran',
        self::STATUS_ADDENDUM => 'Addendum',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tanggal',
        'status',
        'kecamatan',
        'desa',
        'jumlah',
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
            'tanggal' => 'date:Y-m-d',
            'jumlah' => 'decimal:2',
        ];
    }

    /**
     * User who created this record.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Normalize status value.
     */
    public static function normalizeStatus(?string $status): string
    {
        $status = strtolower(trim((string) $status));
        if ($status === 'addendum' || $status === 'adendum') {
            return self::STATUS_ADDENDUM;
        }
        if ($status === 'pengadaan') {
            return self::STATUS_PENGADAAN;
        }

        return self::STATUS_PENYALURAN;
    }
}
