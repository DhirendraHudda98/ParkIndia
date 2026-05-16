<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ParkingAvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ParkingAvailabilityController
 *
 * Public API (no auth required, throttled) for real-time parking availability.
 * Data is served from the ParkingAvailabilityService cache (10-min TTL).
 *
 * Routes:
 *   GET /api/availability             → all open lots
 *   GET /api/availability/{lotId}     → single lot
 *   GET /api/availability/city/{city} → filter by city
 */
class ParkingAvailabilityController extends Controller
{
    public function __construct(private readonly ParkingAvailabilityService $service)
    {
    }

    /**
     * GET /api/availability
     * Returns availability for all open lots.
     */
    public function index(Request $request): JsonResponse
    {
        $data = $this->service->getAllAvailability();

        // Optional city filter: ?city=Mumbai
        if ($request->filled('city')) {
            $city = strtolower($request->query('city'));
            $data = array_values(array_filter(
                $data,
                fn ($lot) => strtolower($lot['city'] ?? '') === $city
            ));
        }

        return response()->json([
            'success'      => true,
            'data'         => $data,
            'count'        => count($data),
            'generated_at' => now()->toIso8601String(),
            'cache_ttl_minutes' => (int) config('parkindia.availability_cache_minutes', 10),
        ]);
    }

    /**
     * GET /api/availability/{lotId}
     * Returns availability for a single parking lot.
     */
    public function show(string $lotId): JsonResponse
    {
        $data = $this->service->getAvailability($lotId);

        if (empty($data)) {
            return response()->json([
                'success' => false,
                'message' => 'Parking lot not found.',
            ], 404);
        }

        return response()->json([
            'success'      => true,
            'data'         => $data,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/availability/city/{city}
     * Returns all lots in a given city (case-insensitive).
     */
    public function byCity(string $city): JsonResponse
    {
        $all  = $this->service->getAllAvailability();
        $data = array_values(array_filter(
            $all,
            fn ($lot) => strtolower($lot['city'] ?? '') === strtolower($city)
        ));

        return response()->json([
            'success'      => true,
            'city'         => ucfirst($city),
            'data'         => $data,
            'count'        => count($data),
            'generated_at' => now()->toIso8601String(),
        ]);
    }
}
