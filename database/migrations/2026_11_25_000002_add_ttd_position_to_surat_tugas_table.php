<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('surat_tugas')) {
            Schema::table('surat_tugas', function (Blueprint $table) {
                if (! Schema::hasColumn('surat_tugas', 'ttd_offset_x')) {
                    $table->integer('ttd_offset_x')->default(0)->after('ttd_image_path');
                }
                if (! Schema::hasColumn('surat_tugas', 'ttd_offset_y')) {
                    $table->integer('ttd_offset_y')->default(0)->after('ttd_offset_x');
                }
                if (! Schema::hasColumn('surat_tugas', 'ttd_scale')) {
                    $table->unsignedInteger('ttd_scale')->default(100)->after('ttd_offset_y');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('surat_tugas')) {
            Schema::table('surat_tugas', function (Blueprint $table) {
                $cols = [];
                foreach (['ttd_offset_x', 'ttd_offset_y', 'ttd_scale'] as $col) {
                    if (Schema::hasColumn('surat_tugas', $col)) {
                        $cols[] = $col;
                    }
                }
                if ($cols !== []) {
                    $table->dropColumn($cols);
                }
            });
        }
    }
};
