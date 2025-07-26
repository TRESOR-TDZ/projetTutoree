<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Models\Structure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;

class StructurePatController extends Controller
{
    // --------------------------------------------------------------
    // Affichage de toutes les structures du point de vue des patient
    // --------------------------------------------------------------
    public function index(Request $request)
    {
        try {
            $query = Structure::withCount('docteurs');

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%$search%")
                        ->orWhere('email', 'like', "%$search%")
                        ->orWhere('telephone', 'like', "%$search%")
                        ->orWhere('adresse', 'like', "%$search%")
                        ->orWhere('matricule', 'like', "%$search%");
                });
            }

            if ($request->filled('type_structure')) {
                $query->where('type_structure', $request->type_structure);
            }

            // Structures ouvertes uniquement
            if ($request->filled('only_open')) {
                $currentTime = now()->format('H:i:s');
                $query->whereTime('horaires_debut', '<=', $currentTime)
                    ->whereTime('horaires_fin', '>=', $currentTime);
            }

            $structures = $query->orderBy('created_at', 'desc')->paginate(10);

            return response()->json([
                'success' => true,
                'message' => 'Structures récupérées avec succès.',
                'data' => $structures,
                'current_time' => now()->format('H:i:s'),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des structures : ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des structures.',
                'error' => $e->getMessage()
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

    // -----------------------------------------------------
    // Visualisation de la structure
    // -----------------------------------------------------
    public function show($id)
    {
        $structure = Structure::withCount('docteurs')->find($id);

        if (!$structure) {
            return response()->json([
                'status' => 'error',
                'message' => 'Structure non trouvée',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $structure,
            'image_url' => $structure->image ? asset('storage/structures/' . $structure->image) : null,
        ]);
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
