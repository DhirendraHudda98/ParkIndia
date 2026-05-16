<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add India-specific fields to parking_lots table.
     *
     * Skips columns that already exist (latitude, longitude, available_spots,
     * availability_last_updated) — added by earlier migrations.
     * Adds only the new ParkIndia fields: INR pricing + Indian address components.
     */
    public function up(): void
    {
        Schema::table('parking_lots', function (Blueprint $table) {
            // Indian Rupee pricing (new columns)
            if (!Schema::hasColumn('parking_lots', 'hourly_rate_inr')) {
                $table->decimal('hourly_rate_inr', 8, 2)->nullable()->after('longitude')
                    ->comment('Price per hour in Indian Rupees (₹)');
            }
            if (!Schema::hasColumn('parking_lots', 'daily_max_inr')) {
                $table->decimal('daily_max_inr', 8, 2)->nullable()->after('hourly_rate_inr')
                    ->comment('Maximum price per day in Indian Rupees (₹)');
            }

            // Indian address components (new columns)
            if (!Schema::hasColumn('parking_lots', 'city')) {
                $table->string('city', 100)->default('Mumbai')->after('daily_max_inr');
            }
            if (!Schema::hasColumn('parking_lots', 'state')) {
                $table->string('state', 100)->default('Maharashtra')->after('city');
            }
            if (!Schema::hasColumn('parking_lots', 'pincode')) {
                $table->string('pincode', 6)->nullable()->after('state');
            }
        });

        // Add geo index only if it doesn't exist yet
        try {
            Schema::table('parking_lots', function (Blueprint $table) {
                $table->index(['city', 'status'], 'idx_parking_lots_city_status');
            });
        } catch (\Throwable) {
            // Index already exists — skip silently
        }
    }

    public function down(): void
    {
        Schema::table('parking_lots', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['hourly_rate_inr', 'daily_max_inr', 'city', 'state', 'pincode'] as $col) {
                if (Schema::hasColumn('parking_lots', $col)) {
                    $columnsToDrop[] = $col;
                }
            }
            if ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            }

            try {
                $table->dropIndex('idx_parking_lots_city_status');
            } catch (\Throwable) {}
        });
    }
};
