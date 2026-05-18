<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $name
 * @property ?string $description
 * @property string $role_type
 * @property bool $is_active
 * @property string $slug
 * @property ?string $tenant_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property ?Carbon $deleted_at
 * @property-read Collection<int, Permission> $permissions
 * @property-read Collection<int, User> $users
 */
class Role extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'role_type',
        'is_active',
        'slug',
        'tenant_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Role $role) {
            if (empty($role->slug)) {
                $role->slug = Str::slug($role->name);
            }
        });

        static::updating(function (Role $role) {
            if ($role->isDirty('name') && ! $role->isDirty('slug')) {
                $role->slug = Str::slug($role->name);
            }
        });
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_permission',
            'role_id',
            'permission_id'
        )->withTimestamps();
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_role',
            'role_id',
            'user_id'
        )->withTimestamps();
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->permissions()
            ->where('name', $permissionName)
            ->exists();
    }

    /**
     * Check if role has all given permissions.
     */
    public function hasAllPermissions(array $permissionNames): bool
    {
        return $this->permissions()
            ->whereIn('name', $permissionNames)
            ->count() === count($permissionNames);
    }

    /**
     * Check if role has any of the given permissions.
     */
    public function hasAnyPermission(array $permissionNames): bool
    {
        return $this->permissions()
            ->whereIn('name', $permissionNames)
            ->exists();
    }

    /**
     * Get permissions grouped by module.
     */
    public function getPermissionsByModule(): array
    {
        return $this->permissions()
            ->get()
            ->groupBy('module')
            ->map(fn (Collection $items) => $items->pluck('name')->toArray())
            ->toArray();
    }

    /**
     * Get the role type label.
     */
    public function getRoleTypeLabel(): string
    {
        return match ($this->role_type) {
            'super_admin' => 'Super Admin',
            'admin' => 'Admin',
            'manager' => 'Manager',
            'staff' => 'Staff',
            default => 'Custom',
        };
    }

    /**
     * Check if role is a system role (not custom).
     */
    public function isSystemRole(): bool
    {
        return in_array($this->role_type, ['super_admin', 'admin', 'manager', 'staff']);
    }
}
