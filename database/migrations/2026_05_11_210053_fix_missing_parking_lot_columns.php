<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parking_lots', function (Blueprint $table) {
            if (!Schema::hasColumn('parking_lots', 'available_spots')) {
                $table->integer('available_spots')->default(0)->after('total_slots');
            }
            if (!Schema::hasColumn('parking_lots', 'availability_last_updated')) {
                $table->timestamp('availability_last_updated')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('parking_lots', function (Blueprint $table) {
            if (Schema::hasColumn('parking_lots', 'available_spots')) {
                $table->dropColumn('available_spots');
            }
            if (Schema::hasColumn('parking_lots', 'availability_last_updated')) {
                $table->dropColumn('availability_last_updated');
            }
        });
    }
};
