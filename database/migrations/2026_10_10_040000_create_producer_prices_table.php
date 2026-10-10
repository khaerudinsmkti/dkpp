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
        Schema::create('producer_prices', function (Blueprint $table) {
            $table->id();
            $table->date('recorded_date')->unique();
            $table->decimal('gkp_petani', 12, 2)->nullable()->comment('GKP Tingkat Petani (Rp/Kg)');
            $table->decimal('gkp_penggilingan', 12, 2)->nullable()->comment('GKP Tingkat Penggilingan (Rp/Kg)');
            $table->decimal('gkg_penggilingan', 12, 2)->nullable()->comment('GKG Tingkat Penggilingan (Rp/Kg)');
            $table->decimal('beras_medium_penggilingan', 12, 2)->nullable()->comment('Beras Medium Penggilingan (Rp/Kg)');
            $table->decimal('beras_premium_penggilingan', 12, 2)->nullable()->comment('Beras Premium Penggilingan (Rp/Kg)');
            $table->decimal('sapi_hidup', 12, 2)->nullable()->comment('Sapi Hidup (Rp/Kg)');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('producer_prices');
    }
};

