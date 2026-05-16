<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ParkingLot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ParkingLot
 */
class ParkingLotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $hourlyRate = $this->hourly_rate ?? $this->hourly_rate_inr;
        $dailyMax = $this->daily_max ?? $this->daily_max_inr;
        $currency = $this->currency ?? (($this->hourly_rate_inr !== null || $this->daily_max_inr !== null) ? 'INR' : config('parkindia.currency', 'EUR'));

        $occupancyRate = $this->total_slots > 0 ? ($this->total_slots - $this->available_slots) / $this->total_slots : 0;
        $demandLevel = 'Low';
        if ($occupancyRate > 0.8) $demandLevel = 'High';
        elseif ($occupancyRate > 0.4) $demandLevel = 'Medium';

        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'pincode' => $this->pincode,
            'total_slots' => (int) $this->total_slots,
            'available_slots' => (int) $this->available_slots,
            'demand_level' => $demandLevel,
            'distance' => $this->distance ?? null, // Calculated in controller if lat/lng provided
            'layout' => $this->layout,
            'status' => $this->status,
            'hourly_rate' => $hourlyRate !== null ? (float) $hourlyRate : null,
            'daily_max' => $dailyMax !== null ? (float) $dailyMax : null,
            'monthly_pass' => $this->monthly_pass !== null ? (float) $this->monthly_pass : null,
            'currency' => $currency,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'dynamic_pricing_active' => $this->dynamic_pricing_active ?? false,
            'surge_multiplier' => (float) ($this->surge_multiplier ?? 1.0),
            'pricing_tier' => $this->pricing_tier ?? 'normal',
            'original_hourly_rate' => $this->original_hourly_rate !== null ? (float) $this->original_hourly_rate : (float) $hourlyRate,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'slots' => ParkingSlotResource::collection($this->whenLoaded('slots')),
            'zones' => ZoneResource::collection($this->whenLoaded('zones')),
        ];
    }
}
