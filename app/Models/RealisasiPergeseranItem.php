<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'realisasi_pergeseran_id',
    'realisasi_sub_kegiatan_id',
    'realisasi_rekening_id',
    'kode_sub_kegiatan',
    'nama_sub_kegiatan',
    'kode_rekening',
    'uraian',
    'pagu_sebelum',
    'pagu_sesudah',
    'selisih',
])]
class RealisasiPergeseranItem extends Model
{
    protected $table = 'realisasi_pergeseran_items';

    protected function casts(): array
    {
        return [
            'pagu_sebelum' => 'float',
            'pagu_sesudah' => 'float',
            'selisih' => 'float',
        ];
    }

    public function pergeseran(): BelongsTo
    {
        return $this->belongsTo(RealisasiPergeseran::class, 'realisasi_pergeseran_id');
    }
}
