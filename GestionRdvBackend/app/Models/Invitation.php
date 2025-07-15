<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'matricule',
        'structure_id',
        'email',
        'token',
        'role',
        'status',
    ];

    public function structure()
    {
        return $this->belongsTo(Structure::class, 'structure_id', 'matricule');
    }
}
