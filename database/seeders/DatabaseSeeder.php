<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Catatan: Seluruh dummy data untuk 8 fitur (IKP, Neraca Pangan, CPPD, FSVA,
     * SKPG, PPH, Harga Konsumen, Harga Produsen) dikosongkan agar diisi manual.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
        ]);

        $superAdmin = Role::where('slug', 'super-admin')->first();

        if (! User::where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Administrator DKPP',
                'email' => 'test@example.com',
                'role_id' => $superAdmin?->id,
                'is_active' => true,
            ]);
        }
    }
}
