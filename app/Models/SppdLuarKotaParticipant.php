<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sppd_luar_kota_id',
    'pegawai_id',
    'urutan',
    'nama',
    'nip',
    'pangkat',
    'golongan',
    'jabatan',
    'uang_harian',
    'uang_transport',
    'total_biaya',
])]
class SppdLuarKotaParticipant extends Model
{
    protected function casts(): array
    {
        return [
            'urutan' => 'integer',
            'uang_harian' => 'float',
            'uang_transport' => 'float',
            'total_biaya' => 'float',
        ];
    }

    public function sppd(): BelongsTo
    {
        return $this->belongsTo(SppdLuarKota::class, 'sppd_luar_kota_id');
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(SppdPegawai::class, 'pegawai_id');
    }
}
