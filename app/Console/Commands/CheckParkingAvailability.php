<?php

namespace App\Console\Commands;

use App\Services\ParkingAvailabilityService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * CheckParkingAvailability
 *
 * Artisan command that refreshes real-time availability for all open parking lots.
 * Scheduled to run every 5 minutes via routes/console.php.
 *
 * Usage:
 *   php artisan parking:check-availability
 *   php artisan parking:check-availability --lot=<uuid>
 */
class CheckParkingAvailability extends Command
{
    protected $signature = 'parking:check-availability
                            {--lot= : UUID of a specific lot to refresh (optional)}
                            {--quiet-log : Suppress info output (useful in scheduled context)}';

    protected $description = 'Refresh real-time parking availability for all (or one) lot(s).';

    public function __construct(private readonly ParkingAvailabilityService $service)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $lotId = $this->option('lot');

        if ($lotId) {
            return $this->refreshSingle($lotId);
        }

        return $this->refreshAll();
    }

    private function refreshAll(): int
    {
        $this->info('🅿️  ParkIndia — Refreshing parking availability for all lots...');

        try {
            $count = $this->service->refreshAll();
            $this->info("✅  Refreshed availability for {$count} lot(s).");
            Log::info("CheckParkingAvailability: refreshed {$count} lots", ['at' => now()->toIso8601String()]);
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("❌  Failed to refresh availability: {$e->getMessage()}");
            Log::error('CheckParkingAvailability: refresh failed', ['error' => $e->getMessage()]);
            return self::FAILURE;
        }
    }

    private function refreshSingle(string $lotId): int
    {
        $this->info("🅿️  Refreshing availability for lot: {$lotId}");

        $lot = \App\Models\ParkingLot::find($lotId);
        if (! $lot) {
            $this->error("❌  Lot not found: {$lotId}");
            return self::FAILURE;
        }

        $result = $this->service->refreshFromLive($lot);
        $this->info("✅  {$lot->name}: {$result['available_spots']}/{$result['total_slots']} spots available.");
        return self::SUCCESS;
    }
}
