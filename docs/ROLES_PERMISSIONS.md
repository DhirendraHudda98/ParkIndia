# Roles & Permissions (RBAC) Module

## Overview

The Roles & Permissions module implements a robust Role-Based Access Control (RBAC) system for ParkHub. It allows administrators to create custom roles, assign granular permissions based on system modules, and manage user access at scale.

## Features

### Core Functionality

- **Role Management** - Create, edit, delete custom roles
- **Permission Management** - Granular permission system based on modules and actions
- **User-Role Assignment** - Assign multiple roles to users
- **Permission Inheritance** - Users inherit all permissions from their assigned roles
- **System Roles** - Pre-built default roles (Super Admin, Admin, Manager, Staff)
- **Module-Based Permissions** - Organize permissions by feature modules
- **Permission Verification** - Middleware for protecting API endpoints

### Default Roles

1. **Super Admin** - Full system access, all permissions
2. **Admin** - All permissions except deleting system roles
3. **Manager** - Access to parking lots, zones, bookings, and reports
4. **Staff** - Limited access: view and create permissions for bookings and reports

## Technical Architecture

### Database Schema

#### `roles` Table
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    role_type ENUM('super_admin', 'admin', 'manager', 'staff', 'custom') DEFAULT 'custom',
    is_active BOOLEAN DEFAULT true,
    slug VARCHAR(255) UNIQUE,
    tenant_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### `permissions` Table
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(100),
    action VARCHAR(100),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### `role_permission` Pivot Table
```sql
CREATE TABLE role_permission (
    role_id UUID,
    permission_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);
```

#### `user_role` Pivot Table
```sql
CREATE TABLE user_role (
    user_id UUID,
    role_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
```

### Permissions by Module

#### Users Module
- `users.view` - View users
- `users.create` - Create users
- `users.edit` - Edit users
- `users.delete` - Delete users
- `users.manage` - Manage all user operations

#### Parking Lots Module
- `parking_lots.view` - View parking lots
- `parking_lots.create` - Create parking lots
- `parking_lots.edit` - Edit parking lots
- `parking_lots.delete` - Delete parking lots
- `parking_lots.manage_slots` - Manage parking slots
- `parking_lots.manage_availability` - Manage availability

#### Parking Zones Module
- `parking_zones.view` - View parking zones
- `parking_zones.create` - Create parking zones
- `parking_zones.edit` - Edit parking zones
- `parking_zones.delete` - Delete parking zones
- `parking_zones.manage_pricing` - Manage pricing multipliers

#### Bookings Module
- `bookings.view` - View bookings
- `bookings.create` - Create bookings
- `bookings.edit` - Edit bookings
- `bookings.delete` - Delete bookings
- `bookings.manage` - Manage all booking operations

#### Billing Module
- `billing.view` - View billing information
- `billing.view_transactions` - View transactions
- `billing.process_refunds` - Process refunds

#### Reports & Analytics Module
- `reports.view` - View reports and analytics
- `reports.export` - Export reports

#### Roles & Permissions Module
- `roles.view` - View roles
- `roles.create` - Create roles
- `roles.edit` - Edit roles
- `roles.delete` - Delete roles
- `roles.manage` - Manage all role operations

### Backend (Laravel)

#### Models

**Role Model**
Location: `app/Models/Role.php`

Key Methods:
- `permissions()` - BelongsToMany relationship to permissions
- `users()` - BelongsToMany relationship to users
- `hasPermission(string $name)` - Check if role has permission
- `hasAllPermissions(array $names)` - Check if role has all permissions
- `hasAnyPermission(array $names)` - Check if role has any of the permissions
- `getPermissionsByModule()` - Get permissions grouped by module
- `isSystemRole()` - Check if role is a system role
- `getRoleTypeLabel()` - Get human-readable role type

**Permission Model**
Location: `app/Models/Permission.php`

Key Methods:
- `roles()` - BelongsToMany relationship to roles
- `groupedByModule()` - Get all permissions grouped by module
- `byModule(string $module)` - Get permissions for a module

**User Model Updates**
Location: `app/Models/User.php`

New Methods:
- `roles()` - BelongsToMany relationship to roles
- `hasPermission(string $name)` - Check if user has permission
- `hasAnyPermission(array $names)` - Check if user has any permission
- `hasAllPermissions(array $names)` - Check if user has all permissions
- `getPermissions()` - Get all user permissions
- `hasRole(string $name)` - Check if user has role
- `hasAnyRole(array $names)` - Check if user has any role
- `assignRole(string $name)` - Assign role to user
- `removeRole(string $name)` - Remove role from user

#### Controller: `RoleAdminController`
Location: `app/Http/Controllers/Api/RoleAdminController.php`

API Endpoints:
- `GET /api/v1/admin/roles` - List roles (paginated)
- `POST /api/v1/admin/roles` - Create role
- `GET /api/v1/admin/roles/{id}` - Get role details
- `PATCH /api/v1/admin/roles/{id}` - Update role
- `DELETE /api/v1/admin/roles/{id}` - Delete role (custom only)
- `POST /api/v1/admin/roles/{id}/assign-permissions` - Assign permissions
- `POST /api/v1/admin/roles/{id}/assign-users` - Assign users
- `POST /api/v1/admin/roles/{id}/remove-users` - Remove users
- `GET /api/v1/admin/roles/{id}/users` - Get role users
- `GET /api/v1/admin/permissions` - Get all permissions
- `GET /api/v1/admin/roles/default/list` - Get system roles

#### Middleware

**CheckPermission Middleware**
Location: `app/Http/Middleware/CheckPermission.php`

Usage in routes:
```php
Route::post('/api/v1/bookings', [BookingController::class, 'store'])
    ->middleware('auth:sanctum')
    ->middleware('permission:bookings.create');
```

**CheckRole Middleware**
Location: `app/Http/Middleware/CheckRole.php`

Usage in routes:
```php
Route::get('/api/v1/admin/reports', [ReportController::class, 'index'])
    ->middleware('auth:sanctum')
    ->middleware('role:admin|manager');
```

#### Database Seeder

**RolePermissionSeeder**
Location: `database/seeders/RolePermissionSeeder.php`

Automatically creates:
- All permissions for each module
- 4 system roles with appropriate permissions
- Relationship between roles and permissions

Run with: `php artisan db:seed --class=RolePermissionSeeder`

### Frontend (React)

#### Service: `rolesService.js`
Location: `parkhub-web/src/api/rolesService.js`

Methods for all API operations:
- `getRoles(params)` - Get paginated roles
- `getRole(id)` - Get single role
- `createRole(data)` - Create role
- `updateRole(id, data)` - Update role
- `deleteRole(id)` - Delete role
- `getPermissions()` - Get all permissions
- `assignPermissions(roleId, permissionIds)` - Assign permissions
- `assignUsers(roleId, userIds)` - Assign users
- `removeUsers(roleId, userIds)` - Remove users
- `getRoleUsers(roleId, params)` - Get role users
- `getDefaultRoles()` - Get system roles

#### Components

1. **RolesPermissions.jsx** - Main container component
   - Manages state for roles and UI
   - Handles CRUD operations
   - Implements search and filtering
   - Manages pagination

2. **RoleTable.jsx** - Table display component
   - Shows roles in structured table
   - Inline edit and delete buttons
   - Status and type badges
   - User and permission counts

3. **RoleForm.jsx** - Create/edit form component
   - Input validation
   - Module-based permission selection
   - Select all/deselect per module
   - Dynamic form state management

4. **RolesPermissions.css** - Comprehensive styling
   - Responsive design
   - Modal styling
   - Table styling
   - Form styling

## API Examples

### Create a Role
```bash
POST /api/v1/admin/roles
Content-Type: application/json
Authorization: Bearer {token}

{
    "name": "Support Manager",
    "description": "Manages support tickets and user issues",
    "role_type": "custom",
    "is_active": true,
    "permission_ids": [
        "uuid-permission-1",
        "uuid-permission-2",
        "uuid-permission-3"
    ]
}
```

### Update Role Permissions
```bash
POST /api/v1/admin/roles/{roleId}/assign-permissions
Content-Type: application/json
Authorization: Bearer {token}

{
    "permission_ids": [
        "uuid-permission-1",
        "uuid-permission-4"
    ]
}
```

### Assign Users to Role
```bash
POST /api/v1/admin/roles/{roleId}/assign-users
Content-Type: application/json
Authorization: Bearer {token}

{
    "user_ids": ["user-uuid-1", "user-uuid-2"]
}
```

### Check User Permissions
```php
// In Controller
if ($request->user()->hasPermission('bookings.create')) {
    // Allow booking creation
}

if ($request->user()->hasAnyPermission(['bookings.edit', 'bookings.delete'])) {
    // Allow booking modification
}
```

### Protect Routes with Middleware
```php
// In routes/api.php
Route::post('/bookings', [BookingController::class, 'store'])
    ->middleware('permission:bookings.create');

Route::get('/admin/reports', [ReportController::class, 'index'])
    ->middleware('role:admin|manager');
```

## Database Migrations

Run migrations to create the database schema:

```bash
php artisan migrate
```

Migration files:
- `2026_05_18_000003_create_roles_table.php`
- `2026_05_18_000004_create_permissions_table.php`
- `2026_05_18_000005_create_role_permission_table.php`
- `2026_05_18_000006_create_user_role_table.php`

## Installation & Setup

### 1. Run Migrations
```bash
php artisan migrate
```

### 2. Seed Default Roles & Permissions
```bash
php artisan db:seed --class=RolePermissionSeeder
```

### 3. Assign Role to User
```php
$user = User::find($userId);
$user->roles()->attach($roleId);
// or
$user->assignRole('Manager');
```

### 4. Check Permissions in Code
```php
// Check single permission
if ($user->hasPermission('bookings.create')) {
    // Allow action
}

// Check role
if ($user->hasRole('Manager')) {
    // Allow action
}

// Check any permission
if ($user->hasAnyPermission(['bookings.edit', 'bookings.delete'])) {
    // Allow action
}
```

## Usage Examples

### Create Custom Role with Specific Permissions
```javascript
const response = await rolesService.createRole({
  name: 'Parking Lot Manager',
  description: 'Manages parking lots and slots',
  is_active: true,
  permission_ids: [
    permissionIds['parking_lots.view'],
    permissionIds['parking_lots.edit'],
    permissionIds['parking_lots.manage_slots'],
  ],
});
```

### Assign Multiple Users to Role
```javascript
await rolesService.assignUsers(roleId, [
  'user-uuid-1',
  'user-uuid-2',
  'user-uuid-3',
]);
```

### Get Permissions for Module
```php
$permissions = Permission::byModule('bookings')->get();
```

### Check User Access Before Action
```php
// In Controller
public function deleteBooking($id)
{
    if (!$this->user()->hasPermission('bookings.delete')) {
        return response()->json(['error' => 'Forbidden'], 403);
    }
    
    // Delete booking...
}
```

## Features & Enhancements

### Current Features
- ✅ CRUD operations for roles
- ✅ Granular permission management
- ✅ User-role assignment
- ✅ Permission inheritance
- ✅ System roles (Super Admin, Admin, Manager, Staff)
- ✅ Module-based permission organization
- ✅ Permission middleware
- ✅ Responsive admin UI
- ✅ Database seeder for default data

### Optional Future Enhancements
- 🔄 Role templates
- 📊 Permission audit logs
- 🔐 Scope-based permissions (e.g., lot-level access)
- 🎯 Dynamic permission groups
- 📋 Role hierarchy/inheritance
- ⏰ Time-based permissions
- 🌍 Tenant-specific role overrides

## Security Best Practices

1. **Always verify permissions** - Never trust client-side permission checks
2. **Use middleware** - Protect all sensitive endpoints with permission/role middleware
3. **Default deny** - Require explicit permission rather than blacklisting
4. **Audit changes** - Log all role and permission changes
5. **Separate concerns** - Use role-based for broad access, permissions for specific actions
6. **Regular audits** - Review user roles and permissions periodically

## Troubleshooting

### Issue: User cannot access endpoint despite having role
- **Solution**: Check that role is assigned AND has the required permission. Use `$user->getPermissions()` to debug.

### Issue: Permission not showing in list
- **Solution**: Ensure permission exists in database. Run `php artisan db:seed --class=RolePermissionSeeder` to create all permissions.

### Issue: Cannot delete system role
- **Solution**: System roles (Super Admin, Admin, Manager, Staff) are protected. Only custom roles can be deleted.

### Issue: Changes not taking effect
- **Solution**: Clear cache with `php artisan cache:clear` and refresh browser.

## Support & Documentation

For more information, refer to:
- [ParkHub API Documentation](../../docs/API.md)
- [Database Configuration](../../docs/CONFIGURATION.md)
- [Security Guidelines](../../docs/SECURITY.md)

---

**Version**: 1.0.0  
**Last Updated**: May 18, 2026  
**Status**: Production Ready  
**Stability**: Stable
