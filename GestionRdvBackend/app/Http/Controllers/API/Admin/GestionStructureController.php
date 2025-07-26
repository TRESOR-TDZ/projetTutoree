<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Structure;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GestionStructureController extends Controller
{
    // -----------------------------------------------------
    // Affichage de tout les structures
    // -----------------------------------------------------
    public function index(Request $request)
    {
        try {
            $query = Structure::query();

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

            if ($request->filled('created_at')) {
                $query->whereDate('created_at', $request->created_at);
            }

            $structures = $query->orderBy('created_at', 'desc')->paginate(4);

            return response()->json([
                'success' => true,
                'message' => 'Structures récupérées avec succès.',
                'data' => $structures
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

    // -----------------------------------------------------
    // Interface de creation des structures
    // -----------------------------------------------------
    public function create()
    {
        //
    }

    // -----------------------------------------------------
    // Stockage de l'administrateur
    // -----------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'nom'            => 'required|string|max:255',
            'email'          => 'required|email|unique:structures,email',
            'telephone'      => 'nullable|string|max:20',
            'code_telephone' => 'nullable|string|max:10',
            'adresse'        => 'nullable|string|max:255',
            'service'        => 'nullable|string|max:255',
            'type_structure' => 'required|string|max:100',
            'horaires_debut'       => 'nullable|string|max:100',
            'horaires_fin'       => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Erreur de validation',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $fileName = null;

            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $extension = $file->getClientOriginalExtension();
                $fileName = Str::uuid() . '.' . $extension;

                // Stocker dans storage/app/public/structures
                $file->storeAs('structures', $fileName, 'public');

            }

            $structure = Structure::create([
                'image'          => $fileName,
                'matricule'      => 'STR' . now()->format('YmdHis') . rand(100, 999),
                'nom'            => $request->nom,
                'email'          => $request->email,
                'telephone'      => $request->telephone,
                'code_telephone' => $request->code_telephone,
                'adresse'        => $request->adresse,
                'service'        => $request->service,
                'type_structure' => $request->type_structure,
                'horaires_debut'       => $request->horaires_debut,
                'horaires_fin'       => $request->horaires_fin,
            ]);

            return response()->json([
                'status'     => 'success',
                'message'    => 'Structure enregistrée avec succès',
                'data'       => $structure,
                'image_url'  => $fileName ? asset('storage/structures/' . $fileName) : null,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l’enregistrement de la structure : ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Erreur serveur lors de la création de la structure.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // -----------------------------------------------------
    // Visualisation de la structure
    // -----------------------------------------------------
    public function show($id)
    {
        $structure = Structure::find($id);

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

    // -----------------------------------------------------
    // Edition de la structure
    // -----------------------------------------------------
    public function edit($id)
    {
        // Recherche de la structure par ID
        $structure = Structure::find($id);

        // Vérifie si la structure existe
        if (!$structure) {
            return response()->json([
                'message' => 'Structure non trouvée.'
            ], 404);
        }

        // Retourne la structure au format JSON
        return response()->json([
            'structure' => $structure
        ], 200);
    }

    // -----------------------------------------------------
    // Mise à jour de la structure
    // -----------------------------------------------------
    public function update(Request $request, $id)
    {
        $structure = Structure::find($id);

        if (!$structure) {
            return response()->json([
                'status' => 'error',
                'message' => 'Structure non trouvée',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'image'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'nom'            => 'required|string|max:255',
            'email'          => 'required|email|unique:structures,email,' . $structure->id,
            'telephone'      => 'nullable|string|max:20',
            'code_telephone' => 'nullable|string|max:10',
            'adresse'        => 'nullable|string|max:255',
            'service'        => 'nullable|string|max:255',
            'type_structure' => 'required|string|max:100',
            'horaires_debut' => 'required|string|max:100',
            'horaires_fin'   => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image si elle existe
                if ($structure->image && Storage::disk('public')->exists('structures/' . $structure->image)) {
                    Storage::disk('public')->delete('structures/' . $structure->image);
                }

                $file = $request->file('image');
                $extension = $file->getClientOriginalExtension();
                $fileName = Str::uuid() . '.' . $extension;
                $file->storeAs('structures', $fileName, 'public');

                $structure->image = $fileName;
            }

            // Mise à jour des champs
            $structure->update([
                'nom'            => $request->nom,
                'email'          => $request->email,
                'telephone'      => $request->telephone,
                'code_telephone' => $request->code_telephone,
                'adresse'        => $request->adresse,
                'service'        => $request->service,
                'type_structure' => $request->type_structure,
                'horaires_debut' => $request->horaires_debut,
                'horaires_fin'   => $request->horaires_fin,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Structure mise à jour avec succès',
                'data' => $structure,
                'image_url' => $structure->image ? asset('storage/structures/' . $structure->image) : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la structure : ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur serveur lors de la mise à jour.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    // -----------------------------------------------------
    // Suppression de la structure
    // -----------------------------------------------------
    public function destroy($id)
    {
        $structure = Structure::find($id);

        if (!$structure) {
            return response()->json([
                'status' => 'error',
                'message' => 'Structure non trouvée',
            ], 404);
        }

        try {
            // Supprimer l'image liée si elle existe
            if ($structure->image && Storage::disk('public')->exists('structures/' . $structure->image)) {
                Storage::disk('public')->delete('structures/' . $structure->image);
            }

            $structure->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Structure supprimée avec succès',
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la structure : ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur serveur lors de la suppression.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

}
