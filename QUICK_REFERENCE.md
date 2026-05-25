# Quick Reference: Copy-Paste Solutions

**Use this guide for rapid implementation of critical fixes.**

---

## 1. Add User Model RBAC Methods (CRITICAL)

**File:** `app/Models/User.php`

Add this to your User class (after existing relationships):

```php
// Add these imports at top if not present
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Collection;

// Add this method to User class
public function roles(): BelongsToMany
{
    return $this->belongsToMany(
        Role::class,
        'user_role',
        'user_id',
        'role_id'
    )->withTimestamps();
}

public function hasPermission(string $permissionName): bool
{
    return $this->roles()
        ->whereHas('permissions', function ($query) use ($permissionName) {
            $query->where('permissions.name', $permissionName);
        })
        ->exists();
}

public function hasAllPermissions(array $permissionNames): bool
{
    foreach ($permissionNames as $permission) {
        if (!$this->hasPermission($permission)) {
            return false;
        }
    }
    return true;
}

public function hasAnyPermission(array $permissionNames): bool
{
    foreach ($permissionNames as $permission) {
        if ($this->hasPermission($permission)) {
            return true;
        }
    }
    return false;
}

public function getAllPermissions(): Collection
{
    return $this->roles()
        ->with('permissions')
        ->get()
        ->flatMap(fn($role) => $role->permissions)
        ->unique('id');
}

public function assignRole(string $roleName): void
{
    $role = Role::where('name', $roleName)->first();
    if ($role && !$this->roles()->where('id', $role->id)->exists()) {
        $this->roles()->attach($role->id);
    }
}

public function hasRole(string $roleName): bool
{
    return $this->roles()
        ->where('name', $roleName)
        ->exists();
}

public function hasAnyRole(array $roleNames): bool
{
    return $this->roles()
        ->whereIn('name', $roleNames)
        ->exists();
}

public function removeRole(string $roleName): void
{
    $role = Role::where('name', $roleName)->first();
    if ($role) {
        $this->roles()->detach($role->id);
    }
}

public function isSuperAdmin(): bool
{
    return $this->hasRole('Super Admin');
}

public function isAdmin(): bool
{
    return $this->hasAnyRole(['Super Admin', 'Admin']);
}
```

**Test it:**
```bash
php artisan tinker
>>> $user = User::first();
>>> $user->assignRole('Manager');
>>> $user->hasRole('Manager'); // Should return true
>>> $user->hasPermission('bookings.create'); // Check permission
```

---

## 2. Create & Register Middlewares (CRITICAL)

### Create CheckRole Middleware
**Command:**
```bash
php artisan make:middleware CheckRole
```

**File:** `app/Http/Middleware/CheckRole.php`

Replace entire file with:

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

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

### Create CheckAdminRole Middleware
**Command:**
```bash
php artisan make:middleware CheckAdminRole
```

**File:** `app/Http/Middleware/CheckAdminRole.php`

Replace entire file with:

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

### Register in Kernel
**File:** `app/Http/Kernel.php`

Find `$routeMiddleware` array and add:

```php
protected $routeMiddleware = [
    // ... other middleware ...
    'permission' => \App\Http\Middleware\CheckPermission::class,
    'role' => \App\Http\Middleware\CheckRole::class,
    'admin' => \App\Http\Middleware\CheckAdminRole::class,
];
```

---

## 3. Complete RoleAdminController Missing Methods (CRITICAL)

**File:** `app/Http/Controllers/Api/RoleAdminController.php`

Add these methods to the controller class:

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

---

## 4. Add Audit Logging Model (HIGH PRIORITY)

### Step 1: Create Migration
```bash
php artisan make:migration create_permission_audit_logs_table
```

**File:** `database/migrations/[date]_create_permission_audit_logs_table.php`

Replace entire file with:

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

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
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

### Step 2: Create Model
**File:** `app/Models/PermissionAuditLog.php`

Create new file with:

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

### Step 3: Run Migration
```bash
php artisan migrate
```

### Step 4: Add to RoleAdminController
In the `store()` method, add after creating role:

```php
// Add this import at top of file
use App\Models\PermissionAuditLog;

// Then in store() method, add this before return statement:
PermissionAuditLog::logAction(
    'role_created',
    'Role',
    $role->id,
    [
        'name' => $role->name,
        'permissions_count' => count($validated['permission_ids'] ?? [])
    ]
);
```

Do the same in `update()` and `destroy()` methods with appropriate action names.

---

## 5. Quick Permission Caching Service (MEDIUM PRIORITY)

**File:** `app/Services/RolePermissionCache.php`

Create new file:

```php
<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\Cache;

class RolePermissionCache
{
    private const CACHE_TTL = 3600; // 1 hour

    public static function getPermissions(): array
    {
        return Cache::remember('permissions:all', self::CACHE_TTL, function () {
            return Permission::select('id', 'name', 'module', 'action')
                ->get()
                ->toArray();
        });
    }

    public static function getRolePermissions(string $roleId): array
    {
        return Cache::remember(
            "role:$roleId:permissions",
            self::CACHE_TTL,
            function () use ($roleId) {
                $role = Role::with('permissions')->find($roleId);
                return $role?->permissions->pluck('name')->toArray() ?? [];
            }
        );
    }

    public static function invalidate(?string $roleId = null): void
    {
        Cache::forget('permissions:all');
        if ($roleId) {
            Cache::forget("role:$roleId:permissions");
        }
    }
}
```

Use in controller after updates:
```php
use App\Services\RolePermissionCache;

// After updating permissions
RolePermissionCache::invalidate($role->id);
```

---

## 6. Fix Routes (CRITICAL)

**File:** `routes/api.php`

Verify around line 195-215, you have:

```php
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // ... other routes ...

    // Roles & Permissions (RBAC management)
    Route::get('/roles', [RoleAdminController::class, 'index']);
    Route::post('/roles', [RoleAdminController::class, 'store']);
    Route::get('/roles/{id}', [RoleAdminController::class, 'show']);
    Route::patch('/roles/{id}', [RoleAdminController::class, 'update']);
    Route::delete('/roles/{id}', [RoleAdminController::class, 'destroy']);
    Route::post('/roles/{id}/assign-permissions', [RoleAdminController::class, 'assignPermissions']);
    Route::post('/roles/{id}/assign-users', [RoleAdminController::class, 'assignUsers']);
    Route::post('/roles/{id}/remove-users', [RoleAdminController::class, 'removeUsers']);
    Route::get('/roles/{id}/users', [RoleAdminController::class, 'getRoleUsers']);
    Route::get('/permissions', [RoleAdminController::class, 'getPermissions']);
    Route::get('/roles/default/list', [RoleAdminController::class, 'getDefaultRoles']);
});
```

If any endpoint is missing, add the route.

---

## 7. Test Everything Works (VERIFY)

### Test 1: User Methods
```bash
php artisan tinker
```

```php
>>> $user = User::first();
>>> $user->assignRole('Manager')
>>> $user->hasRole('Manager')
// Should output: true

>>> $user->hasPermission('bookings.create')
// Should output: true or false depending on role

>>> $user->getAllPermissions()
// Should list all permissions from assigned roles
```

### Test 2: API Endpoints
```bash
# Get all roles
curl -X GET http://localhost:8000/api/v1/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all permissions
curl -X GET http://localhost:8000/api/v1/admin/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a role
curl -X POST http://localhost:8000/api/v1/admin/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Role",
    "description": "Test",
    "role_type": "custom",
    "is_active": true,
    "permission_ids": []
  }'
```

### Test 3: Middleware Protection
```bash
# Without token (should fail)
curl http://localhost:8000/api/v1/admin/roles

# With token but no admin role (should fail)
curl http://localhost:8000/api/v1/admin/roles \
  -H "Authorization: Bearer USER_TOKEN"

# With admin token (should succeed)
curl http://localhost:8000/api/v1/admin/roles \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test 4: Audit Logging
```bash
php artisan tinker
>>> DB::table('permission_audit_logs')->latest()->first();
// Should show recent changes
```

---

## 8. Deploy Checklist

```bash
# 1. Add files
# ✅ app/Http/Middleware/CheckRole.php (created)
# ✅ app/Http/Middleware/CheckAdminRole.php (created)
# ✅ app/Models/PermissionAuditLog.php (created)
# ✅ app/Services/RolePermissionCache.php (created)

# 2. Update files
# ✅ app/Models/User.php (added methods)
# ✅ app/Http/Kernel.php (registered middleware)
# ✅ app/Http/Controllers/Api/RoleAdminController.php (added methods)

# 3. Create migrations
# ✅ database/migrations/[date]_create_permission_audit_logs_table.php

# 4. Run database
php artisan migrate

# 5. Run tests
php artisan test

# 6. Test routes
# Use curl commands above to test each endpoint

# 7. Deploy
git add .
git commit -m "feat: complete RBAC implementation with audit logging"
git push
```

---

## 9. Common Errors & Fixes

| Error | Solution |
|-------|----------|
| `Call to undefined method hasPermission()` | Run Step 1 above - add User model methods |
| `SQLSTATE[HY000]: General error: 1030` (middleware) | Add middleware to Kernel.php (Step 2) |
| `SQLSTATE[42S02]: Table not found: permission_audit_logs` | Run `php artisan migrate` |
| `500 Error on /api/v1/admin/permissions` | Check RoleAdminController has getPermissions() method |
| `Auth token not working` | Ensure you're using Bearer token: `Authorization: Bearer TOKEN` |

---

## 10. Performance Tips

```php
// ❌ SLOW - Hits database every time
if ($user->hasPermission('bookings.create')) {
    // ...
}

// ✅ FAST - Uses cache
RolePermissionCache::getPermissions();

// ✅ FAST - Uses lazy loading
$user->with('roles.permissions')->find($id);

// ❌ SLOW - Loads all users
$users = User::all();

// ✅ FAST - Pagination
$users = User::paginate(15);
```

---

**Total Implementation Time: ~4-5 hours**

Start with steps 1-4 first (2-3 hours) to get basic RBAC working, then add steps 5-8 for production-ready system.

