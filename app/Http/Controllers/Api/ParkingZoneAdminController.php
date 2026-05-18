<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateParkingZoneRequest;
use App\Models\ParkingZone;
use App\Models\ParkingLot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParkingZoneAdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
    }

    /**
     * GET /api/v1/admin/parking-zones
     * List all parking zones with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $status = $request->input('status');

        $query = ParkingZone::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
        }

        if ($status) {
            $query->where('status', $status);
        }

        $zones = $query->withCount('parkingLots')
                       ->orderBy('created_at', 'desc')
                       ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $zones,
        ]);
    }

    /**
     * GET /api/v1/admin/parking-zones/{id}
     * Get a single parking zone with its lots.
     */
    public function show(string $id): JsonResponse
    {
        $zone = ParkingZone::with('parkingLots')
                            ->withCount('parkingLots')
                            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'zone' => $zone,
                'stats' => [
                    'total_lots' => $zone->getTotalLotsCount(),
                    'total_slots' => $zone->getTotalCapacity(),
                    'available_slots' => $zone->getTotalOccupancy(),
                    'occupancy_percentage' => $zone->getOccupancyPercentage(),
                ],
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/parking-zones
     * Create a new parking zone.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:parking_zones,name'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'pricing_multiplier' => ['required', 'numeric', 'min:0.1', 'max:10'],
            'occupancy_limit' => ['nullable', 'integer', 'min:1'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'parking_lot_ids' => ['nullable', 'array'],
            'parking_lot_ids.*' => ['uuid', 'exists:parking_lots,id'],
        ]);

        $zone = ParkingZone::create($validated);

        // Attach parking lots if provided
        if (!empty($validated['parking_lot_ids'])) {
            $zone->parkingLots()->attach($validated['parking_lot_ids']);
        }

        $zone->load('parkingLots');

        return response()->json([
            'success' => true,
            'message' => 'Parking zone created successfully.',
            'data' => $zone,
        ], 201);
    }

    /**
     * PATCH /api/v1/admin/parking-zones/{id}
     * Update a parking zone.
     */
    public function update(UpdateParkingZoneRequest $request, string $id): JsonResponse
    {
        $zone = ParkingZone::findOrFail($id);

        $validated = $request->validated();

        // Remove parking_lot_ids from the update to handle separately
        $parkingLotIds = $validated['parking_lot_ids'] ?? null;
        unset($validated['parking_lot_ids']);

        $zone->update($validated);

        // Sync parking lots if provided
        if ($parkingLotIds !== null) {
            $zone->parkingLots()->sync($parkingLotIds);
        }

        $zone->load('parkingLots');

        return response()->json([
            'success' => true,
            'message' => 'Parking zone updated successfully.',
            'data' => $zone,
        ]);
    }

    /**
     * DELETE /api/v1/admin/parking-zones/{id}
     * Delete a parking zone.
     */
    public function destroy(string $id): JsonResponse
    {
        $zone = ParkingZone::findOrFail($id);
        $zone->delete();

        return response()->json([
            'success' => true,
            'message' => 'Parking zone deleted successfully.',
        ]);
    }

    /**
     * POST /api/v1/admin/parking-zones/{id}/attach-lots
     * Attach parking lots to a zone.
     */
    public function attachLots(Request $request, string $id): JsonResponse
    {
        $zone = ParkingZone::findOrFail($id);

        $validated = $request->validate([
            'parking_lot_ids' => ['required', 'array'],
            'parking_lot_ids.*' => ['uuid', 'exists:parking_lots,id'],
        ]);

        $zone->parkingLots()->attach($validated['parking_lot_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Lots attached successfully.',
            'data' => $zone->load('parkingLots'),
        ]);
    }

    /**
     * POST /api/v1/admin/parking-zones/{id}/detach-lots
     * Detach parking lots from a zone.
     */
    public function detachLots(Request $request, string $id): JsonResponse
    {
        $zone = ParkingZone::findOrFail($id);

        $validated = $request->validate([
            'parking_lot_ids' => ['required', 'array'],
            'parking_lot_ids.*' => ['uuid', 'exists:parking_lots,id'],
        ]);

        $zone->parkingLots()->detach($validated['parking_lot_ids']);

        return response()->json([
            'success' => true,
            'message' => 'Lots detached successfully.',
            'data' => $zone->load('parkingLots'),
        ]);
    }

    /**
     * GET /api/v1/admin/parking-zones/{id}/available-lots
     * Get available parking lots that can be added to a zone.
     */
    public function getAvailableLots(string $id): JsonResponse
    {
        $zone = ParkingZone::findOrFail($id);
        $assignedLotIds = $zone->parkingLots()->pluck('parking_lots.id');

        $availableLots = ParkingLot::whereNotIn('id', $assignedLotIds)
                                    ->where('status', 'active')
                                    ->get(['id', 'name', 'address', 'city']);

        return response()->json([
            'success' => true,
            'data' => $availableLots,
        ]);
    }

    /**
     * GET /api/v1/admin/parking-zones/{id}/stats
     * Get detailed statistics for a parking zone.
     */
    public function getStats(string $id): JsonResponse
    {
        $zone = ParkingZone::with('parkingLots')->findOrFail($id);

        $totalLots = $zone->getTotalLotsCount();
        $totalSlots = $zone->getTotalCapacity();
        $availableSlots = $zone->getTotalOccupancy();
        $occupiedSlots = $totalSlots - $availableSlots;
        $occupancyPercentage = $zone->getOccupancyPercentage();

        return response()->json([
            'success' => true,
            'data' => [
                'zone_id' => $zone->id,
                'zone_name' => $zone->name,
                'total_lots' => $totalLots,
                'total_slots' => $totalSlots,
                'available_slots' => $availableSlots,
                'occupied_slots' => $occupiedSlots,
                'occupancy_percentage' => $occupancyPercentage,
                'pricing_multiplier' => (float) $zone->pricing_multiplier,
                'status' => $zone->status,
            ],
        ]);
    }
}
