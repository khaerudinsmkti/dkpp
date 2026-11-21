<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckModulePermission
{
    /**
     * Handle an incoming request and verify user active state and module permissions.
     */
    public function handle(Request $request, Closure $next, ?string $moduleKey = null, string $actionKey = 'view'): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (isset($user->is_active) && ! $user->is_active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda sedang dinonaktifkan oleh Administrator. Silakan hubungi Admin DKPP.',
            ]);
        }

        if ($moduleKey !== null && ! $user->hasPermission($moduleKey, $actionKey)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Anda tidak memiliki hak akses untuk melakukan aksi ini pada modul terkait.',
                ], 403);
            }

            if ($actionKey !== 'view') {
                return back()->withErrors([
                    'error' => 'Akses Ditolak: Role Anda tidak memiliki izin untuk melakukan perubahan data pada modul ini.',
                ]);
            }

            abort(403, 'Anda tidak memiliki hak akses untuk membuka modul ini.');
        }

        return $next($request);
    }
}
