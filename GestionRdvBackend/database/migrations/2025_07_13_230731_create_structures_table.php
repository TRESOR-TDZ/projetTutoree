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
        Schema::create('structures', function (Blueprint $table) {
            $table->id();

            $table->string('matricule')->unique();         // Matricule unique pour la structure
            $table->string('image')->nullable();
            $table->string('nom');                         // Nom de la structure
            $table->string('email');                       // Email (structure ou admin)
            $table->string('code_telephone')->nullable();  // code telephonique
            $table->string('telephone')->nullable();

            $table->string('adresse')->nullable();
            $table->string('service')->nullable();
            $table->string('type_structure')->nullable();
            $table->string('horaires')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('structures');
    }
};
