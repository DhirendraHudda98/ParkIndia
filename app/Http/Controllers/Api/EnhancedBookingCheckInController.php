<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExtendBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Lot;
use App\Events\BookingCheckedIn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * Enhanced Check-in / extension actions for a booking with real-time updates.
 */
class EnhancedBookingCheckInController extends Controller
{
    public function status(Request $request, string $id)
    {
        $booking = Booking::find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'error' => 'Booking not found'
            ], 404);
        }

        // Check if the booking is active or completed
        $this->authorize('view', $booking);

        $now = Carbon::now();
        $isActive = $booking->status === Booking::STATUS_ACTIVE || $booking->status === Booking::STATUS_CONFIRMED;
        $isCompleted = $booking->status === Booking::STATUS_COMPLETED;
        $bookingActive = $now->between($booking->start_time, $booking->end_time);
        
        return response()->json([
            'success' => true,
            'data' => [
                'checked_in' => $booking->checked_in_at !== null,
                'checked_in_at' => $booking->checked_in_at,
                'checked_out_at' => $booking->status === Booking::STATUS_COMPLETED ? $booking->updated_at : null,
                'is_active' => $bookingActive && $isActive,
                'is_completed' => $isCompleted,
            ],
            'meta' => [
                'booking_id' => $id,
                'current_time' => $now,
            ]
        ]);
    }

    public function checkin(Request $request, string $id)
    {
        $booking = Booking::findOrFail($id);
        $this->authorize('update', $booking);
        
        $booking->update([
            'checked_in_at' => now(),
            'status' => Booking::STATUS_ACTIVE
        ]);
        
        // Dispatch the booking checked in event
        event(new BookingCheckedIn($booking));
        
        AuditLog::log([
            'user_id' => $request->user()->id,
            'username' => $request->user()->username,
            'action' => 'booking_checkin',
            'details' => ['booking_id' => $id],
        ]);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking->fresh())
        ]);
    }

    public function checkout(Request $request, string $id)
    {
        $booking = Booking::findOrFail($id);
        $this->authorize('update', $booking);
        $booking->update(['status' => Booking::STATUS_COMPLETED]);
        
        AuditLog::log([
            'user_id' => $request->user()->id,
            'username' => $request->user()->username,
            'action' => 'booking_checkout',
            'details' => ['booking_id' => $id],
        ]);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking->fresh())
        ]);
    }

    public function extend(ExtendBookingRequest $request, string $id): JsonResponse
    {
        $validated = $request->validated();

        $booking = Booking::where('user_id', $request->user()->id)
            ->whereIn('status', [Booking::STATUS_CONFIRMED, Booking::STATUS_ACTIVE])
            ->findOrFail($id);

        // Check no conflict with new end time
        $conflict = Booking::where('slot_id', $booking->slot_id)
            ->where('id', '!=', $booking->id)
            ->whereIn('status', [Booking::STATUS_CONFIRMED, Booking::STATUS_ACTIVE])
            ->where('start_time', '<', $validated['new_end_time'])
            ->where('end_time', '>', $booking->end_time)
            ->lockForUpdate()
            ->exists();

        if ($conflict) {
            return response()->json(['error' => 'SLOT_CONFLICT'], 409);
        }

        $oldEndTime = $booking->end_time;
        $booking->update(['end_time' => $validated['new_end_time']]);

        AuditLog::log([
            'user_id' => $request->user()->id,
            'username' => $request->user()->username,
            'action' => 'booking_extended',
            'details' => [
                'booking_id' => $id,
                'old_end_time' => $oldEndTime,
                'new_end_time' => $validated['new_end_time'],
            ],
        ]);

        return response()->json(new BookingResource($booking->fresh()));
    }

    public function getActiveBooking(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $booking = Booking::where('user_id', $user->id)
            ->whereIn('status', ['confirmed', 'active'])
            ->where('end_time', '>', now())
            ->orderBy('start_time', 'asc')
            ->first();
            
        if (!$booking) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'No active booking',
            ]);
        }
        
        $now = Carbon::now();
        $start = Carbon::parse($booking->start_time);
        $end = Carbon::parse($booking->end_time);
        $totalSeconds = (int) $start->diffInSeconds($end, true);
        $remainingSeconds = (int) max(0, $now->diffInSeconds($end, false));
        $progress = $totalSeconds > 0
            ? round((($totalSeconds - $remainingSeconds) / $totalSeconds) * 100, 1)
            : 100;
            
        $lot = Lot::find($booking->lot_id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $booking->id,
                'lot_name' => $lot?->name ?? 'Unknown',
                'slot_label' => $booking->slot_label ?? 'N/A',
                'start_time' => $start->toIso8601String(),
                'end_time' => $end->toIso8601String(),
                'remaining_seconds' => $remainingSeconds,
                'total_seconds' => $totalSeconds,
                'progress_percent' => $progress,
                'status' => $booking->status,
                'checked_in' => $booking->status === 'active',
            ],
        ]);
    }
    
    public function show(Request $request, string $id)
    {
        $booking = Booking::findOrFail($id);
        $this->authorize('view', $booking);
        
        $now = Carbon::now();
        $start = Carbon::parse($booking->start_time);
        $end = Carbon::parse($booking->end_time);
        $totalSeconds = (int) $start->diffInSeconds($end, true);
        $remainingSeconds = (int) max(0, $now->diffInSeconds($end, false));
        $progress = $totalSeconds > 0
            ? round((($totalSeconds - $remainingSeconds) / $totalSeconds) * 100, 1)
            : 100;
        $lot = Lot::find($booking->lot_id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $booking->id,
                'lot_name' => $lot?->name ?? 'Unknown',
                'slot_label' => $booking->slot_label ?? 'N/A',
                'start_time' => $start->toIso8601String(),
                'end_time' => $end->toIso8601String(),
                'remaining_seconds' => $remainingSeconds,
                'total_seconds' => $totalSeconds,
                'progress_percent' => $progress,
                'status' => $booking->status,
                'checked_in' => $booking->status === 'active',
            ],
        ]);
    }
}
