<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'tahun_anggaran',
    'urusan',
    'bidang',
    'unit_organisasi',
    'sub_unit_organisasi',
    'program',
    'kegiatan',
    'kode_sub_kegiatan',
    'nama_sub_kegiatan',
    'sumber_pendanaan',
    'lokasi',
    'waktu_pelaksanaan',
    'keterangan',
    'total_anggaran',
    'rka_file_path',
])]
class RealisasiSubKegiatan extends Model
{
    protected $table = 'realisasi_sub_kegiatans';

    protected function casts(): array
    {
        return [
            'tahun_anggaran' => 'integer',
            'total_anggaran' => 'float',
        ];
    }

    public function rekenings(): HasMany
    {
        return $this->hasMany(RealisasiRekening::class, 'realisasi_sub_kegiatan_id')
            ->orderBy('urutan')
            ->orderBy('id');
    }
}
