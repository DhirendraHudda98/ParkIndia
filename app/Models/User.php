<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property string $id
 * @property ?string $username
 * @property string $email
 * @property string $name
 * @property ?string $picture
 * @property ?string $phone
 * @property string $password
 * @property string $role
 * @property ?array<string, mixed> $preferences
 * @property bool $is_active
 * @property ?string $department
 * @property ?Carbon $last_login
 * @property int $credits_balance
 * @property int $credits_monthly_quota
 * @property ?Carbon $credits_last_refilled
 * @property ?Carbon $email_verified_at
 * @property ?string $two_factor_secret
 * @property bool $two_factor_enabled
 * @property ?array<string, mixed> $notification_preferences
 * @property ?string $ical_token
 * @property ?string $tenant_id
 * @property string $accessibility_needs
 * @property ?string $cost_center
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property ?Carbon $deleted_at
 * @property-read Collection<int, LoginHistory> $loginHistory
 * @property-read Collection<int, Booking> $bookings
 * @property-read Collection<int, Vehicle> $vehicles
 * @property-read Collection<int, Absence> $absences
 * @property-read Collection<int, Notification> $notifications_list
 * @property-read Collection<int, Favorite> $favorites
 * @property-read Collection<int, RecurringBooking> $recurringBookings
 * @property-read Collection<int, CreditTransaction> $creditTransactions
 * @property-read Collection<int, Role> $roles
 * @property-read ?Tenant $tenant
 */
class User extends Authenticatable
{
    use BelongsToTenant, HasApiTokens, HasFactory, HasUuids, Notifiable, SoftDeletes;

    protected $fillable = [
        'username', 'email', 'password', 'name', 'picture', 'phone',
        'preferences', 'is_active', 'department', 'last_login',
        'credits_balance', 'credits_monthly_quota', 'credits_last_refilled',
        'two_factor_secret', 'two_factor_enabled', 'notification_preferences',
        'ical_token', 'tenant_id', 'accessibility_needs', 'cost_center',
        'settings',
    ];

    protected $hidden = ['password', 'remember_token', 'two_factor_secret'];

    protected function casts(): array
    {
        return [
            'preferences' => 'array',
            'is_active' => 'boolean',
            'last_login' => 'datetime',
            'email_verified_at' => 'datetime',
            'credits_balance' => 'integer',
            'credits_monthly_quota' => 'integer',
            'credits_last_refilled' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'notification_preferences' => 'array',
            'settings' => 'array',
        ];
    }

    public function loginHistory(): HasMany
    {
        return $this->hasMany(LoginHistory::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }

    public function notifications_list(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function recurringBookings(): HasMany
    {
        return $this->hasMany(RecurringBooking::class);
    }

    public function creditTransactions(): HasMany
    {
        return $this->hasMany(CreditTransaction::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'user_role',
            'user_id',
            'role_id'
        )->withTimestamps();
    }

    /**
     * Check if user has a specific permission via their roles.
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->roles()
            ->whereHas('permissions', fn ($q) => $q->where('name', $permissionName))
            ->exists();
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissionNames): bool
    {
        return $this->roles()
            ->whereHas('permissions', fn ($q) => $q->whereIn('name', $permissionNames))
            ->exists();
    }

    /**
     * Check if user has all given permissions.
     */
    public function hasAllPermissions(array $permissionNames): bool
    {
        $userPermissions = $this->roles()
            ->with('permissions')
            ->get()
            ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
            ->unique();

        return count(array_intersect($permissionNames, $userPermissions->toArray())) === count($permissionNames);
    }

    /**
     * Get all permissions for the user.
     */
    public function getPermissions(): array
    {
        return $this->roles()
            ->with('permissions')
            ->get()
            ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
            ->unique()
            ->toArray();
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $roleName): bool
    {
        return $this->roles()
            ->where('name', $roleName)
            ->exists();
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasAnyRole(array $roleNames): bool
    {
        return $this->roles()
            ->whereIn('name', $roleNames)
            ->exists();
    }

    /**
     * Assign a role to the user.
     */
    public function assignRole(string $roleName): void
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        $this->roles()->syncWithoutDetaching($role->id);
    }

    /**
     * Remove a role from the user.
     */
    public function removeRole(string $roleName): void
    {
        $role = Role::where('name', $roleName)->first();
        if ($role) {
            $this->roles()->detach($role->id);
        }
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'superadmin']);
    }

    /**
     * Platform-level admin: `superadmin` role with no `tenant_id`.
     *
     * Platform admins are allowed to see cross-tenant aggregates in
     * admin analytics / reports; regular tenant admins (role `admin`
     * or `superadmin` scoped to a specific `tenant_id`) are confined
     * to their own tenant's rows via the `BelongsToTenantScope`.
     */
    public function isPlatformAdmin(): bool
    {
        return $this->role === 'superadmin' && empty($this->tenant_id);
    }

    public function isPremium(): bool
    {
        return $this->role === 'premium';
    }
}
