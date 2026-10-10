<?php

namespace App\Models;

use Database\Factories\CommodityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Commodity extends Model
{
    /** @use HasFactory<CommodityFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'category',
        'unit',
        'description',
        'image',
        'is_active',
        'order',
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

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'order' => 'integer',
        ];
    }

    /**
     * Get all HET records for this commodity.
     *
     * @return HasMany<CommodityHet, $this>
     */
    public function hets(): HasMany
    {
        return $this->hasMany(CommodityHet::class)->orderByDesc('effective_date')->orderByDesc('id');
    }

    /**
     * Get the latest HET record.
     *
     * @return HasOne<CommodityHet, $this>
     */
    public function latestHet(): HasOne
    {
        return $this->hasOne(CommodityHet::class)->latestOfMany('effective_date');
    }

    /**
     * Get consumer prices recorded for this commodity.
     *
     * @return HasMany<ConsumerPrice, $this>
     */
    public function consumerPrices(): HasMany
    {
        return $this->hasMany(ConsumerPrice::class);
    }

    /**
     * Get the active HET record for a specific date.
     */
    public function hetAt(string|\DateTimeInterface $date): ?CommodityHet
    {
        $targetDate = $date instanceof \DateTimeInterface ? $date->format('Y-m-d') : substr((string) $date, 0, 10);

        if ($this->relationLoaded('hets')) {
            return $this->hets
                ->filter(fn (CommodityHet $het): bool => $het->effective_date->format('Y-m-d') <= $targetDate)
                ->sortByDesc(fn (CommodityHet $het): string => $het->effective_date->format('Y-m-d').'-'.str_pad((string) $het->id, 10, '0', STR_PAD_LEFT))
                ->first();
        }

        return $this->hets()
            ->where('effective_date', '<=', $targetDate)
            ->orderByDesc('effective_date')
            ->orderByDesc('id')
            ->first();
    }
}
