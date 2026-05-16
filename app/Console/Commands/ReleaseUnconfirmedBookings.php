<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ReleaseUnconfirmedBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:release-unconfirmed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically cancel and release unconfirmed bookings older than 10 minutes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoffTime = now()->subMinutes(10);
        
        // Find bookings that are 'pending' or whatever status implies they haven't paid yet
        // In ParkHub, the statuses are usually 'pending' -> 'confirmed' -> 'active' -> 'completed'.
        $unconfirmedBookings = Booking::where('status', 'pending')
                                      ->where('created_at', '<', $cutoffTime)
                                      ->get();
        
        $count = $unconfirmedBookings->count();
        if ($count === 0) {
            $this->info('No unconfirmed bookings to release.');
            return;
        }

        foreach ($unconfirmedBookings as $booking) {
            $booking->update(['status' => Booking::STATUS_CANCELLED]);
            Log::info("Auto-released unconfirmed booking: {$booking->id}");
        }

        $this->info("Successfully released {$count} unconfirmed bookings.");
    }
}
