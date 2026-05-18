<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parking_zones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->decimal('pricing_multiplier', 5, 2)->default(1.0);
            $table->integer('occupancy_limit')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('slug')->unique();
            $table->nullableUuidMorphs('tenant');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parking_zones');
    }
};
