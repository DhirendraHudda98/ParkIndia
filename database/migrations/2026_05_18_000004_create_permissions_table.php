<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->string('module'); // users, parking_lots, parking_zones, bookings, billing, reports
            $table->string('action'); // view, create, edit, delete, manage
            $table->string('slug')->unique();
            $table->timestamps();
            $table->softDeletes();

            $table->index('module');
            $table->index(['module', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
