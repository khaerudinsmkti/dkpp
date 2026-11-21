<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleController extends Controller
{
    /**
     * Display the User, Role & Access Matrix management page.
     */
    public function index(Request $request): Response
    {
        // Ensure default roles exist if table is empty
        if (Role::count() === 0) {
            foreach (Role::defaultRoles() as $roleData) {
                Role::create($roleData);
            }
        }

        $roles = Role::withCount('users')
            ->orderByDesc('is_system')
            ->orderBy('id')
            ->get();

        $users = User::with('role')
            ->orderByDesc('is_active')
            ->orderBy('id')
            ->get();

        $modules = Role::MODULES;
        $actions = array_values(Role::ACTIONS);
        $totalPossiblePermissions = count($modules) * count($actions);

        $roleRows = $roles->map(function (Role $role) use ($totalPossiblePermissions): array {
            $normalized = $role->getNormalizedPermissions();
            $grantedCount = 0;
            $viewableModulesCount = 0;

            foreach ($normalized as $mKey => $actionMap) {
                if (! empty($actionMap['view'])) {
                    $viewableModulesCount++;
                }
                foreach ($actionMap as $allowed) {
                    if ($allowed) {
                        $grantedCount++;
                    }
                }
            }

            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'color' => $role->color ?: 'emerald',
                'is_system' => (bool) $role->is_system,
                'is_active' => (bool) $role->is_active,
                'users_count' => (int) $role->users_count,
                'permissions' => $normalized,
                'granted_permissions_count' => $grantedCount,
                'total_possible_permissions' => $totalPossiblePermissions,
                'coverage_percentage' => $totalPossiblePermissions > 0
                    ? round(($grantedCount / $totalPossiblePermissions) * 100)
                    : 0,
                'viewable_modules_count' => $viewableModulesCount,
                'updated_at' => $role->updated_at?->format('d M Y H:i'),
            ];
        })->values();

        $userRows = $users->map(function (User $u): array {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'nip' => $u->nip,
                'jabatan' => $u->jabatan,
                'phone' => $u->phone,
                'is_active' => (bool) $u->is_active,
                'role_id' => $u->role_id,
                'role_name' => $u->role?->name ?? 'Super Administrator',
                'role_slug' => $u->role?->slug ?? 'super-admin',
                'role_color' => $u->role?->color ?? 'emerald',
                'email_verified' => $u->email_verified_at !== null,
                'created_at' => $u->created_at?->format('d M Y'),
            ];
        })->values();

        $totalGrantedAcrossRoles = $roleRows->sum('granted_permissions_count');

        return Inertia::render('users-roles/index', [
            'users' => $userRows,
            'roles' => $roleRows,
            'modules' => $modules,
            'actions' => $actions,
            'statistics' => [
                'total_users' => $userRows->count(),
                'active_users' => $userRows->where('is_active', true)->count(),
                'inactive_users' => $userRows->where('is_active', false)->count(),
                'total_roles' => $roleRows->count(),
                'system_roles' => $roleRows->where('is_system', true)->count(),
                'custom_roles' => $roleRows->where('is_system', false)->count(),
                'total_modules' => count($modules),
                'total_actions' => count($actions),
                'total_granted_permissions' => $totalGrantedAcrossRoles,
            ],
        ]);
    }

    /**
     * Store a newly created User.
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'nip' => ['nullable', 'string', 'max:40'],
            'jabatan' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role_id' => ['required', 'exists:roles,id'],
            'password' => ['required', 'string', 'min:6'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama lengkap pengguna wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.unique' => 'Alamat email sudah terdaftar pada pengguna lain.',
            'role_id.required' => 'Silakan pilih role/peran untuk pengguna ini.',
            'password.required' => 'Kata sandi wajib diisi minimal 6 karakter.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'nip' => $validated['nip'] ?? null,
            'jabatan' => $validated['jabatan'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'role_id' => (int) $validated['role_id'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        return back()->with('success', "Pengguna '{$user->name}' berhasil ditambahkan.");
    }

    /**
     * Update an existing User.
     */
    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => [
                'required',
                'string',
                'email',
                'max:150',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'nip' => ['nullable', 'string', 'max:40'],
            'jabatan' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role_id' => ['required', 'exists:roles,id'],
            'password' => ['nullable', 'string', 'min:6'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama lengkap pengguna wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.unique' => 'Alamat email sudah digunakan pengguna lain.',
            'role_id.required' => 'Silakan pilih role/peran pengguna.',
            'password.min' => 'Kata sandi baru minimal 6 karakter.',
        ]);

        // Prevent deactivating own account
        $currentUserId = $request->user()?->id;
        $newActiveStatus = (bool) ($validated['is_active'] ?? $user->is_active);
        if ($currentUserId === $user->id && ! $newActiveStatus) {
            return back()->withErrors([
                'error' => 'Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang digunakan login.',
            ]);
        }

        $updateData = [
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'nip' => $validated['nip'] ?? null,
            'jabatan' => $validated['jabatan'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'role_id' => (int) $validated['role_id'],
            'is_active' => $newActiveStatus,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return back()->with('success', "Data pengguna '{$user->name}' berhasil diperbarui.");
    }

    /**
     * Quick toggle active/inactive status of a user.
     */
    public function toggleUserStatus(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->id === $user->id) {
            return back()->withErrors([
                'error' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
            ]);
        }

        $user->is_active = ! $user->is_active;
        $user->save();

        $statusLabel = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Akun pengguna '{$user->name}' berhasil {$statusLabel}.");
    }

    /**
     * Delete a user.
     */
    public function destroyUser(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->id === $user->id) {
            return back()->withErrors([
                'error' => 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.',
            ]);
        }

        // Ensure at least one super admin user remains
        if ($user->role?->slug === 'super-admin') {
            $superAdminCount = User::whereHas('role', fn ($q) => $q->where('slug', 'super-admin'))->count();
            if ($superAdminCount <= 1) {
                return back()->withErrors([
                    'error' => 'Tidak dapat menghapus satu-satunya akun Super Administrator di sistem.',
                ]);
            }
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "Pengguna '{$name}' berhasil dihapus.");
    }

    /**
     * Store a newly created Role with initial permissions.
     */
    public function storeRole(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'color' => ['nullable', 'string', 'max:30'],
            'is_active' => ['nullable', 'boolean'],
            'template' => ['nullable', 'string', 'in:empty,view_only,operator,full'],
            'copy_from_role_id' => ['nullable', 'exists:roles,id'],
        ], [
            'name.required' => 'Nama role wajib diisi.',
        ]);

        $baseSlug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        if ($baseSlug === '') {
            $baseSlug = 'role-'. strtolower(Str::random(5));
        }

        $slug = $baseSlug;
        $counter = 1;
        while (Role::where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        // Determine initial permission matrix
        if (! empty($validated['copy_from_role_id'])) {
            $sourceRole = Role::find($validated['copy_from_role_id']);
            $permissions = $sourceRole ? $sourceRole->getNormalizedPermissions() : Role::buildMatrix([]);
        } else {
            $template = $validated['template'] ?? 'view_only';
            $permissions = match ($template) {
                'full' => Role::buildMatrix(['*' => 'all']),
                'operator' => Role::buildMatrix(['*' => 'operator', 'users_roles' => []]),
                'view_only' => Role::buildMatrix(['*' => 'view', 'users_roles' => []]),
                default => Role::buildMatrix(['dashboard' => 'view']),
            };
        }

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? 'emerald',
            'is_system' => false,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'permissions' => $permissions,
        ]);

        return back()->with('success', "Role '{$role->name}' berhasil dibuat.");
    }

    /**
     * Update an existing Role metadata.
     */
    public function updateRole(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'color' => ['nullable', 'string', 'max:30'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'name.required' => 'Nama role wajib diisi.',
        ]);

        if ($role->slug === 'super-admin' && isset($validated['is_active']) && ! $validated['is_active']) {
            return back()->withErrors([
                'error' => 'Role Super Administrator tidak dapat dinonaktifkan.',
            ]);
        }

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? $role->color,
            'is_active' => $role->slug === 'super-admin' ? true : (bool) ($validated['is_active'] ?? $role->is_active),
        ]);

        return back()->with('success', "Role '{$role->name}' berhasil diperbarui.");
    }

    /**
     * Update the Access Permission Matrix for a specific Role.
     */
    public function updateMatrix(Request $request, Role $role): RedirectResponse
    {
        if ($role->slug === 'super-admin') {
            return back()->withErrors([
                'error' => 'Role Super Administrator selalu memiliki hak akses penuh ke seluruh modul sistem.',
            ]);
        }

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
        ]);

        $incoming = $validated['permissions'];
        $cleanMatrix = [];

        foreach (Role::MODULES as $module) {
            $mKey = $module['key'];
            $cleanMatrix[$mKey] = [];
            $modIncoming = isset($incoming[$mKey]) && is_array($incoming[$mKey]) ? $incoming[$mKey] : [];

            $hasAnyCrudOrExport = false;
            foreach (array_keys(Role::ACTIONS) as $aKey) {
                $val = (bool) ($modIncoming[$aKey] ?? false);
                $cleanMatrix[$mKey][$aKey] = $val;
                if ($aKey !== 'view' && $val) {
                    $hasAnyCrudOrExport = true;
                }
            }

            // If user grants create/update/delete/import_export on a module, automatically ensure 'view' is true
            if ($hasAnyCrudOrExport) {
                $cleanMatrix[$mKey]['view'] = true;
            }
        }

        $role->update([
            'permissions' => $cleanMatrix,
        ]);

        return back()->with('success', "Matriks hak akses untuk role '{$role->name}' berhasil disimpan.");
    }

    /**
     * Delete a Role if not system and has no assigned users.
     */
    public function destroyRole(Role $role): RedirectResponse
    {
        if ($role->slug === 'super-admin' || $role->is_system) {
            return back()->withErrors([
                'error' => "Role sistem '{$role->name}' dilindungi dan tidak dapat dihapus.",
            ]);
        }

        $userCount = $role->users()->count();
        if ($userCount > 0) {
            return back()->withErrors([
                'error' => "Role '{$role->name}' masih digunakan oleh {$userCount} pengguna. Pindahkan pengguna ke role lain terlebih dahulu.",
            ]);
        }

        $name = $role->name;
        $role->delete();

        return back()->with('success', "Role '{$name}' berhasil dihapus.");
    }
}
