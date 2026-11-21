<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property int|null $role_id
 * @property string $name
 * @property string $email
 * @property string|null $nip
 * @property string|null $jabatan
 * @property string|null $phone
 * @property bool $is_active
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Role|null $role
 */
#[Fillable(['role_id', 'name', 'email', 'nip', 'jabatan', 'phone', 'is_active', 'password', 'email_verified_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Role assigned to this user.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Determine if user is a Super Admin (or has no role restriction assigned yet).
     */
    public function isSuperAdmin(): bool
    {
        if (! $this->role_id) {
            return true;
        }

        return $this->role?->slug === 'super-admin';
    }

    /**
     * Check if the user has permission for a module & action.
     */
    public function hasPermission(string $moduleKey, string $actionKey = 'view'): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->role ? $this->role->hasPermission($moduleKey, $actionKey) : false;
    }

    /**
     * Get full normalized permission map for this user.
     *
     * @return array<string, array<string, bool>>
     */
    public function getEffectivePermissions(): array
    {
        if ($this->isSuperAdmin() || ! $this->role) {
            return Role::buildMatrix(['*' => 'all']);
        }

        return $this->role->getNormalizedPermissions();
    }
}
