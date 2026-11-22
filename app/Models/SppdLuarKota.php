<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'batch_code',
    'sub_kegiatan_id',
    'dpa_id',
    'pengirim_surat',
    'nomor_surat',
    'tanggal_surat',
    'tanggal_spt',
    'tanggal_berangkat',
    'tanggal_kembali',
    'lama_hari',
    'tujuan',
    'alamat_lengkap',
    'perihal',
    'kepala_dinas_id',
    'pptk_id',
    'bendahara_id',
    'total_uang_harian',
    'total_uang_transport',
    'total_biaya',
])]
class SppdLuarKota extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_surat' => 'date:Y-m-d',
            'tanggal_spt' => 'date:Y-m-d',
            'tanggal_berangkat' => 'date:Y-m-d',
            'tanggal_kembali' => 'date:Y-m-d',
            'lama_hari' => 'integer',
            'total_uang_harian' => 'float',
            'total_uang_transport' => 'float',
            'total_biaya' => 'float',
        ];
    }

    public function subKegiatan(): BelongsTo
    {
        return $this->belongsTo(SppdSubKegiatan::class, 'sub_kegiatan_id');
    }

    public function dpa(): BelongsTo
    {
        return $this->belongsTo(SppdDpa::class, 'dpa_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(SppdLuarKotaParticipant::class, 'sppd_luar_kota_id')->orderBy('urutan');
    }

    public function kepalaDinas(): BelongsTo
    {
        return $this->belongsTo(SppdPejabat::class, 'kepala_dinas_id');
    }

    public function pptk(): BelongsTo
    {
        return $this->belongsTo(SppdPejabat::class, 'pptk_id');
    }

    public function bendahara(): BelongsTo
    {
        return $this->belongsTo(SppdPejabat::class, 'bendahara_id');
    }
}
