<?php

namespace App\Models;

use Database\Factories\PphScoreDetailFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PphScoreDetail extends Model
{
    /** @use HasFactory<PphScoreDetailFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pph_score_id',
        'tahun',
        'pph_food_group_id',
        'energi',
        'ake_percentage',
        'bobot',
        'skor_riil',
        'skor_pph',
        'skor_maksimal',
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
            'energi' => 'float',
            'ake_percentage' => 'float',
            'bobot' => 'float',
            'skor_riil' => 'float',
            'skor_pph' => 'float',
            'skor_maksimal' => 'float',
        ];
    }

    /**
     * The food group this detail belongs to.
     */
    public function foodGroup(): BelongsTo
    {
        return $this->belongsTo(PphFoodGroup::class, 'pph_food_group_id');
    }

    /**
     * The annual PPH score this detail belongs to.
     */
    public function pphScore(): BelongsTo
    {
        return $this->belongsTo(PphScore::class, 'pph_score_id');
    }

    /**
     * User who created or updated this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
