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
    'nomor_spt',
    'tanggal_spt',
    'tanggal_berangkat',
    'tujuan',
    'nama_desa',
    'nama_kecamatan',
    'zona',
    'kepala_dinas_id',
    'pptk_id',
    'bendahara_id',
    'total_uang_saku',
])]
class SppdDalamKota extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_spt' => 'date:Y-m-d',
            'tanggal_berangkat' => 'date:Y-m-d',
            'total_uang_saku' => 'float',
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
        return $this->hasMany(SppdDalamKotaParticipant::class)->orderBy('urutan');
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
