<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $hasRolesTable = \Illuminate\Support\Facades\Schema::hasTable('roles');

        if ($user && $hasRolesTable) {
            $user->loadMissing('role');
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'role_name' => ($hasRolesTable ? $user->role?->name : null) ?? 'Super Administrator',
                    'role_slug' => ($hasRolesTable ? $user->role?->slug : null) ?? 'super-admin',
                    'role_color' => ($hasRolesTable ? $user->role?->color : null) ?? 'emerald',
                    'is_super_admin' => $hasRolesTable ? $user->isSuperAdmin() : true,
                    'permissions' => $hasRolesTable ? $user->getEffectivePermissions() : \App\Models\Role::buildMatrix(['*' => 'all']),
                ]) : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
