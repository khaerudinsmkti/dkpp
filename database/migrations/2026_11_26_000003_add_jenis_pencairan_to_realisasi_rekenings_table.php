<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('realisasi_rekenings', function (Blueprint $table): void {
            $table->string('jenis_pencairan', 10)->default('GU')->after('uraian');
        });
    }

    public function down(): void
    {
        Schema::table('realisasi_rekenings', function (Blueprint $table): void {
            $table->dropColumn('jenis_pencairan');
        });
    }
};
