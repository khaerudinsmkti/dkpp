<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'food_balance_commodity_id',
        'year',
        'month',
        'period_date',
        'produksi',
        'ketersediaan',
        'kebutuhan',
        'selisih',
        'keterangan',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'period_date' => 'date',
        'produksi' => 'decimal:2',
        'ketersediaan' => 'decimal:2',
        'kebutuhan' => 'decimal:2',
        'selisih' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::saving(function (FoodBalance $item) {
            $ketersediaan = (float) ($item->ketersediaan ?? 0);
            $kebutuhan = (float) ($item->kebutuhan ?? 0);
            $selisih = round($ketersediaan - $kebutuhan, 2);

            $item->selisih = $selisih;
            $item->keterangan = $selisih < 0 ? 'Defisit' : 'Surplus';

            if (empty($item->period_date) && ! empty($item->year) && ! empty($item->month)) {
                $item->period_date = sprintf('%04d-%02d-01', $item->year, $item->month);
            }
        });
    }

    public function commodity(): BelongsTo
    {
        return $this->belongsTo(FoodBalanceCommodity::class, 'food_balance_commodity_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
