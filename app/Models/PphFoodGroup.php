<?php

namespace App\Models;

use Database\Factories\PphFoodGroupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PphFoodGroup extends Model
{
    /** @use HasFactory<PphFoodGroupFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'bobot',
        'skor_maksimal',
        'order',
        'is_active',
        'description',
        'image',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'image_url',
    ];

    /**
     * Get the food group's image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        if (str_starts_with($this->image, 'http://') || str_starts_with($this->image, 'https://')) {
            return $this->image;
        }

        return asset('storage/'.$this->image);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'bobot' => 'float',
            'skor_maksimal' => 'float',
            'order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Details associated with this food group.
     */
    public function details(): HasMany
    {
        return $this->hasMany(PphScoreDetail::class, 'pph_food_group_id');
    }
}
