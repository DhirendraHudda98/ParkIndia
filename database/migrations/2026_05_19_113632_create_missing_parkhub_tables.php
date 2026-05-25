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
        if (!Schema::hasTable('guest_bookings')) {
            Schema::create('guest_bookings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('created_by');
                $table->uuid('lot_id');
                $table->uuid('slot_id');
                $table->string('guest_name');
                $table->string('guest_code')->unique();
                $table->timestamp('start_time')->nullable();
                $table->timestamp('end_time')->nullable();
                $table->string('vehicle_plate')->nullable();
                $table->string('status')->default('confirmed');
                $table->timestamps();
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('booking_notes')) {
            Schema::create('booking_notes', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('booking_id');
                $table->uuid('user_id');
                $table->text('note');
                $table->timestamps();
                $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('push_subscriptions')) {
            Schema::create('push_subscriptions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id');
                $table->text('endpoint');
                $table->string('p256dh');
                $table->string('auth');
                $table->timestamps();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('webhooks')) {
            Schema::create('webhooks', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('url');
                $table->json('events')->nullable();
                $table->string('secret')->nullable();
                $table->boolean('active')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhooks');
        Schema::dropIfExists('push_subscriptions');
        Schema::dropIfExists('booking_notes');
        Schema::dropIfExists('guest_bookings');
    }
};
