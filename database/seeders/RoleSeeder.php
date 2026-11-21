<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

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

        // Seed representative DKPP users per role if only 1 user exists
        if (User::count() <= 1) {
            $sampleUsers = [
                [
                    'name' => 'Drs. H. Kepala Dinas DKPP',
                    'email' => 'kadin.dkpp@indramayukab.go.id',
                    'nip' => '196904121995031002',
                    'jabatan' => 'Kepala Dinas Ketahanan Pangan dan Pertanian',
                    'phone' => '081223344551',
                    'role_slug' => 'eksekutif-viewer',
                ],
                [
                    'name' => 'Kabid Ketersediaan & Kerawanan Pangan',
                    'email' => 'ketersediaan.dkpp@indramayukab.go.id',
                    'nip' => '197508192001121003',
                    'jabatan' => 'Kepala Bidang Ketersediaan & Kerawanan Pangan',
                    'phone' => '081223344552',
                    'role_slug' => 'admin-ketersediaan',
                ],
                [
                    'name' => 'Kabid Distribusi & Cadangan Pangan',
                    'email' => 'distribusi.dkpp@indramayukab.go.id',
                    'nip' => '197811042003122001',
                    'jabatan' => 'Kepala Bidang Distribusi & Harga Pangan',
                    'phone' => '081223344553',
                    'role_slug' => 'admin-distribusi',
                ],
                [
                    'name' => 'Analis Konsumsi & PPH',
                    'email' => 'konsumsi.dkpp@indramayukab.go.id',
                    'nip' => '198402152009022004',
                    'jabatan' => 'Analis Ketahanan Pangan Ahli Muda',
                    'phone' => '081223344554',
                    'role_slug' => 'admin-konsumsi',
                ],
                [
                    'name' => 'Petugas Enumerator Pasar Baru',
                    'email' => 'enumerator.pasar@indramayukab.go.id',
                    'nip' => '199206102019031005',
                    'jabatan' => 'Enumerator Harga Pangan Pasar Daerah',
                    'phone' => '081223344555',
                    'role_slug' => 'enumerator-pasar',
                ],
            ];

            foreach ($sampleUsers as $u) {
                $role = Role::where('slug', $u['role_slug'])->first();
                User::firstOrCreate(
                    ['email' => $u['email']],
                    [
                        'name' => $u['name'],
                        'nip' => $u['nip'],
                        'jabatan' => $u['jabatan'],
                        'phone' => $u['phone'],
                        'role_id' => $role?->id,
                        'is_active' => true,
                        'email_verified_at' => now(),
                        'password' => Hash::make('password'),
                    ]
                );
            }
        }
    }
}
