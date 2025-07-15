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
        'horaires',
    ];
}
