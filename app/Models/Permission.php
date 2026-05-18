<?php

declare(strict_types=1);

namespace App\Models;

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
 * @property string $module
 * @property string $action
 * @property string $slug
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property ?Carbon $deleted_at
 * @property-read Collection<int, Role> $roles
 */
class Permission extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'module',
        'action',
        'slug',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Permission $permission) {
            if (empty($permission->slug)) {
                $permission->slug = Str::slug($permission->name);
            }
        });

        static::updating(function (Permission $permission) {
            if ($permission->isDirty('name') && ! $permission->isDirty('slug')) {
                $permission->slug = Str::slug($permission->name);
            }
        });
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'role_permission',
            'permission_id',
            'role_id'
        )->withTimestamps();
    }

    /**
     * Get all permissions grouped by module.
     */
    public static function groupedByModule(): array
    {
        return self::all()
            ->groupBy('module')
            ->map(fn (Collection $items) => $items->toArray())
            ->toArray();
    }

    /**
     * Get permissions for a specific module.
     */
    public static function byModule(string $module): Collection
    {
        return self::where('module', $module)->get();
    }
}
