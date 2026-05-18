<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSlotRequest;
use App\Http\Resources\ParkingSlotResource;
use App\Models\ParkingSlot;
use App\Models\ParkingLot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SlotController extends Controller
{
    private function requireAdmin(Request $request): void
    {
        if (! $request->user() || ! $request->user()->isAdmin()) {
            abort(403, 'Admin access required');
        }
    }

    public function store(StoreSlotRequest $request, string $lotId)
    {
        $this->requireAdmin($request);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $lotId) {
            $slot = ParkingSlot::create(array_merge(
                $request->only(['slot_number', 'status', 'slot_type', 'features', 'reserved_for_department', 'zone_id', 'is_accessible']),
                ['lot_id' => $lotId]
            ));

            $lot = ParkingLot::findOrFail($lotId);
            $lot->total_slots = $lot->slots()->count();
            $lot->save();

            return ParkingSlotResource::make($slot)->response()->setStatusCode(201);
        });
    }

    public function update(Request $request, string $lotId, string $slotId)
    {
        $this->requireAdmin($request);

        $request->validate([
            'slot_number' => 'sometimes|required|string|max:20|unique:parking_slots,slot_number,' . $slotId . ',id,lot_id,' . $lotId,
            'slot_type' => 'nullable|string|in:standard,ev,ev_charger,premium,accessible',
            'status' => 'nullable|string|in:available,occupied,maintenance',
            'is_accessible' => 'nullable|boolean',
            'reserved_for_department' => 'nullable|string|max:100',
            'zone_id' => 'nullable|uuid|exists:zones,id',
            'features' => 'nullable|array',
        ]);

        $slot = ParkingSlot::where('lot_id', $lotId)->findOrFail($slotId);
        $slot->update($request->only(['slot_number', 'status', 'slot_type', 'features', 'reserved_for_department', 'zone_id', 'is_accessible']));

        return ParkingSlotResource::make($slot);
    }

    public function destroy(Request $request, string $lotId, string $slotId): JsonResponse
    {
        $this->requireAdmin($request);

        \Illuminate\Support\Facades\DB::transaction(function () use ($lotId, $slotId) {
            ParkingSlot::where('lot_id', $lotId)->findOrFail($slotId)->delete();

            $lot = ParkingLot::findOrFail($lotId);
            $lot->total_slots = $lot->slots()->count();
            $lot->save();
        });

        return response()->json(['message' => 'Deleted']);
    }
}
