<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sppd_dalam_kotas', function (Blueprint $table) {
            $table->string('lhpd_type', 30)->nullable()->after('total_uang_saku');
            $table->text('lhpd_content')->nullable()->after('lhpd_type');
            $table->json('lhpd_table_data')->nullable()->after('lhpd_content');
            $table->string('lhpd_keterangan', 500)->nullable()->after('lhpd_table_data');
        });
    }

    public function down(): void
    {
        Schema::table('sppd_dalam_kotas', function (Blueprint $table) {
            $table->dropColumn([
                'lhpd_type',
                'lhpd_content',
                'lhpd_table_data',
                'lhpd_keterangan',
            ]);
        });
    }
};
