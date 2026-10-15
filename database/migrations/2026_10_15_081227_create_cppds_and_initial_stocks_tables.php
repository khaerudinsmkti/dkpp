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
        Schema::create('cppd_initial_stocks', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year')->unique()->comment('Tahun dasar stok awal CPPD');
            $table->decimal('amount', 15, 2)->default(0)->comment('Jumlah stok awal tahun dalam kg');
            $table->text('keterangan')->nullable()->comment('Catatan dasar perhitungan');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('cppds', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal')->index()->comment('Tanggal transaksi CPPD');
            $table->string('status', 30)->index()->comment('Status transaksi: pengadaan, penyaluran, addendum');
            $table->string('kecamatan', 100)->index()->comment('Kecamatan penerima/alokasi');
            $table->string('desa', 100)->index()->comment('Desa penerima/alokasi');
            $table->decimal('jumlah', 15, 2)->comment('Jumlah komoditas dalam kg');
            $table->text('keterangan')->nullable()->comment('Keterangan atau catatan penyaluran/pengadaan');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cppds');
        Schema::dropIfExists('cppd_initial_stocks');
    }
};
