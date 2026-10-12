<?php

namespace App\Models;

use Database\Factories\PphScoreFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PphScore extends Model
{
    /** @use HasFactory<PphScoreFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tahun',
        'skor_pph',
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
            'skor_pph' => 'float',
            'target_renstra' => 'float',
        ];
    }

    /**
     * Details associated with this PPH score year.
     */
    public function details(): HasMany
    {
        return $this->hasMany(PphScoreDetail::class, 'tahun', 'tahun');
    }

    /**
     * User who created or updated this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Recalculate score from details.
     */
    public function recalculateFromDetails(): float
    {
        $sum = (float) $this->details()->sum('skor_pph');
        $this->update(['skor_pph' => round($sum, 2)]);

        return round($sum, 2);
    }
}
