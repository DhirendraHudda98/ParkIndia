<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Define all permissions
        $permissions = [
            // Users Module
            ['name' => 'users.view', 'description' => 'View users', 'module' => 'users', 'action' => 'view'],
            ['name' => 'users.create', 'description' => 'Create users', 'module' => 'users', 'action' => 'create'],
            ['name' => 'users.edit', 'description' => 'Edit users', 'module' => 'users', 'action' => 'edit'],
            ['name' => 'users.delete', 'description' => 'Delete users', 'module' => 'users', 'action' => 'delete'],
            ['name' => 'users.manage', 'description' => 'Manage all user operations', 'module' => 'users', 'action' => 'manage'],

            // Parking Lots Module
            ['name' => 'parking_lots.view', 'description' => 'View parking lots', 'module' => 'parking_lots', 'action' => 'view'],
            ['name' => 'parking_lots.create', 'description' => 'Create parking lots', 'module' => 'parking_lots', 'action' => 'create'],
            ['name' => 'parking_lots.edit', 'description' => 'Edit parking lots', 'module' => 'parking_lots', 'action' => 'edit'],
            ['name' => 'parking_lots.delete', 'description' => 'Delete parking lots', 'module' => 'parking_lots', 'action' => 'delete'],
            ['name' => 'parking_lots.manage_slots', 'description' => 'Manage parking slots', 'module' => 'parking_lots', 'action' => 'manage'],
            ['name' => 'parking_lots.manage_availability', 'description' => 'Manage availability', 'module' => 'parking_lots', 'action' => 'manage'],

            // Parking Zones Module
            ['name' => 'parking_zones.view', 'description' => 'View parking zones', 'module' => 'parking_zones', 'action' => 'view'],
            ['name' => 'parking_zones.create', 'description' => 'Create parking zones', 'module' => 'parking_zones', 'action' => 'create'],
            ['name' => 'parking_zones.edit', 'description' => 'Edit parking zones', 'module' => 'parking_zones', 'action' => 'edit'],
            ['name' => 'parking_zones.delete', 'description' => 'Delete parking zones', 'module' => 'parking_zones', 'action' => 'delete'],
            ['name' => 'parking_zones.manage_pricing', 'description' => 'Manage pricing multipliers', 'module' => 'parking_zones', 'action' => 'manage'],

            // Bookings Module
            ['name' => 'bookings.view', 'description' => 'View bookings', 'module' => 'bookings', 'action' => 'view'],
            ['name' => 'bookings.create', 'description' => 'Create bookings', 'module' => 'bookings', 'action' => 'create'],
            ['name' => 'bookings.edit', 'description' => 'Edit bookings', 'module' => 'bookings', 'action' => 'edit'],
            ['name' => 'bookings.delete', 'description' => 'Delete bookings', 'module' => 'bookings', 'action' => 'delete'],
            ['name' => 'bookings.manage', 'description' => 'Manage all booking operations', 'module' => 'bookings', 'action' => 'manage'],

            // Billing Module
            ['name' => 'billing.view', 'description' => 'View billing information', 'module' => 'billing', 'action' => 'view'],
            ['name' => 'billing.view_transactions', 'description' => 'View transactions', 'module' => 'billing', 'action' => 'view'],
            ['name' => 'billing.process_refunds', 'description' => 'Process refunds', 'module' => 'billing', 'action' => 'manage'],

            // Reports & Analytics Module
            ['name' => 'reports.view', 'description' => 'View reports and analytics', 'module' => 'reports', 'action' => 'view'],
            ['name' => 'reports.export', 'description' => 'Export reports', 'module' => 'reports', 'action' => 'create'],

            // Roles & Permissions Module
            ['name' => 'roles.view', 'description' => 'View roles', 'module' => 'roles', 'action' => 'view'],
            ['name' => 'roles.create', 'description' => 'Create roles', 'module' => 'roles', 'action' => 'create'],
            ['name' => 'roles.edit', 'description' => 'Edit roles', 'module' => 'roles', 'action' => 'edit'],
            ['name' => 'roles.delete', 'description' => 'Delete roles', 'module' => 'roles', 'action' => 'delete'],
            ['name' => 'roles.manage', 'description' => 'Manage all role operations', 'module' => 'roles', 'action' => 'manage'],
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Get all permissions
        $allPermissions = Permission::all();

        // Define default roles with their permissions
        $roles = [
            [
                'name' => 'Super Admin',
                'description' => 'Full system access',
                'role_type' => 'super_admin',
                'is_active' => true,
                'permissions' => $allPermissions->pluck('id')->toArray(), // All permissions
            ],
            [
                'name' => 'Admin',
                'description' => 'Administrative access',
                'role_type' => 'admin',
                'is_active' => true,
                'permissions' => $allPermissions->except(['roles.delete'])->pluck('id')->toArray(), // All except delete roles
            ],
            [
                'name' => 'Manager',
                'description' => 'Manage operations',
                'role_type' => 'manager',
                'is_active' => true,
                'permissions' => $allPermissions->filter(fn ($p) => in_array($p->module, ['parking_lots', 'parking_zones', 'bookings', 'reports']))->pluck('id')->toArray(),
            ],
            [
                'name' => 'Staff',
                'description' => 'Limited operational access',
                'role_type' => 'staff',
                'is_active' => true,
                'permissions' => $allPermissions->filter(fn ($p) => in_array($p->action, ['view', 'create']) && in_array($p->module, ['bookings', 'reports']))->pluck('id')->toArray(),
            ],
        ];

        // Create roles and attach permissions
        foreach ($roles as $roleData) {
            $permissionIds = $roleData['permissions'];
            unset($roleData['permissions']);

            $role = Role::updateOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );

            $role->permissions()->sync($permissionIds);
        }
    }
}
