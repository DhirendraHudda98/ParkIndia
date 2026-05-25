# Roles & Permissions - Implementation Action Plan

## Quick Summary

Your RBAC system is **50% complete**. Here's what's missing and needs fixing:

| Priority | Task | Status | Effort | Impact |
|----------|------|--------|--------|---------|
| 🔴 CRITICAL | Add User Model RBAC methods | ❌ Not Done | 30 min | High |
| 🔴 CRITICAL | Complete RoleAdminController endpoints | ⚠️ Partial | 45 min | High |
| 🟠 HIGH | Register middleware in Kernel | ❌ Not Done | 10 min | High |
| 🟠 HIGH | Fix dual RBAC system (remove RBACController) | ❌ Not Done | 20 min | High |
| 🟠 HIGH | Add audit logging | ❌ Not Done | 1 hour | Medium |
| 🟡 MEDIUM | Implement permission caching | ❌ Not Done | 45 min | Medium |
| 🟡 MEDIUM | Add bulk operations | ❌ Not Done | 30 min | Low |
| 🟡 MEDIUM | Enhance frontend components | ⚠️ Partial | 1 hour | Medium |

---

## Step-by-Step Implementation

### Phase 1: Critical Fixes (2 hours)

#### Step 1.1: Add User Model Methods
**File:** `app/Models/User.php`

Add this code to the User model:

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Model
{
    // ... existing code ...

    /**
     * User's assigned roles
     */
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
     * Check if user has a specific permission
     * Checks both direct permissions and role permissions
     */
    public function hasPermission(string $permissionName): bool
    {
        // Check through roles (most common case)
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissionName) {
                $query->where('permissions.name', $permissionName);
            })
            ->exists();
    }

    /**
     * Check if user has all given permissions
     */
    public function hasAllPermissions(array $permissionNames): bool
    {
        foreach ($permissionNames as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if user has any of the given permissions
     */
    public function hasAnyPermission(array $permissionNames): bool
    {
        foreach ($permissionNames as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all user permissions (direct + from roles)
     */
    public function getAllPermissions(): Collection
    {
        return $this->roles()
            ->with('permissions')
            ->get()
            ->flatMap(fn($role) => $role->permissions)
            ->unique('id');
    }

    /**
     * Assign role to user by name
     */
    public function assignRole(string $roleName): void
    {
        $role = Role::where('name', $roleName)->first();
        if ($role && !$this->roles()->where('id', $role->id)->exists()) {
            $this->roles()->attach($role->id);
        }
    }

    /**
     * Check if user has a specific role
     */
    public function hasRole(string $roleName): bool
    {
        return $this->roles()
            ->where('name', $roleName)
            ->exists();
    }

    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole(array $roleNames): bool
    {
        return $this->roles()
            ->whereIn('name', $roleNames)
            ->exists();
    }

    /**
     * Remove role from user by name
     */
    public function removeRole(string $roleName): void
    {
        $role = Role::where('name', $roleName)->first();
        if ($role) {
            $this->roles()->detach($role->id);
        }
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('Super Admin');
    }

    /**
     * Check if user is admin (super admin or admin role)
     */
    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['Super Admin', 'Admin']);
    }
}
```

#### Step 1.2: Register Middleware in Kernel
**File:** `app/Http/Kernel.php`

Add to the `$routeMiddleware` array:

```php
protected $routeMiddleware = [
    // ... existing middleware ...
    'permission' => \App\Http\Middleware\CheckPermission::class,
    'role' => \App\Http\Middleware\CheckRole::class,
    'admin' => \App\Http\Middleware\CheckAdminRole::class,
];
```

#### Step 1.3: Create CheckRole Middleware
**File:** `app/Http/Middleware/CheckRole.php`

Create this new middleware:

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $roleArray = explode('|', $roles);

        if (!$user->hasAnyRole($roleArray)) {
            return response()->json(['success' => false, 'message' => 'Access denied'], 403);
        }

        return $next($request);
    }
}
```

#### Step 1.4: Create CheckAdminRole Middleware
**File:** `app/Http/Middleware/CheckAdminRole.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Admin access required'], 403);
        }

        return $next($request);
    }
}
```

### Phase 2: Complete Missing Endpoints (1 hour)

#### Step 2.1: Complete RoleAdminController
**File:** `app/Http/Controllers/Api/RoleAdminController.php`

Make sure these methods exist (add if missing):

```php
/**
 * GET /api/v1/admin/permissions
 */
public function getPermissions(): JsonResponse
{
    $permissions = Permission::get()
        ->groupBy('module')
        ->map(function ($group) {
            return $group->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'description' => $permission->description,
                    'module' => $permission->module,
                    'action' => $permission->action,
                ];
            })->values();
        });

    return response()->json([
        'success' => true,
        'data' => $permissions,
    ]);
}

/**
 * GET /api/v1/admin/roles/default/list
 */
public function getDefaultRoles(): JsonResponse
{
    $defaultRoles = Role::where('role_type', '!=', 'custom')
        ->with('permissions')
        ->orderBy('role_type')
        ->get();

    return response()->json([
        'success' => true,
        'data' => $defaultRoles,
    ]);
}

/**
 * GET /api/v1/admin/roles/{id}/users
 */
public function getRoleUsers(Request $request, string $id): JsonResponse
{
    $role = Role::findOrFail($id);

    $perPage = $request->input('per_page', 15);
    $search = $request->input('search');

    $query = $role->users();

    if ($search) {
        $query->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
    }

    $users = $query->paginate($perPage);

    return response()->json([
        'success' => true,
        'data' => $users,
    ]);
}
```

### Phase 3: Add Audit Logging (1 hour)

#### Step 3.1: Create Audit Log Migration
```bash
php artisan make:migration create_permission_audit_logs_table
```

**File:** `database/migrations/[timestamp]_create_permission_audit_logs_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->string('action');
            $table->string('subject_type');
            $table->uuid('subject_id');
            $table->json('changes')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index(['subject_type', 'subject_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_audit_logs');
    }
};
```

#### Step 3.2: Create Audit Log Model
**File:** `app/Models/PermissionAuditLog.php`

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermissionAuditLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'changes',
        'ip_address',
    ];

    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function logAction(
        string $action,
        string $subjectType,
        string $subjectId,
        ?array $changes = null,
        ?string $userId = null
    ): void {
        static::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'changes' => $changes,
            'ip_address' => request()->ip(),
        ]);
    }
}
```

#### Step 3.3: Use in RoleAdminController
Update the `store()` method in `RoleAdminController`:

```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
        'description' => ['nullable', 'string', 'max:1000'],
        'role_type' => ['required', 'string', 'in:super_admin,admin,manager,staff,custom'],
        'is_active' => ['boolean'],
        'permission_ids' => ['nullable', 'array'],
        'permission_ids.*' => ['uuid', 'exists:permissions,id'],
    ]);

    $role = Role::create($validated);

    if (!empty($validated['permission_ids'])) {
        $role->permissions()->attach($validated['permission_ids']);
    }

    // Log the action
    PermissionAuditLog::logAction(
        'role_created',
        'Role',
        $role->id,
        ['name' => $role->name, 'permissions_count' => count($validated['permission_ids'] ?? [])]
    );

    $role->load('permissions');

    return response()->json([
        'success' => true,
        'message' => 'Role created successfully.',
        'data' => $role,
    ], 201);
}
```

---

## Verification Checklist

After implementing, verify with these tests:

### Test 1: User Role Assignment
```bash
php artisan tinker
```

```php
$user = User::find('user-id');
$user->assignRole('Manager');
echo $user->hasRole('Manager'); // Should output: 1
```

### Test 2: Permission Check
```php
$user = User::find('user-id');
echo $user->hasPermission('bookings.create'); // Should output: 1 or 0
```

### Test 3: API Endpoint
```bash
curl -X GET http://localhost:8000/api/v1/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Audit Logging
```php
DB::table('permission_audit_logs')->latest()->first();
// Should show recent role changes
```

---

## Common Issues & Solutions

### Issue: "Call to undefined method hasPermission()"
**Solution:** User model methods weren't added. Follow Step 1.1 above.

### Issue: "Permission denied" on admin endpoints
**Solution:** Middleware not registered. Follow Step 1.2 above.

### Issue: "404 on /api/v1/admin/roles"
**Solution:** Routes may not be in admin group. Check `routes/api.php` line 195-215.

### Issue: "SQLSTATE[42S02]: Table not found: permission_audit_logs"
**Solution:** Run migration: `php artisan migrate`

---

## Next Steps

1. ✅ Implement Phase 1 (Critical Fixes)
2. ✅ Implement Phase 2 (Complete Endpoints)
3. ✅ Implement Phase 3 (Audit Logging)
4. ⭕ Run migrations: `php artisan migrate`
5. ⭕ Test all endpoints
6. ⭕ Implement Phase 4 from main guide (Caching, Bulk Operations, etc.)
7. ⭕ Update frontend components
8. ⭕ Deploy with testing

---

## Time Estimate

- **Phase 1 (Critical):** 2 hours
- **Phase 2 (Endpoints):** 1 hour  
- **Phase 3 (Audit):** 1 hour
- **Testing:** 1 hour
- **Total:** ~5 hours for fully working RBAC

Start with Phase 1 for immediate results!
