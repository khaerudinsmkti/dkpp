<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'nama_kecamatan',
    'zona',
    'golongan',
    'uang_saku',
])]
class SppdZonasi extends Model
{
    protected function casts(): array
    {
        return [
            'uang_saku' => 'float',
        ];
    }
}
