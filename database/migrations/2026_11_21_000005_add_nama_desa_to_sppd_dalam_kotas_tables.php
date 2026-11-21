<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sppd_dalam_kotas', function (Blueprint $table) {
            $table->string('nama_desa', 150)->nullable()->after('tujuan');
        });

        Schema::table('sppd_dalam_kota_participants', function (Blueprint $table) {
            $table->string('nama_desa', 150)->nullable()->after('tujuan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sppd_dalam_kota_participants', function (Blueprint $table) {
            $table->dropColumn('nama_desa');
        });

        Schema::table('sppd_dalam_kotas', function (Blueprint $table) {
            $table->dropColumn('nama_desa');
        });
    }
};
