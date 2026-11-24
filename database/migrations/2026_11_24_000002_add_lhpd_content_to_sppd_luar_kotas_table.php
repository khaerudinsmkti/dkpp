<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sppd_luar_kotas', function (Blueprint $table) {
            $table->text('lhpd_content')->nullable()->after('total_biaya');
        });
    }

    public function down(): void
    {
        Schema::table('sppd_luar_kotas', function (Blueprint $table) {
            $table->dropColumn('lhpd_content');
        });
    }
};
