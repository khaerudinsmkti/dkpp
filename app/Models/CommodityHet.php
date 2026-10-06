<?php

namespace App\Models;

use Database\Factories\CommodityHetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommodityHet extends Model
{
    /** @use HasFactory<CommodityHetFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'commodity_id',
        'price',
        'effective_date',
        'source_regulation',
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
            'effective_date' => 'date',
        ];
    }

    /**
     * Set the effective_date attribute formatted as Y-m-d.
     */
    public function setEffectiveDateAttribute(mixed $value): void
    {
        $this->attributes['effective_date'] = $value instanceof \DateTimeInterface
            ? $value->format('Y-m-d')
            : substr((string) $value, 0, 10);
    }

    /**
     * Get the commodity this HET belongs to.
     *
     * @return BelongsTo<Commodity, $this>
     */
    public function commodity(): BelongsTo
    {
        return $this->belongsTo(Commodity::class);
    }

    /**
     * Get the user who registered this HET record.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
