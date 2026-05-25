# Roles & Permissions - Visual Architecture Guide

## Current State vs Improved State

### Current Architecture (50% Complete)

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│ ✅ RolesPermissions.jsx (Main Component)                    │
│ ✅ RoleTable.jsx (Display)                                  │
│ ⚠️  RoleForm.jsx (Partial - needs refinement)              │
│ ❌ Missing: Toast notifications, bulk operations           │
└────────────────────────┬────────────────────────────────────┘
                         │
                    API Calls
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    API Layer (Laravel)                      │
├─────────────────────────────────────────────────────────────┤
│ ✅ RoleAdminController (routes defined)                    │
│ ⚠️  RBACController (Legacy - should remove)                │
│ ❌ Missing: getPermissions, getRoleUsers endpoints        │
│ ❌ Missing: Bulk operation endpoints                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Database Layer (Eloquent)                      │
├─────────────────────────────────────────────────────────────┤
│ ✅ Role Model (with relationships)                         │
│ ✅ Permission Model (with relationships)                   │
│ ⚠️  User Model (missing RBAC methods)                      │
│ ❌ PermissionAuditLog Model (not created)                 │
│ ❌ No caching mechanism                                     │
└─────────────────────────────────────────────────────────────┘
```

### Improved Architecture (100% Complete)

```
┌──────────────────────────────────────────────────────────────┐
│                   Frontend (React)                           │
├──────────────────────────────────────────────────────────────┤
│ ✅ RolesPermissions.jsx (Enhanced with state management)    │
│ ✅ RoleTable.jsx (With checkboxes, bulk delete)            │
│ ✅ RoleForm.jsx (Complete validation)                       │
│ ✅ Toast notifications (Success/Error)                      │
│ ✅ Bulk operations support                                  │
└─────────────────────┬──────────────────────────────────────┘
                      │
                 API Calls
                      │
┌─────────────────────▼──────────────────────────────────────┐
│              Middleware Layer                               │
├──────────────────────────────────────────────────────────────┤
│ ✅ CheckPermission (Route middleware)                       │
│ ✅ CheckRole (Route middleware)                             │
│ ✅ CheckAdminRole (Admin access middleware)                │
│ ✅ Properly registered in Kernel.php                       │
└─────────────────────┬──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│            Service/Controller Layer                         │
├──────────────────────────────────────────────────────────────┤
│ ✅ RoleAdminController (All endpoints)                      │
│ ✅ RolePermissionCache Service (Performance)               │
│ ❌ RBACController (REMOVED)                                 │
│ ✅ All CRUD operations complete                            │
│ ✅ Audit logging integrated                                │
│ ✅ Bulk operations supported                               │
└─────────────────────┬──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│           Repository/Model Layer                            │
├──────────────────────────────────────────────────────────────┤
│ ✅ Role Model (Complete)                                    │
│ ✅ Permission Model (Complete)                              │
│ ✅ User Model (Complete RBAC methods)                       │
│ ✅ PermissionAuditLog (For tracking)                        │
│ ✅ RoleTemplate (Optional templates)                        │
└─────────────────────┬──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│         Cache Layer (Redis/File)                            │
├──────────────────────────────────────────────────────────────┤
│ ✅ Permission cache (1 hour TTL)                            │
│ ✅ Role permission cache                                    │
│ ✅ User permission cache                                    │
│ ✅ Cache invalidation on changes                            │
└─────────────────────┬──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│          Database Layer (MySQL/PostgreSQL)                  │
├──────────────────────────────────────────────────────────────┤
│ ✅ roles table                                               │
│ ✅ permissions table                                         │
│ ✅ role_permission pivot table                              │
│ ✅ user_role pivot table                                    │
│ ✅ permission_audit_logs table (NEW)                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Creating a Role (Before → After)

#### Before (Incomplete)
```
User clicks "Create Role"
         ↓
Frontend sends data to /api/v1/admin/roles
         ↓
❌ No validation of permissions
❌ No audit log created
❌ No success notification to user
         ↓
Role created but silent
```

#### After (Complete)
```
User clicks "Create Role"
         ↓
Frontend validates input locally
         ↓
POST /api/v1/admin/roles + Bearer token
         ↓
CheckAdminRole Middleware (verified)
         ↓
RoleAdminController::store()
  ├─ Validate all inputs
  ├─ Check permission_ids exist
  ├─ Create role
  ├─ Attach permissions
  ├─ Log action to audit table ✅
  └─ Clear cache ✅
         ↓
Return JSON response
         ↓
Frontend shows Toast success message ✅
         ↓
Automatic refresh of role list ✅
```

### User Permission Check (Before → After)

#### Before (Unreliable)
```
Route protected by: ->middleware('permission:bookings.create')
         ↓
Request reaches CheckPermission middleware
         ↓
$user->hasPermission('bookings.create')
  └─ ❌ Method might not exist on User model
  └─ ❌ Only checks roles, not direct permissions
  └─ ❌ No caching - hits database every time
         ↓
Result: Unreliable, slow
```

#### After (Complete & Fast)
```
Route protected by: ->middleware('permission:bookings.create')
         ↓
Request reaches CheckPermission middleware
         ↓
$user->hasPermission('bookings.create')
  ├─ Check cache first (Redis) ✅ 
  ├─ If not cached:
  │  ├─ Check direct permissions
  │  └─ Check role permissions
  └─ Store in cache for 1 hour ✅
         ↓
Result: Fast (cache hit) & Reliable
```

---

## Permission Inheritance Model

### Visual Hierarchy

```
┌─────────────────────────────────────┐
│          SUPER ADMIN ROLE           │
├─────────────────────────────────────┤
│ → All permissions (100%)             │
│   ├─ users.*                         │
│   ├─ parking_lots.*                  │
│   ├─ bookings.*                      │
│   ├─ billing.*                       │
│   ├─ reports.*                       │
│   └─ roles.*                         │
└──────────────┬──────────────────────┘
               │
               │ User: John (Super Admin)
               │
    ┌──────────▼──────────┐
    │  John's Permissions  │
    ├──────────────────────┤
    │ ✅ Everything        │
    └──────────────────────┘
```

```
┌─────────────────────────────────────┐
│        MANAGER ROLE                 │
├─────────────────────────────────────┤
│ → Selected permissions (40%)          │
│   ├─ parking_lots.view               │
│   ├─ parking_lots.edit               │
│   ├─ parking_zones.manage_pricing    │
│   ├─ bookings.*                      │
│   └─ reports.view                    │
└──────────────┬──────────────────────┘
               │
               │ User: Alice (Manager)
               │
    ┌──────────▼──────────────────┐
    │  Alice's Permissions         │
    ├──────────────────────────────┤
    │ ✅ See & manage parking lots │
    │ ✅ See & manage bookings     │
    │ ✅ View reports             │
    │ ❌ Cannot manage users       │
    │ ❌ Cannot manage roles       │
    └──────────────────────────────┘
```

---

## Feature Comparison Matrix

| Feature | Current | Needed | Priority |
|---------|---------|--------|----------|
| Create Roles | ✅ | ✅ | ✅ Done |
| Edit Roles | ✅ | ✅ | ✅ Done |
| Delete Roles | ✅ | ✅ | ✅ Done |
| Assign Permissions | ✅ | ✅ | ✅ Done |
| Assign Users to Roles | ⚠️ Partial | ✅ | 🔴 Critical |
| Permission Checking | ❌ | ✅ | 🔴 Critical |
| Role Inheritance | ✅ | ✅ | ✅ Done |
| **Audit Logging** | ❌ | ✅ | 🟠 High |
| **Permission Caching** | ❌ | ✅ | 🟠 High |
| **Bulk Operations** | ❌ | ✅ | 🟡 Medium |
| **Role Templates** | ❌ | ✅ | 🟡 Medium |
| **Frontend UI** | ⚠️ Basic | ✅ Enhanced | 🟡 Medium |
| **API Documentation** | ✅ | ✅ | 🟡 Medium |
| **Unit Tests** | ❌ | ✅ | 🟠 High |
| **Error Handling** | ⚠️ Basic | ✅ Complete | 🟡 Medium |

---

## Permission Organization by Module

```
PERMISSIONS
├── Users Module
│   ├── users.view
│   ├── users.create
│   ├── users.edit
│   └── users.delete
│
├── Parking Lots Module
│   ├── parking_lots.view
│   ├── parking_lots.create
│   ├── parking_lots.edit
│   ├── parking_lots.delete
│   ├── parking_lots.manage_slots
│   └── parking_lots.manage_availability
│
├── Parking Zones Module
│   ├── parking_zones.view
│   ├── parking_zones.create
│   ├── parking_zones.edit
│   ├── parking_zones.delete
│   └── parking_zones.manage_pricing
│
├── Bookings Module
│   ├── bookings.view
│   ├── bookings.create
│   ├── bookings.edit
│   └── bookings.delete
│
├── Billing Module
│   ├── billing.view
│   ├── billing.view_transactions
│   └── billing.process_refunds
│
├── Reports & Analytics Module
│   ├── reports.view
│   └── reports.export
│
└── Roles & Permissions Module
    ├── roles.view
    ├── roles.create
    ├── roles.edit
    ├── roles.delete
    └── roles.manage
```

---

## Audit Log Entry Example

When a role is created, an entry is logged:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "action": "role_created",
  "subject_type": "Role",
  "subject_id": "role-id-here",
  "changes": {
    "name": "Parking Attendant",
    "description": "Staff managing parking operations",
    "permissions_count": 8
  },
  "ip_address": "192.168.1.100",
  "created_at": "2025-05-18T10:30:45Z",
  "updated_at": "2025-05-18T10:30:45Z"
}
```

---

## Performance Impact

### With Caching (Recommended)
```
Permission Check: 5ms (Redis cache hit)
First Time: 50ms (Database lookup)
Average: ~10ms per request
```

### Without Caching (Current)
```
Permission Check: 50-100ms (Database hit every time)
With high traffic: Database becomes bottleneck
```

### Expected Improvement
- **50-90% faster** permission checks
- **Reduced database load** by 60%
- **Better user experience** with responsive admin panel

---

## Security Layers

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
┌────────▼────────────────┐
│ Authentication (Sanctum)│ ← Must have valid token
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│ Role Middleware         │ ← Check if user has required role
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│ Permission Middleware   │ ← Check if user has required permission
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│ Policy/Authorization    │ ← Business logic validation
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│ Data Access             │ ← Only access authorized data
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│ Audit Logging          │ ← Log all changes
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│ Response                │ ← Send secured response
└─────────────────────────┘
```

---

## Migration Path

### Week 1: Foundation
- ✅ Add User model methods
- ✅ Register middleware
- ✅ Complete missing endpoints

### Week 2: Reliability
- ✅ Add audit logging
- ✅ Implement caching
- ✅ Write unit tests

### Week 3: Enhancement
- ✅ Add bulk operations
- ✅ Enhance frontend UI
- ✅ Add role templates

### Week 4: Production
- ✅ Performance testing
- ✅ Security audit
- ✅ Documentation finalization
- ✅ Deploy to production

