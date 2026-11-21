<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'no_rekening',
    'nama_kegiatan',
    'sub_kegiatan',
    'kode_sub_kegiatan',
    'is_active',
])]
class SppdSubKegiatan extends Model
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
