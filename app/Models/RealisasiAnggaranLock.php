<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'tahun_anggaran',
    'is_murni_locked',
    'locked_at',
    'locked_by',
])]
class RealisasiAnggaranLock extends Model
{
    protected $table = 'realisasi_anggaran_locks';

    protected function casts(): array
    {
        return [
            'tahun_anggaran' => 'integer',
            'is_murni_locked' => 'boolean',
            'locked_at' => 'datetime',
        ];
    }
}
