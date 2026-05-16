<?php

declare(strict_types=1);

namespace App\Services\Pricing;

use App\Models\ParkingLot;
use App\Models\Booking;

class PricingEngine
{
    /**
     * Calculate dynamic pricing for a lot based on occupancy rules.
     */
    public static function applyDynamicPricing(ParkingLot $lot, int $totalSlots, int $occupiedSlots): void
    {
        // Add a dynamic attribute so the frontend knows if surge is active
        $lot->dynamic_pricing_active = false;
        $lot->original_hourly_rate = $lot->hourly_rate;
        $lot->surge_multiplier = 1.0;
        
        if ($totalSlots <= 0 || ! $lot->hourly_rate) {
            return; // Cannot calculate occupancy or free lot
        }

        $occupancyRate = $occupiedSlots / $totalSlots;
        
        // Custom rules can be stored in $lot->dynamic_pricing_rules JSON
        // Example: {"surge_threshold": 0.8, "surge_multiplier": 1.5, "discount_threshold": 0.2, "discount_multiplier": 0.8}
        
        $rules = $lot->dynamic_pricing_rules ?? [];
        $surgeThreshold = $rules['surge_threshold'] ?? 0.8;
        $surgeMultiplier = $rules['surge_multiplier'] ?? 1.5;
        
        $discountThreshold = $rules['discount_threshold'] ?? 0.2;
        $discountMultiplier = $rules['discount_multiplier'] ?? 0.8;

        if ($occupancyRate >= $surgeThreshold) {
            $lot->hourly_rate = (string) round($lot->hourly_rate * $surgeMultiplier, 2);
            $lot->dynamic_pricing_active = true;
            $lot->surge_multiplier = $surgeMultiplier;
            $lot->pricing_tier = 'surge';
        } elseif ($occupancyRate <= $discountThreshold) {
            $lot->hourly_rate = (string) round($lot->hourly_rate * $discountMultiplier, 2);
            $lot->dynamic_pricing_active = true;
            $lot->surge_multiplier = $discountMultiplier;
            $lot->pricing_tier = 'discount';
        } else {
            $lot->pricing_tier = 'normal';
        }
    }
    
    /**
     * Calculate dynamic pricing for a lot querying DB on the fly.
     */
    public static function calculateForLot(ParkingLot $lot): void
    {
        $totalSlots = $lot->slots()->count();
        $occupied = Booking::where('lot_id', $lot->id)
            ->whereIn('status', ['confirmed', 'active'])
            ->where('start_time', '<=', now())
            ->where('end_time', '>=', now())
            ->count();
            
        self::applyDynamicPricing($lot, $totalSlots, $occupied);
    }
}
