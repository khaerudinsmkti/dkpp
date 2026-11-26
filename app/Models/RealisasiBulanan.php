<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'realisasi_rekening_id',
    'bulan',
    'nominal',
    'akb',
    'catatan',
])]
class RealisasiBulanan extends Model
{
    protected $table = 'realisasi_bulanans';

    protected function casts(): array
    {
        return [
            'bulan' => 'integer',
            'nominal' => 'float',
            'akb' => 'float',
        ];
    }

    public function rekening(): BelongsTo
    {
        return $this->belongsTo(RealisasiRekening::class, 'realisasi_rekening_id');
    }
}
