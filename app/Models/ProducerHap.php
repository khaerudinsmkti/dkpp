<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProducerHap extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'producer_haps';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'producer_commodity_id',
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
     * Get the producer commodity this HAP belongs to.
     *
     * @return BelongsTo<ProducerCommodity, $this>
     */
    public function producerCommodity(): BelongsTo
    {
        return $this->belongsTo(ProducerCommodity::class, 'producer_commodity_id');
    }

    /**
     * Get the user who registered this HAP record.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

