<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleAdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
    }

    /**
     * GET /api/v1/admin/roles
     * List all roles with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $status = $request->input('status');

        $query = Role::with('permissions');

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        if ($status !== null) {
            $query->where('is_active', $status === 'active');
        }

        $roles = $query->withCount('users', 'permissions')
                       ->orderBy('created_at', 'desc')
                       ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    /**
     * GET /api/v1/admin/roles/{id}
     * Get a single role with its permissions and users.
     */
    public function show(string $id): JsonResponse
    {
        $role = Role::with('permissions', 'users')
                     ->withCount('users', 'permissions')
                     ->findOrFail($id);

        $permissionsByModule = $role->getPermissionsByModule();

        return response()->json([
            'success' => true,
            'data' => [
                'role' => $role,
                'permissions_by_module' => $permissionsByModule,
                'users_count' => $role->users_count,
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/roles
     * Create a new role.
     */
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

        // Attach permissions if provided
        if (!empty($validated['permission_ids'])) {
            $role->permissions()->attach($validated['permission_ids']);
        }

        $role->load('permissions');

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully.',
            'data' => $role,
        ], 201);
    }

    /**
     * PATCH /api/v1/admin/roles/{id}
     * Update a role.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', 'unique:roles,name,' . $id],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['uuid', 'exists:permissions,id'],
        ]);

        // Prevent changing system role types
        if ($role->isSystemRole() && isset($validated['role_type'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify system role type.',
            ], 403);
        }

        $permissionIds = $validated['permission_ids'] ?? null;
        unset($validated['permission_ids']);

        $role->update($validated);

        // Sync permissions if provided
        if ($permissionIds !== null) {
            $role->permissions()->sync($permissionIds);
        }

        $role->load('permissions');

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully.',
            'data' => $role,
        ]);
    }

    /**
     * DELETE /api/v1/admin/roles/{id}
     * Delete a role.
     */
    public function destroy(string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Prevent deleting system roles
        if ($role->isSystemRole()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete system roles.',
            ], 403);
        }

        // Check if role is assigned to users
        if ($role->users()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete role assigned to users.',
            ], 403);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully.',
        ]);
    }

    /**
     * POST /api/v1/admin/roles/{id}/assign-permissions
     * Assign permissions to a role.
     */
    public function assignPermissions(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'permission_ids' => ['required', 'array'],
            'permission_ids.*' => ['uuid', 'exists:permissions,id'],
        ]);

        $role->permissions()->sync($validated['permission_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Permissions assigned successfully.',
            'data' => $role->load('permissions'),
        ]);
    }

    /**
     * POST /api/v1/admin/roles/{id}/assign-users
     * Assign users to a role.
     */
    public function assignUsers(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'user_ids' => ['required', 'array'],
            'user_ids.*' => ['uuid', 'exists:users,id'],
        ]);

        $role->users()->attach($validated['user_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Users assigned to role successfully.',
            'data' => $role->load('users'),
        ]);
    }

    /**
     * POST /api/v1/admin/roles/{id}/remove-users
     * Remove users from a role.
     */
    public function removeUsers(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'user_ids' => ['required', 'array'],
            'user_ids.*' => ['uuid', 'exists:users,id'],
        ]);

        $role->users()->detach($validated['user_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Users removed from role successfully.',
        ]);
    }

    /**
     * GET /api/v1/admin/permissions
     * Get all permissions grouped by module.
     */
    public function getPermissions(): JsonResponse
    {
        $permissions = Permission::all();
        $grouped = $permissions->groupBy('module')->map(function ($items) {
            return $items->map(fn (Permission $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'action' => $p->action,
            ])->values();
        });

        return response()->json([
            'success' => true,
            'data' => $grouped,
            'all_permissions' => $permissions->toArray(),
        ]);
    }

    /**
     * GET /api/v1/admin/roles/{id}/users
     * Get users assigned to a role.
     */
    public function getRoleUsers(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);
        $perPage = $request->input('per_page', 15);

        $users = $role->users()
                      ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * GET /api/v1/admin/roles/default
     * Get default/system roles.
     */
    public function getDefaultRoles(): JsonResponse
    {
        $defaultRoles = Role::whereIn('role_type', ['super_admin', 'admin', 'manager', 'staff'])
                            ->with('permissions')
                            ->get();

        return response()->json([
            'success' => true,
            'data' => $defaultRoles,
        ]);
    }
}
