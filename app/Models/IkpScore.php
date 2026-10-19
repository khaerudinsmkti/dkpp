<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IkpScore extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'ikp_scores';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tahun',
        'nilai_ikp',
        'target_renstra',
        'indeks_ketersediaan',
        'indeks_keterjangkauan',
        'indeks_pemanfaatan',
        'kelompok_ikp',
        'status_kerentanan',
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
            'tahun' => 'integer',
            'nilai_ikp' => 'float',
            'target_renstra' => 'float',
            'indeks_ketersediaan' => 'float',
            'indeks_keterjangkauan' => 'float',
            'indeks_pemanfaatan' => 'float',
        ];
    }

    /**
     * User who created or updated this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get status category based on standard Badan Pangan Nasional (Bapanas) IKP classification.
     */
    public function getCategoryAttribute(): string
    {
        if (!empty($this->attributes['status_kerentanan'])) {
            return (string) $this->attributes['status_kerentanan'];
        }

        $val = (float) $this->nilai_ikp;
        if ($val >= 80) {
            return 'Sangat Tahan';
        }
        if ($val >= 70) {
            return 'Tahan';
        }
        if ($val >= 60) {
            return 'Agak Tahan';
        }
        if ($val >= 50) {
            return 'Agak Rentan';
        }
        if ($val >= 40) {
            return 'Rentan';
        }

        return 'Sangat Rentan';
    }

    /**
     * Get default Kelompok IKP based on standard Badan Pangan Nasional classification.
     */
    public function getDefaultKelompokAttribute(): string
    {
        if (!empty($this->attributes['kelompok_ikp'])) {
            return (string) $this->attributes['kelompok_ikp'];
        }

        $val = (float) $this->nilai_ikp;
        if ($val >= 80) {
            return 'Kelompok 6';
        }
        if ($val >= 70) {
            return 'Kelompok 5';
        }
        if ($val >= 60) {
            return 'Kelompok 4';
        }
        if ($val >= 50) {
            return 'Kelompok 3';
        }
        if ($val >= 40) {
            return 'Kelompok 2';
        }

        return 'Kelompok 1';
    }
}
