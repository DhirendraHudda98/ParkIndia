<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ParkingLot;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Handles incoming webhooks from external IoT devices (ANPR Cameras, Boom Barriers).
 */
class HardwareWebhookController extends Controller
{
    /**
     * Endpoint for ANPR (Automatic Number Plate Recognition) cameras.
     * When a car drives up to the barrier, the camera sends a POST request with the license plate.
     */
    public function handleAnprEvent(Request $request)
    {
        $request->validate([
            'license_plate' => 'required|string',
            'lot_id' => 'required|uuid',
            'timestamp' => 'nullable|date',
        ]);

        $plate = strtoupper(trim($request->license_plate));
        $lotId = $request->lot_id;
        $now = $request->timestamp ? Carbon::parse($request->timestamp) : now();

        Log::info('ANPR Event Received', [
            'license_plate' => $plate,
            'lot_id' => $lotId,
        ]);

        // Find an active or soon-to-be-active booking for this license plate in this lot.
        // We allow entry up to 15 minutes before the booking start time.
        $booking = Booking::where('lot_id', $lotId)
            ->where('vehicle_plate', $plate)
            ->whereIn('status', [Booking::STATUS_CONFIRMED, Booking::STATUS_ACTIVE])
            ->where('start_time', '<=', $now->copy()->addMinutes(15))
            ->where('end_time', '>=', $now)
            ->orderBy('start_time', 'asc')
            ->first();

        if ($booking) {
            // Valid booking found. 
            // If the status was confirmed, we could optionally mark it as 'active' (checked-in) right here.
            if ($booking->status === Booking::STATUS_CONFIRMED) {
                $booking->update(['status' => Booking::STATUS_ACTIVE]);
            }

            return response()->json([
                'success' => true,
                'action' => 'open_barrier',
                'message' => 'Valid booking found. Barrier opening.',
                'booking_id' => $booking->id,
            ]);
        }

        // No valid booking found
        return response()->json([
            'success' => false,
            'action' => 'keep_closed',
            'message' => 'No active booking found for this license plate.',
        ], 404);
    }
}
