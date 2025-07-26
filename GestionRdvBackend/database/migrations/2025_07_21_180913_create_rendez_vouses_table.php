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
        Schema::create('rendez_vouses', function (Blueprint $table) {
            $table->id();

            $table->string('matricule')->unique();
            $table->date('date')->nullable();
            $table->time('time')->nullable();
            $table->string('statut')->default('En attente');
            $table->string('motif');

            $table->string('matricule_patient');
            $table->string('matricule_docteur');

            $table->string('structure_id');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rendez_vouses');
    }
};
