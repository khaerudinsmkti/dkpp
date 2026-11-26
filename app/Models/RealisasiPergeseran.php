<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'tahun_anggaran',
    'nama_tahap',
    'jenis',
    'tanggal',
    'nomor_dokumen',
    'keterangan',
    'total_sebelum',
    'total_sesudah',
    'total_selisih',
])]
class RealisasiPergeseran extends Model
{
    protected $table = 'realisasi_pergeserans';

    protected function casts(): array
    {
        return [
            'tahun_anggaran' => 'integer',
            'tanggal' => 'date:Y-m-d',
            'total_sebelum' => 'float',
            'total_sesudah' => 'float',
            'total_selisih' => 'float',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(RealisasiPergeseranItem::class, 'realisasi_pergeseran_id')->orderBy('id');
    }
}
