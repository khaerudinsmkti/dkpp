<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sppd_dalam_kota_id',
    'pegawai_id',
    'urutan',
    'nama',
    'nip',
    'pangkat',
    'golongan',
    'jabatan',
    'tanggal_berangkat',
    'tanggal_spt',
    'tujuan',
    'nama_kecamatan',
    'zona',
    'uang_saku',
])]
class SppdDalamKotaParticipant extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_berangkat' => 'date:Y-m-d',
            'tanggal_spt' => 'date:Y-m-d',
            'uang_saku' => 'float',
        ];
    }

    public function sppd(): BelongsTo
    {
        return $this->belongsTo(SppdDalamKota::class, 'sppd_dalam_kota_id');
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(SppdPegawai::class, 'pegawai_id');
    }
}
