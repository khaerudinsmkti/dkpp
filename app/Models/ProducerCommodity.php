<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProducerCommodity extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'producer_commodities';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'key',
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
     * The attributes that should be cast.
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
     * Get all HAP revisions for this producer commodity.
     *
     * @return HasMany<ProducerHap, $this>
     */
    public function haps(): HasMany
    {
        return $this->hasMany(ProducerHap::class, 'producer_commodity_id')
            ->orderByDesc('effective_date')
            ->orderByDesc('id');
    }

    /**
     * Get the latest HAP record.
     *
     * @return HasOne<ProducerHap, $this>
     */
    public function latestHap(): HasOne
    {
        return $this->hasOne(ProducerHap::class, 'producer_commodity_id')->latestOfMany('effective_date');
    }

    /**
     * Get the active HAP record for a specific date.
     */
    public function hapAt(string|\DateTimeInterface $date): ?ProducerHap
    {
        $targetDate = $date instanceof \DateTimeInterface ? $date->format('Y-m-d') : substr((string) $date, 0, 10);

        if ($this->relationLoaded('haps')) {
            return $this->haps
                ->filter(fn (ProducerHap $hap): bool => $hap->effective_date->format('Y-m-d') <= $targetDate)
                ->sortByDesc(fn (ProducerHap $hap): string => $hap->effective_date->format('Y-m-d').'-'.str_pad((string) $hap->id, 10, '0', STR_PAD_LEFT))
                ->first();
        }

        return $this->haps()
            ->where('effective_date', '<=', $targetDate)
            ->orderByDesc('effective_date')
            ->orderByDesc('id')
            ->first();
    }
}

