<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indian_cities', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('state', 120);
            $table->string('state_code', 4);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_metro')->default(false);
            $table->integer('sort_order')->default(999);
            $table->timestamps();

            $table->index(['state_code'], 'idx_cities_state');
            $table->index(['is_metro'], 'idx_cities_metro');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indian_cities');
    }
};
