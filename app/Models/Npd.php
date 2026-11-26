<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nomor_npd',
    'tanggal_npd',
    'sub_kegiatan_id',
    'tahun_anggaran',
    'nama_program',
    'pptk_id',
    'pengguna_anggaran_id',
    'total_anggaran',
    'total_akumulasi_sebelumnya',
    'total_pencairan_saat_ini',
    'total_sisa',
    'potongan_ppn',
    'potongan_pph21',
    'potongan_pph22',
    'potongan_pph23',
    'potongan_pph4_2',
    'total_potongan',
    'jumlah_dibayarkan',
    'linked_sppd_dalam_kota_batches',
    'linked_sppd_luar_kota_batches',
    'catatan',
])]
class Npd extends Model
{
    protected function casts(): array
    {
        return [
            'tanggal_npd' => 'date:Y-m-d',
            'tahun_anggaran' => 'integer',
            'total_anggaran' => 'float',
            'total_akumulasi_sebelumnya' => 'float',
            'total_pencairan_saat_ini' => 'float',
            'total_sisa' => 'float',
            'potongan_ppn' => 'float',
            'potongan_pph21' => 'float',
            'potongan_pph22' => 'float',
            'potongan_pph23' => 'float',
            'potongan_pph4_2' => 'float',
            'total_potongan' => 'float',
            'jumlah_dibayarkan' => 'float',
            'linked_sppd_dalam_kota_batches' => 'array',
            'linked_sppd_luar_kota_batches' => 'array',
        ];
    }

    public function subKegiatan(): BelongsTo
    {
        return $this->belongsTo(SppdSubKegiatan::class, 'sub_kegiatan_id');
    }

    public function pptk(): BelongsTo
    {
        return $this->belongsTo(SppdPejabat::class, 'pptk_id');
    }

    public function penggunaAnggaran(): BelongsTo
    {
        return $this->belongsTo(SppdPejabat::class, 'pengguna_anggaran_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(NpdItem::class)->orderBy('urutan')->orderBy('id');
    }
}
