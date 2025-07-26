<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Structure extends Model
{
    use HasFactory;

    protected $fillable = [
        'image',
        'matricule',
        'nom',
        'email',

        'telephone',
        'code_telephone',

        'adresse',
        'service',
        'type_structure',

        'horaires_debut',
        'horaires_fin',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'structure_id', 'matricule');
    }

    public function docteurs()
    {
        return $this->hasMany(User::class, 'structure_id', 'matricule')->where('role', 1);
    }

    public function adminStructures()
    {
        return $this->hasMany(User::class, 'structure_id', 'matricule')->where('role', 2);
    }
}
