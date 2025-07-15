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
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('matricule')->unique(); // Matricule unique pour l'utilisateur

            $table->string('name');
            $table->string('email')->unique();

            $table->string('profil')->nullable();

            $table->date('birthday')->nullable(); // Date de naissance
            $table->string('gender')->nullable(); // Sexe de l'utilisateur
            $table->string('code_phone')->nullable(); // Code du pays pour le téléphone
            $table->string('phone')->nullable(); // Numéro de téléphone

            $table->string('status')->default('Actif');
            $table->boolean('role')->default(false); //add type boolean Users: 0=>Patient, 1=>Doteur, 2=>Admin Structure 3=>Admin Systeme

            $table->string('structure_id')->nullable(); // FK si user rattaché à une structure

            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();

            // Clé étrangère
            $table->foreign('structure_id')->references('matricule')->on('structures')->onDelete('set null');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
