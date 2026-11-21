<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'nomor_dpa',
    'tanggal_dpa',
    'tahun_anggaran',
    'keterangan',
    'is_active',
])]
class SppdDpa extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_dpa' => 'date:Y-m-d',
            'tahun_anggaran' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
