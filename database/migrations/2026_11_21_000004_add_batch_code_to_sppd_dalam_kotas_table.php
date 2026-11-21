<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sppd_dalam_kotas', function (Blueprint $table) {
            $table->string('batch_code', 60)->nullable()->after('id')->index();
        });

        // Isi batch_code untuk data yang sudah ada (kelompokkan berdasarkan sub_kegiatan_id + created_at minute atau per id)
        $existing = DB::table('sppd_dalam_kotas')->whereNull('batch_code')->orderBy('id')->get();
        foreach ($existing as $row) {
            $code = 'BATCH-'.date('Ymd', strtotime($row->created_at ?? 'now')).'-'.str_pad((string) $row->id, 3, '0', STR_PAD_LEFT);
            DB::table('sppd_dalam_kotas')->where('id', $row->id)->update(['batch_code' => $code]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sppd_dalam_kotas', function (Blueprint $table) {
            $table->dropColumn('batch_code');
        });
    }
};
