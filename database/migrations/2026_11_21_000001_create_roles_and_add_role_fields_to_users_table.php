<?php

use App\Models\Role;
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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color', 30)->default('emerald');
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('permissions')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('id')->constrained('roles')->nullOnDelete();
            $table->string('nip', 40)->nullable()->after('email');
            $table->string('jabatan', 120)->nullable()->after('nip');
            $table->string('phone', 30)->nullable()->after('jabatan');
            $table->boolean('is_active')->default(true)->after('phone');
        });

        // Seed default system roles so administrator can log in and manage modules manually
        $now = now();
        foreach (Role::defaultRoles() as $roleData) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $roleData['slug']],
                [
                    'name' => $roleData['name'],
                    'description' => $roleData['description'],
                    'color' => $roleData['color'],
                    'is_system' => $roleData['is_system'],
                    'is_active' => $roleData['is_active'],
                    'permissions' => json_encode($roleData['permissions']),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $superAdminRole = DB::table('roles')->where('slug', 'super-admin')->first();
        if ($superAdminRole) {
            DB::table('users')->whereNull('role_id')->update([
                'role_id' => $superAdminRole->id,
                'jabatan' => 'Super Administrator DKPP',
                'is_active' => true,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn(['nip', 'jabatan', 'phone', 'is_active']);
        });

        Schema::dropIfExists('roles');
    }
};
