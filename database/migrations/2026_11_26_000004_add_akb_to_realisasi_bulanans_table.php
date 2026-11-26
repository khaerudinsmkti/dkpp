<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('realisasi_bulanans', function (Blueprint $table): void {
            $table->decimal('akb', 18, 2)->default(0)->after('nominal');
        });
    }

    public function down(): void
    {
        Schema::table('realisasi_bulanans', function (Blueprint $table): void {
            $table->dropColumn('akb');
        });
    }
};
