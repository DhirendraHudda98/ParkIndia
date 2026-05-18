<?php

namespace App\Services;

use App\Models\ParkingLot;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * ParkingAvailabilityService
 *
 * Manages real-time (or near-real-time) parking availability data.
 *
 * Architecture notes:
 *  - All availability data is cached for PARKING_AVAILABILITY_CACHE_MINUTES (default 10 min).
 *  - The refreshFromLive() method is a stub designed to be replaced with any
 *    Indian parking data API (MCGM Open Data, ParkSmart, etc.).
 *  - The CheckParkingAvailability Artisan command calls refreshAll() on schedule.
 *  - The ParkingAvailabilityController reads from cache for fast API responses.
 */
class ParkingAvailabilityService
{
    private int $cacheTtlMinutes;

    public function __construct()
    {
        $this->cacheTtlMinutes = (int) config('parkindia.availability_cache_minutes', 10);
    }

    /**
     * Get availability for a single lot from cache (or DB fallback).
     */
    public function getAvailability(string $lotId): array
    {
        $cacheKey = $this->cacheKey($lotId);

        return Cache::remember($cacheKey, now()->addMinutes($this->cacheTtlMinutes), function () use ($lotId) {
            return $this->fetchFromDatabase($lotId);
        });
    }

    /**
     * Get availability for all active lots.
     */
    public function getAllAvailability(): array
    {
        $cacheKey = 'parkindia:availability:all';

        return Cache::remember($cacheKey, now()->addMinutes($this->cacheTtlMinutes), function () {
            return ParkingLot::where('status', 'open')
                ->select([
                    'id', 'name', 'address', 'city', 'state', 'pincode',
                    'latitude', 'longitude', 'total_slots', 'available_spots', 'available_slots',
                    'hourly_rate_inr', 'daily_max_inr', 'status',
                    'availability_last_updated',
                ])
                ->get()
                ->map(fn ($lot) => $this->formatLotAvailability($lot))
                ->toArray();
        });
    }

    /**
     * Refresh a single lot's availability from live source (or DB computation)
     * and update the database + cache.
     *
     * TODO: Replace the body of this method with a real Indian parking API call,
     * e.g., MCGM Open Data or ParkSmart when available.
     */
    public function refreshFromLive(ParkingLot $lot): array
    {
        try {
            // Compute available spots from the DB (booked slots subtraction)
            $bookedNow = $lot->slots()
                ->whereHas('bookings', function ($q) {
                    $q->where('status', 'confirmed')
                      ->where('start_time', '<=', now())
                      ->where('end_time', '>=', now());
                })
                ->count();

            $availableSpots = max(0, $lot->total_slots - $bookedNow);

            // Persist to DB
            $lot->update([
                'available_spots'            => $availableSpots,
                'availability_last_updated'  => now(),
            ]);

            $availability = $this->formatLotAvailability($lot->fresh());

            // Refresh individual cache
            Cache::put($this->cacheKey($lot->id), $availability, now()->addMinutes($this->cacheTtlMinutes));

            // Bust the "all" cache so next request gets fresh data
            Cache::forget('parkindia:availability:all');

            return $availability;
        } catch (\Throwable $e) {
            Log::error("ParkingAvailabilityService: failed to refresh lot {$lot->id}", [
                'error' => $e->getMessage(),
            ]);

            return $this->fetchFromDatabase($lot->id);
        }
    }

    /**
     * Refresh all lots — called by CheckParkingAvailability command.
     */
    public function refreshAll(): int
    {
        $lots = ParkingLot::where('status', 'open')->get();
        $refreshed = 0;

        foreach ($lots as $lot) {
            $this->refreshFromLive($lot);
            $refreshed++;
        }

        return $refreshed;
    }

    /**
     * Compute the colour category for a parking lot based on availability %.
     */
    public static function computeColor(int $available, int $total): string
    {
        if ($total === 0) return 'gray';
        $pct = ($available / $total) * 100;
        if ($pct > 50) return 'green';
        if ($pct >= 10) return 'yellow';
        return 'red';
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function cacheKey(string $lotId): string
    {
        return "parkindia:availability:lot:{$lotId}";
    }

    private function fetchFromDatabase(string $lotId): array
    {
        $lot = ParkingLot::find($lotId);

        if (! $lot) {
            return [];
        }

        return $this->formatLotAvailability($lot);
    }

    private function formatLotAvailability(ParkingLot $lot): array
    {
        $available = (int) ($lot->available_spots ?? $lot->available_slots ?? 0);
        if ($available === 0 && ($lot->available_slots ?? 0) > 0) {
            $available = (int) $lot->available_slots;
        }
        $total     = (int) ($lot->total_slots ?? 0);

        return [
            'id'                         => $lot->id,
            'name'                       => $lot->name,
            'address'                    => $lot->address,
            'city'                       => $lot->city ?? 'Mumbai',
            'state'                      => $lot->state ?? 'Maharashtra',
            'pincode'                    => $lot->pincode,
            'latitude'                   => (float) ($lot->latitude ?? 0),
            'longitude'                  => (float) ($lot->longitude ?? 0),
            'available_spots'            => $available,
            'total_slots'                => $total,
            'status'                     => $lot->status,
            'color'                      => self::computeColor($available, $total),
            'hourly_rate_inr'            => $lot->hourly_rate_inr ? (float) $lot->hourly_rate_inr : null,
            'daily_max_inr'              => $lot->daily_max_inr ? (float) $lot->daily_max_inr : null,
            'availability_last_updated'  => $lot->availability_last_updated?->toIso8601String(),
        ];
    }
}
