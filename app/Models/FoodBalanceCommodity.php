<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class FoodBalanceCommodity extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'unit',
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
     * Get the commodity's image URL.
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

    protected $casts = [
        'order' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (FoodBalanceCommodity $commodity) {
            if (empty($commodity->slug)) {
                $baseSlug = Str::slug($commodity->name);
                $slug = $baseSlug;
                $counter = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.$counter++;
                }
                $commodity->slug = $slug;
            }
        });
    }

    public function balances(): HasMany
    {
        return $this->hasMany(FoodBalance::class, 'food_balance_commodity_id');
    }

    public function balanceAt(int $year, int $month): ?FoodBalance
    {
        return $this->balances()
            ->where('year', $year)
            ->where('month', $month)
            ->first();
    }
}
