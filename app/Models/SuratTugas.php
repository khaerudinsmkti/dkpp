<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'nomor_spt',
    'tanpa_surat',
    'pengirim_surat',
    'nomor_surat',
    'tanggal_surat',
    'tanggal_spt',
    'tanggal_berangkat',
    'tanggal_kembali',
    'lama_hari',
    'tujuan',
    'nama_tempat',
    'nama_kecamatan',
    'alamat_lengkap',
    'penandatangan_mode',
    'kepala_dinas_id',
    'ttd_jabatan',
    'ttd_nama',
    'ttd_pangkat_gol',
    'ttd_nip',
    'ttd_image_path',
    'ttd_offset_x',
    'ttd_offset_y',
    'ttd_scale',
])]
class SuratTugas extends Model
{
    protected $table = 'surat_tugas';

    protected function casts(): array
    {
        return [
            'tanpa_surat' => 'boolean',
            'tanggal_surat' => 'date:Y-m-d',
            'tanggal_spt' => 'date:Y-m-d',
            'tanggal_berangkat' => 'date:Y-m-d',
            'tanggal_kembali' => 'date:Y-m-d',
            'lama_hari' => 'integer',
            'ttd_offset_x' => 'integer',
            'ttd_offset_y' => 'integer',
            'ttd_scale' => 'integer',
        ];
    }

    public function participants(): HasMany
    {
        return $this->hasMany(SuratTugasParticipant::class, 'surat_tugas_id')->orderBy('urutan');
    }

    public function kepalaDinas(): BelongsTo
    {
        return $this->belongsTo(SppdPejabat::class, 'kepala_dinas_id');
    }
}
