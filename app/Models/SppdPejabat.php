<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'tipe',
    'nama',
    'nip',
    'pangkat',
    'golongan',
    'jabatan',
    'is_active',
])]
class SppdPejabat extends Model
{
    public const TIPE_KEPALA_DINAS = 'kepala_dinas';
    public const TIPE_PPTK = 'pptk';
    public const TIPE_BENDAHARA = 'bendahara';

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
