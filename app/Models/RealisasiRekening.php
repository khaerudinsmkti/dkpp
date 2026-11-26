<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'realisasi_sub_kegiatan_id',
    'kode_rekening',
    'uraian',
    'jenis_pencairan',
    'pagu_anggaran',
    'pagu_murni',
    'urutan',
])]
class RealisasiRekening extends Model
{
    protected $table = 'realisasi_rekenings';

    protected function casts(): array
    {
        return [
            'pagu_anggaran' => 'float',
            'pagu_murni' => 'float',
            'urutan' => 'integer',
        ];
    }

    public function subKegiatan(): BelongsTo
    {
        return $this->belongsTo(RealisasiSubKegiatan::class, 'realisasi_sub_kegiatan_id');
    }

    public function bulanans(): HasMany
    {
        return $this->hasMany(RealisasiBulanan::class, 'realisasi_rekening_id')->orderBy('bulan');
    }
}
