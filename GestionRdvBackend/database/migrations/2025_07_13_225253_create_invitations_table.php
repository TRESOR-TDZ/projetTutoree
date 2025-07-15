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
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();

            $table->string('matricule')->unique(); // Matricule unique pour l'invitation
            $table->string('email')->unique();
            $table->string('structure_id')->nullable();
            $table->string('role'); // Users: 0=>Patient, 1=>Doteur, 2=>Admin Structure 3=>Admin Systeme
            $table->string('status')->nullable();
            $table->string('token')->unique();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
