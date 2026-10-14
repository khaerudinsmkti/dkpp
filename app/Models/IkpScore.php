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
}
