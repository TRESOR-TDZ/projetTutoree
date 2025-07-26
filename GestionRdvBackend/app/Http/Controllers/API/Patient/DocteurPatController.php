<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Models\Structure;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DocteurPatController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            // Initialiser la requête avec relation 'structure'
            $query = User::with('structure')->where('role', 1);

            // Appliquer filtre de recherche si présent
            if ($request->filled('search')) {
                $search = $request->search;

                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                    ->orWhere('phone', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%")
                    ->orWhereHas('structure', function ($sq) use ($search) {
                        $sq->where('nom', 'like', "%$search%");
                    });
                });
            }

            // Exemple filtre sur un champ "status" si nécessaire
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('gender')) {
                $query->where('gender', $request->gender);
            }

            $docteurs = $query->latest()->get();
            $structures = Structure::all();

            return response()->json([
                'status'     => 'success',
                'docteurs'     => $docteurs,
                'structures' => []
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la récupération des patients',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
