<?php

namespace App\Models;

use Database\Factories\ConsumerPriceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsumerPrice extends Model
{
    /** @use HasFactory<ConsumerPriceFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'commodity_id',
        'market_id',
        'recorded_date',
        'price',
        'notes',
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
            'price' => 'decimal:2',
            'recorded_date' => 'date',
        ];
    }

    /**
     * Set the recorded_date attribute formatted as Y-m-d.
     */
    public function setRecordedDateAttribute(mixed $value): void
    {
        $this->attributes['recorded_date'] = $value instanceof \DateTimeInterface
            ? $value->format('Y-m-d')
            : substr((string) $value, 0, 10);
    }

    /**
     * Get the commodity for this price entry.
     *
     * @return BelongsTo<Commodity, $this>
     */
    public function commodity(): BelongsTo
    {
        return $this->belongsTo(Commodity::class);
    }

    /**
     * Get the market where this price was recorded.
     *
     * @return BelongsTo<Market, $this>
     */
    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    /**
     * Get the user who recorded this price.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Resolve the active HET record applicable for this consumer price's date.
     */
    public function getApplicableHet(): ?CommodityHet
    {
        return $this->commodity?->hetAt($this->recorded_date);
    }
}
