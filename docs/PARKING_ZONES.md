# Parking Zones Admin Module

## Overview

The Parking Zones module is a comprehensive admin feature for managing high-level parking zones (areas/regions) in the ParkHub system. It allows administrators to group multiple parking lots into zones, apply pricing multipliers, and manage occupancy limits.

## Features

### Core Functionality

- **Create, Read, Update, Delete (CRUD) Operations** - Full management of parking zones
- **Pricing Multipliers** - Dynamic pricing for each zone (0.1x to 10x)
- **Parking Lot Assignment** - Many-to-many relationship to assign multiple lots to a zone
- **Occupancy Limits** - Set capacity rules per zone
- **Status Management** - Active/Inactive zones
- **Real-time Statistics** - Zone occupancy, revenue, and capacity tracking

### Admin Dashboard

- **Zones Table** - Structured view with Name, Location, Pricing Multiplier, Total Lots, and Status
- **Search & Filter** - Search by zone name/location, filter by status
- **Add Zone Modal** - Create new zones with form validation
- **Edit Zone Modal** - Update existing zones and parking lot assignments
- **Bulk Operations** - Attach/detach multiple parking lots at once

## Technical Architecture

### Database Schema

#### `parking_zones` Table
```sql
CREATE TABLE parking_zones (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NULLABLE,
    description TEXT NULLABLE,
    pricing_multiplier DECIMAL(5,2) DEFAULT 1.0,
    occupancy_limit INTEGER NULLABLE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    slug VARCHAR(255) UNIQUE,
    tenant_id UUID NULLABLE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### `parking_zone_parking_lot` Pivot Table
```sql
CREATE TABLE parking_zone_parking_lot (
    parking_zone_id UUID,
    parking_lot_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (parking_zone_id, parking_lot_id)
);
```

### Backend (Laravel)

#### Model: `ParkingZone`
Location: `app/Models/ParkingZone.php`

Key Methods:
- `parkingLots()` - BelongsToMany relationship
- `getTotalLotsCount()` - Get number of assigned lots
- `getTotalCapacity()` - Sum of all lot slots
- `getTotalOccupancy()` - Available slots across zone
- `getOccupancyPercentage()` - Calculate occupancy percentage
- `isAtCapacity()` - Check if zone is full

#### Controller: `ParkingZoneAdminController`
Location: `app/Http/Controllers/Api/ParkingZoneAdminController.php`

API Endpoints:
- `GET /api/v1/admin/parking-zones` - List all zones (paginated)
- `POST /api/v1/admin/parking-zones` - Create new zone
- `GET /api/v1/admin/parking-zones/{id}` - Get zone details
- `PATCH /api/v1/admin/parking-zones/{id}` - Update zone
- `DELETE /api/v1/admin/parking-zones/{id}` - Delete zone
- `POST /api/v1/admin/parking-zones/{id}/attach-lots` - Attach lots
- `POST /api/v1/admin/parking-zones/{id}/detach-lots` - Detach lots
- `GET /api/v1/admin/parking-zones/{id}/available-lots` - Get assignable lots
- `GET /api/v1/admin/parking-zones/{id}/stats` - Get zone statistics

#### Form Requests
- `StoreParkingZoneRequest` - Validation for create operations
- `UpdateParkingZoneRequest` - Validation for update operations

### Frontend (React/Astro)

#### Service: `parkingZonesService.js`
Location: `parkhub-web/src/api/parkingZonesService.js`

Provides methods for all API operations with authentication tokens.

#### Components

1. **ParkingZones.jsx** - Main container component
   - Manages state for zones list and UI
   - Handles CRUD operations
   - Implements search and filtering
   - Manages pagination

2. **ParkingZoneTable.jsx** - Table display component
   - Shows zones in structured table format
   - Inline edit and delete buttons
   - Status badges and pricing multiplier display

3. **ParkingZoneForm.jsx** - Form component for create/edit
   - Input validation
   - Parking lot selection with checkboxes
   - Dynamic form state management

4. **ParkingZones.css** - Styling
   - Responsive design
   - Modal styling
   - Table styling
   - Form styling
   - Mobile-friendly layout

## API Request Examples

### Create a Parking Zone
```bash
POST /api/v1/admin/parking-zones
Content-Type: application/json
Authorization: Bearer {token}

{
    "name": "City Center",
    "location": "Downtown",
    "description": "Premium parking in city center",
    "pricing_multiplier": 1.5,
    "occupancy_limit": 500,
    "status": "active",
    "parking_lot_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### Update a Parking Zone
```bash
PATCH /api/v1/admin/parking-zones/{zoneId}
Content-Type: application/json
Authorization: Bearer {token}

{
    "pricing_multiplier": 1.8,
    "status": "active"
}
```

### Attach Lots to Zone
```bash
POST /api/v1/admin/parking-zones/{zoneId}/attach-lots
Content-Type: application/json
Authorization: Bearer {token}

{
    "parking_lot_ids": ["uuid4", "uuid5"]
}
```

### Get Zone Statistics
```bash
GET /api/v1/admin/parking-zones/{zoneId}/stats
Authorization: Bearer {token}
```

Response:
```json
{
    "success": true,
    "data": {
        "zone_id": "uuid",
        "zone_name": "City Center",
        "total_lots": 3,
        "total_slots": 1500,
        "available_slots": 450,
        "occupied_slots": 1050,
        "occupancy_percentage": 70,
        "pricing_multiplier": 1.5,
        "status": "active"
    }
}
```

## Database Migrations

Run migrations to create the database schema:

```bash
php artisan migrate
```

Migration files:
- `2026_05_18_000001_create_parking_zones_table.php`
- `2026_05_18_000002_create_parking_zone_parking_lot_table.php`

## Usage

### For Admins

1. **Navigate to Parking Zones** - Access via admin dashboard
2. **Create a Zone** - Click "Add Zone", fill form, select lots, save
3. **Edit Zone** - Click "Edit" on any zone, modify details, update
4. **Delete Zone** - Click "Delete", confirm deletion
5. **View Stats** - Click on zone to see occupancy and statistics
6. **Assign Lots** - Use checkboxes to assign multiple parking lots

### For Developers

#### Using the Service in Components
```javascript
import { parkingZonesService } from '../api/parkingZonesService';

// Get all zones
const zones = await parkingZonesService.getZones({ per_page: 20 });

// Create zone
const newZone = await parkingZonesService.createZone({
    name: 'Airport Zone',
    pricing_multiplier: 2.0,
    status: 'active'
});

// Update pricing multiplier
await parkingZonesService.updateZone(zoneId, {
    pricing_multiplier: 2.5
});
```

#### Applying Pricing Multiplier in Bookings
The pricing multiplier should be applied when calculating booking rates:

```php
// In booking calculation logic
$zone = $parkingLot->parkingZones()->first();
$basePricing = $lot->hourly_rate;
$adjustedPricing = $basePricing * ($zone->pricing_multiplier ?? 1.0);
```

## Features & Enhancements

### Current Features
- ✅ CRUD operations for parking zones
- ✅ Many-to-many lot assignment
- ✅ Dynamic pricing multipliers
- ✅ Occupancy tracking
- ✅ Search and filtering
- ✅ Responsive UI
- ✅ Pagination

### Optional Future Enhancements
- 🔄 Map view integration (Google Maps/Mapbox)
- 📊 Zone-based analytics (revenue, usage trends)
- 🕐 Peak hour pricing adjustments
- 📈 Revenue reports by zone
- 🔔 Zone occupancy alerts
- 📅 Seasonal pricing rules
- 🎯 Zone-based promotions/discounts

## Permissions & Security

- **Admin Middleware** - All routes require `admin` middleware
- **Tenant Isolation** - Zones are tenant-aware via `BelongsToTenant`
- **Soft Deletes** - Zones can be soft-deleted for audit trails
- **Input Validation** - Form requests validate all inputs

## Performance Considerations

- **Indexes** - Status and tenant_id indexed for fast queries
- **Lazy Loading** - Use `with()` to eager load relationships
- **Pagination** - Default 15 zones per page
- **Caching** - Consider caching zone stats for high-traffic systems

## Testing

### Unit Tests (To Be Implemented)
```php
// Test zone creation
$zone = ParkingZone::factory()->create();
$this->assertNotNull($zone->id);

// Test lot assignment
$zone->parkingLots()->attach($lotIds);
$this->assertEquals(count($lotIds), $zone->getTotalLotsCount());
```

### API Tests (To Be Implemented)
```bash
POST /api/v1/admin/parking-zones
GET /api/v1/admin/parking-zones
PATCH /api/v1/admin/parking-zones/{id}
DELETE /api/v1/admin/parking-zones/{id}
```

## Troubleshooting

### Issue: Zone not appearing in list
- **Solution**: Check if zone status is 'active' and pagination page number

### Issue: Cannot assign lots to zone
- **Solution**: Ensure lots exist and have 'active' status

### Issue: Pricing multiplier not applied
- **Solution**: Verify zone relationship is loaded in booking logic

### Issue: API returns 401 Unauthorized
- **Solution**: Ensure user is authenticated and has admin role

## Support & Documentation

For more information, refer to:
- [ParkHub Documentation](../../docs/API.md)
- [Database Schema](../../docs/CONFIGURATION.md)
- [Admin Panel Guide](../../docs/FEATURES.md)

---

**Version**: 1.0.0  
**Last Updated**: May 18, 2026  
**Status**: Production Ready
