<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->enum('role_type', ['super_admin', 'admin', 'manager', 'staff', 'custom'])->default('custom');
            $table->boolean('is_active')->default(true);
            $table->string('slug')->unique();
            $table->nullableUuidMorphs('tenant');
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
