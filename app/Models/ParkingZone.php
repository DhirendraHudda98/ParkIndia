<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $name
 * @property ?string $location
 * @property ?string $description
 * @property decimal $pricing_multiplier
 * @property ?int $occupancy_limit
 * @property string $status
 * @property string $slug
 * @property ?string $tenant_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property ?Carbon $deleted_at
 * @property-read Collection<int, ParkingLot> $parkingLots
 */
class ParkingZone extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    protected $table = 'parking_zones';

    protected $fillable = [
        'name',
        'location',
        'description',
        'pricing_multiplier',
        'occupancy_limit',
        'status',
        'slug',
        'tenant_id',
    ];

    protected $casts = [
        'pricing_multiplier' => 'decimal:2',
        'occupancy_limit' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    };

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (ParkingZone $zone) {
            if (empty($zone->slug)) {
                $zone->slug = Str::slug($zone->name);
            }
        });

        static::updating(function (ParkingZone $zone) {
            if ($zone->isDirty('name') && ! $zone->isDirty('slug')) {
                $zone->slug = Str::slug($zone->name);
            }
        });
    }

    public function parkingLots(): BelongsToMany
    {
        return $this->belongsToMany(
            ParkingLot::class,
            'parking_zone_parking_lot',
            'parking_zone_id',
            'parking_lot_id'
        )->withTimestamps();
    }

    /**
     * Get the total number of lots in this zone.
     */
    public function getTotalLotsCount(): int
    {
        return $this->parkingLots()->count();
    }

    /**
     * Get the total occupancy across all lots in the zone.
     */
    public function getTotalOccupancy(): int
    {
        return $this->parkingLots()
            ->sum('available_slots');
    }

    /**
     * Get the total capacity across all lots in the zone.
     */
    public function getTotalCapacity(): int
    {
        return $this->parkingLots()
            ->sum('total_slots');
    }

    /**
     * Get occupancy percentage for the zone.
     */
    public function getOccupancyPercentage(): float
    {
        $totalCapacity = $this->getTotalCapacity();
        if ($totalCapacity === 0) {
            return 0;
        }

        $available = $this->getTotalOccupancy();

        return round((($totalCapacity - $available) / $totalCapacity) * 100, 2);
    }

    /**
     * Check if zone is at capacity or exceeds occupancy limit.
     */
    public function isAtCapacity(): bool
    {
        if ($this->occupancy_limit === null) {
            return false;
        }

        return $this->getTotalOccupancy() <= 0;
    }

    /**
     * Get the active status as a label.
     */
    public function getStatusLabel(): string
    {
        return match ($this->status) {
            'active' => 'Active',
            'inactive' => 'Inactive',
            default => 'Unknown',
        };
    }
}
