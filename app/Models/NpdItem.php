<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'npd_id',
    'npd_rekening_id',
    'urutan',
    'kode_rekening',
    'uraian',
    'anggaran',
    'akumulasi_sebelumnya',
    'pencairan_saat_ini',
    'sisa',
])]
class NpdItem extends Model
{
    protected function casts(): array
    {
        return [
            'urutan' => 'integer',
            'anggaran' => 'float',
            'akumulasi_sebelumnya' => 'float',
            'pencairan_saat_ini' => 'float',
            'sisa' => 'float',
        ];
    }

    public function npd(): BelongsTo
    {
        return $this->belongsTo(Npd::class);
    }

    public function rekening(): BelongsTo
    {
        return $this->belongsTo(NpdRekening::class, 'npd_rekening_id');
    }
}
