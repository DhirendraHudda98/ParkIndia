<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SlotAvailabilityChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $lotId,
        public readonly string $slotId,
        public readonly string $status
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('lot.' . $this->lotId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'slot.availability.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'lot_id' => $this->lotId,
            'slot_id' => $this->slotId,
            'status' => $this->status,
        ];
    }
}
