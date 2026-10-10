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
        Schema::create('producer_commodities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('key')->unique()->comment('Field key used in producer_prices table (e.g. gkp_petani)');
            $table->string('category');
            $table->string('unit')->default('Kg');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });

        Schema::create('producer_haps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producer_commodity_id')->constrained('producer_commodities')->cascadeOnDelete();
            $table->decimal('price', 12, 2);
            $table->date('effective_date');
            $table->string('source_regulation')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['producer_commodity_id', 'effective_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('producer_haps');
        Schema::dropIfExists('producer_commodities');
    }
};

