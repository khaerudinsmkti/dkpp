<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('food_balance_commodities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('unit')->default('Ton');
            $table->unsignedInteger('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('food_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_balance_commodity_id')
                ->constrained('food_balance_commodities')
                ->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->date('period_date');
            $table->decimal('produksi', 15, 2)->default(0);
            $table->decimal('ketersediaan', 15, 2)->default(0);
            $table->decimal('kebutuhan', 15, 2)->default(0);
            $table->decimal('selisih', 15, 2)->default(0);
            $table->string('keterangan', 20)->default('Surplus');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['food_balance_commodity_id', 'year', 'month'], 'food_balance_comm_year_month_unique');
            $table->index(['year', 'month']);
            $table->index('period_date');
        });

        // Seed 11 default commodities
        $commodities = [
            ['name' => 'Beras', 'unit' => 'Ton'],
            ['name' => 'Gula Pasir', 'unit' => 'Ton'],
            ['name' => 'Minyak Goreng', 'unit' => 'Ton'],
            ['name' => 'Daging Sapi', 'unit' => 'Ton'],
            ['name' => 'Daging Ayam Ras', 'unit' => 'Ton'],
            ['name' => 'Telur Ayam Ras', 'unit' => 'Ton'],
            ['name' => 'Bawang Merah', 'unit' => 'Ton'],
            ['name' => 'Bawang Putih', 'unit' => 'Ton'],
            ['name' => 'Jagung', 'unit' => 'Ton'],
            ['name' => 'Cabai Besar', 'unit' => 'Ton'],
            ['name' => 'Cabai Rawit', 'unit' => 'Ton'],
        ];

        $now = now();
        foreach ($commodities as $index => $item) {
            DB::table('food_balance_commodities')->insert([
                'name' => $item['name'],
                'slug' => Str::slug($item['name']),
                'unit' => $item['unit'],
                'order' => $index + 1,
                'is_active' => true,
                'description' => 'Komoditas Neraca Pangan Bulanan Kabupaten Indramayu',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('food_balances');
        Schema::dropIfExists('food_balance_commodities');
    }
};
