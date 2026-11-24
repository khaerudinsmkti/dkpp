<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (Role::defaultRoles() as $roleData) {
            Role::updateOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }

        $superAdmin = Role::where('slug', 'super-admin')->first();
        if ($superAdmin) {
            User::whereNull('role_id')->update([
                'role_id' => $superAdmin->id,
                'is_active' => true,
            ]);
        }
    }
}
