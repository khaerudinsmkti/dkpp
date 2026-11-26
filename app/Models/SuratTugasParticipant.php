<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'surat_tugas_id',
    'pegawai_id',
    'urutan',
    'nama',
    'nip',
    'pangkat',
    'golongan',
    'jabatan',
])]
class SuratTugasParticipant extends Model
{
    protected $table = 'surat_tugas_participants';

    protected function casts(): array
    {
        return [
            'urutan' => 'integer',
        ];
    }

    public function suratTugas(): BelongsTo
    {
        return $this->belongsTo(SuratTugas::class, 'surat_tugas_id');
    }

    public function pegawai(): BelongsTo
    {
        return $this->belongsTo(SppdPegawai::class, 'pegawai_id');
    }
}
