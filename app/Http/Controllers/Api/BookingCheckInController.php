<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExtendBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\AuditLog;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Check-in / extension actions for a booking.
 *
 * Split out of BookingController (T-1743) so the core booking CRUD
 * stays focused. Method bodies are intentionally moved verbatim —
 * any behavioural refactor happens in a follow-up pass.
 */
class BookingCheckInController extends Controller
{
    public function status(Request $request, string $id)
    {
        $booking = Booking::findOrFail($id);
        $this->authorize('view', $booking);

        return response()->json([
            'success' => true,
            'data' => [
                'checked_in' => $booking->checked_in_at !== null,
                'checked_in_at' => $booking->checked_in_at,
                'checked_out_at' => $booking->status === Booking::STATUS_COMPLETED ? $booking->updated_at : null,
            ]
        ]);
    }

    public function checkin(Request $request, string $id)
    {
        $booking = Booking::findOrFail($id);
        return $this->performCheckIn($request, $booking);
    }

    public function checkinDirect(Request $request)
    {
        $user = $request->user();
        
        // Find bookings that are confirmed or active and not expired yet
        $booking = Booking::where('user_id', $user->id)
            ->whereIn('status', [Booking::STATUS_CONFIRMED, Booking::STATUS_ACTIVE])
            ->where('end_time', '>', now())
            ->orderBy('start_time', 'asc')
            ->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'No active booking found.']
            ], 404);
        }

        return $this->performCheckIn($request, $booking);
    }

    protected function performCheckIn(Request $request, Booking $booking)
    {
        $this->authorize('update', $booking);

        // 1. Validate Status
        if ($booking->status === Booking::STATUS_CANCELLED || $booking->status === Booking::STATUS_COMPLETED) {
            return response()->json([
                'success' => false, 
                'error' => ['message' => 'This booking is no longer active.']
            ], 400);
        }

        if ($booking->checked_in_at) {
            return response()->json([
                'success' => false, 
                'error' => ['message' => 'Already checked-in.']
            ], 400);
        }

        // 2. Validate Time Window (Allow 15 mins early)
        $now = now();
        $start = \Carbon\Carbon::parse($booking->start_time)->subMinutes(15);
        $end = \Carbon\Carbon::parse($booking->end_time);

        if ($now->lt($start)) {
            return response()->json([
                'success' => false, 
                'error' => ['message' => 'Too early to check-in. Please wait until closer to your start time.']
            ], 400);
        }

        if ($now->gt($end)) {
            return response()->json([
                'success' => false, 
                'error' => ['message' => 'Booking expired.']
            ], 400);
        }

        $booking->update([
            'checked_in_at' => $now,
            'status' => Booking::STATUS_ACTIVE
        ]);

        AuditLog::log([
            'user_id' => $request->user()->id,
            'username' => $request->user()->username,
            'action' => 'booking_checkin',
            'details' => ['booking_id' => $booking->id],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Checked in successfully',
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
}
