<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('sppd_luar_kotas', 'kab_kota')) {
            Schema::table('sppd_luar_kotas', function (Blueprint $table) {
                $table->string('kab_kota', 150)->nullable()->after('alamat_lengkap');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('sppd_luar_kotas', 'kab_kota')) {
            Schema::table('sppd_luar_kotas', function (Blueprint $table) {
                $table->dropColumn('kab_kota');
            });
        }
    }
};
