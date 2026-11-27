<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sub_kegiatan_id',
    'tahun_anggaran',
    'jenis_anggaran',
    'nama_program',
    'kode_rekening',
    'uraian',
    'anggaran',
    'urutan',
])]
class NpdRekening extends Model
{
    protected function casts(): array
    {
        return [
            'tahun_anggaran' => 'integer',
            'anggaran' => 'float',
            'urutan' => 'integer',
        ];
    }

    public function subKegiatan(): BelongsTo
    {
        return $this->belongsTo(SppdSubKegiatan::class, 'sub_kegiatan_id');
    }
}
