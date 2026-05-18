<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parking_zone_parking_lot', function (Blueprint $table) {
            $table->uuid('parking_zone_id');
            $table->uuid('parking_lot_id');
            $table->timestamps();

            $table->foreign('parking_zone_id')->references('id')->on('parking_zones')->onDelete('cascade');
            $table->foreign('parking_lot_id')->references('id')->on('parking_lots')->onDelete('cascade');
            $table->primary(['parking_zone_id', 'parking_lot_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parking_zone_parking_lot');
    }
};
