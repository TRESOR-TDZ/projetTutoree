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

use Illuminate\Support\Facades\Response;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class GestionAdminStructureController extends Controller
{

    // -----------------------------------------------------
    // Affichage de tout les administrateurs de structures
    // -----------------------------------------------------
    public function index(Request $request)
    {
        try {
            // Initialiser la requête avec relation 'structure'
            $query = User::with('structure')->where('role', 2);

            // Filtre recherche texte libre (nom, email, phone)
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

            // Filtrer par structure_id si passé
            if ($request->filled('structure_id')) {
                $query->where('structure_id', $request->structure_id);
            }

            // Filtrer par date de création si passé
            if ($request->filled('created_at')) {
                try {
                    $date = Carbon::parse($request->created_at)->format('Y-m-d');
                    $query->whereDate('created_at', $date);
                } catch (\Exception $e) {
                    // Optionnel : gérer l'erreur si la date n'est pas valide
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Format de date invalide pour created_at.'
                    ], 422);
                }
            }

            // Exemple filtre sur un champ "status" si nécessaire
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $adminstr = $query->latest()->get();
            $structures = Structure::all();

            return response()->json([
                'status'     => 'success',
                'adminstr'   => $adminstr,
                'structures' => $structures,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la récupération des administrateurs de structures',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // -----------------------------------------------------
    // Interface de creation des administrateurs de structures
    // -----------------------------------------------------
    public function create()
    {
        //
    }

    // -----------------------------------------------------
    // Stockage des administrateurs de structures
    // -----------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'structure_id' => 'nullable|string',
            'password' => ['required', 'confirmed', Password::min(8)
                ->mixedCase()     // Majuscules et minuscules
                ->letters()       // Lettres requises
                ->numbers()       // Chiffres requis
                // ->symbols()       // Caractères spéciaux requis
                ->uncompromised() // Non présent dans des fuites de données connues
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Erreur de validation',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $adminstr = User::create([
            'matricule' => 'ADMSTR' . date('YmdHis') . rand(100, 999), // Génération d'un matricule unique
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'structure_id' => $request->structure_id,
            'role'     => '2', // Rôle d'administrateur de structure
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Administrateur de structure ajouté avec succès',
            'data'    => $adminstr,
        ], 201);
    }

    // -----------------------------------------------------
    // Visualisation de l'administrateur de structure
    // -----------------------------------------------------
    public function show($id)
    {
        try {
            $user = User::with('structure')->where('role', 2)->find($id);

            if (!$user) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'user'   => $user
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la récupération de l’utilisateur',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Télécharger la fiche personnel de l'administrateur de structure en PDF
     */
    public function downloadPDF($id)
    {
        try {
            // Récupération de l'utilisateur
            $user = User::with('structure')->where('role', 2)->findOrFail($id);

            // Données pour le PDF
            $data = [
                'user' => $user,
                'generated_at' => now()->format('d/m/Y à H:i'),
                'generated_by' => Auth::user()->name ?? 'Système',
            ];

            // Nom du fichier
            $fileName = 'fiche-admin-structure-' . Str::slug($user->name) . '-' . now()->format('Y-m-d') . '.pdf';

            // Générer et télécharger le PDF directement
            $pdf = Pdf::loadView('Documents.AdminSysteme.admin-structure-fiche', $data);

            return $pdf->download($fileName);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Utilisateur introuvable'
            ], 404);
        } catch (Exception $e) {
            Log::error('Erreur downloadPDF: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Erreur lors de la génération du PDF',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Méthode alternative pour visualiser le PDF dans le navigateur
     */
    public function viewPDF($id)
    {
        try {
            $user = User::with('structure')
                    ->where('role', 2)
                    ->find($id);

            if (!$user) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            $data = [
                'user' => $user,
                'generated_at' => Carbon::now()->format('d/m/Y à H:i'),
                'generated_by' => Auth::user()->name ?? 'Système',
            ];

            $pdf = Pdf::loadView('Documents.AdminSysteme.admin-structure-fiche', $data)
                    ->setPaper('A4', 'portrait');

            // Retourner le PDF pour visualisation dans le navigateur
            return $pdf->stream('fiche-admin-structure-' . Str::slug($user->name) . '.pdf');

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la génération du PDF',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // -----------------------------------------------------
    // Edition de l'administrateur de structure
    // -----------------------------------------------------
    public function edit($id)
    {
        try {
            $user = User::with('structure')->where('role', 2)->find($id);

            if (!$user) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'user'   => $user
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la récupération de l’utilisateur',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // -----------------------------------------------------
    // Mise à jour de l'administrateur de structure
    // -----------------------------------------------------
    public function update(Request $request, $id)
    {
        try {
            $user = User::where('role', 2)->find($id);

            if (!$user) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            $validated = $request->validate([
                'profil'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
                'name'       => 'sometimes|string|max:255',
                'email'      => 'sometimes|email|unique:users,email,' . $user->id,
                'birthday'   => 'nullable|date',
                'gender'     => 'nullable|string|in:Masculin,Féminin,Autre',
                'code_phone' => 'nullable|string|max:10',
                'phone'      => 'nullable|string|max:20',
                'structure_id' => 'nullable|string',
                'password'   => ['nullable', 'confirmed', Password::min(8)
                    ->mixedCase()     // Majuscules et minuscules
                    ->letters()       // Lettres requises
                    ->numbers()       // Chiffres requis
                    // ->symbols()       // Caractères spéciaux requis
                    ->uncompromised() // Non présent dans des fuites de données connues
                ],
            ]);

            // Gestion de l'upload de l'image de profil
            if ($request->hasFile('profil')) {
                $file = $request->file('profil');
                $extension = $file->getClientOriginalExtension();
                $fileName = Str::uuid() . '.' . $extension;

                // Stocker dans storage/app/public/profil
                $file->storeAs('profil', $fileName, 'public');

                // Supprimer l'ancien fichier s'il existe
                if ($user->profil && Storage::disk('public')->exists('profil/' . $user->profil)) {
                    Storage::disk('public')->delete('profil/' . $user->profil);
                }

                // Ajouter le nom du fichier aux données validées
                $validated['profil'] = $fileName;
            }

            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'status'  => 'success',
                'message' => 'Utilisateur mis à jour avec succès',
                'user'    => $user
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Erreur de validation',
                'errors'  => $e->errors()
            ], 422);
        } catch (QueryException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Erreur lors de la mise à jour',
                'error'   => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // -----------------------------------------------------
    // Suppression de l'administrateur de structure
    // -----------------------------------------------------
    public function destroy($id)
    {
        try {
            $user = User::where('role', 2)->find($id);

            if (!$user) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            // Supprimer la photo de profil s'il y en a une
            if ($user->profil && Storage::disk('public')->exists($user->profil)) {
                Storage::disk('public')->delete($user->profil);
            }

            // Supprimer le fichier du dossier "profil"
            if (!empty($user->profil)) {
                $videoPath = public_path('/storage/profil/' . $user->profil);

                if (file_exists($videoPath) && is_file($videoPath)) {
                    unlink($videoPath);
                }
            }

            // Supprimer l'utilisateur
            $userName = $user->name;
            $user->delete();

            return response()->json([
                'status'  => 'success',
                'message' => "L'administrateur {$userName} a été supprimé avec succès"
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la suppression',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // ----------------------------------------------------------------------------
    // Telechargement de la listes des administrateurs de structures en format PDF
    // ----------------------------------------------------------------------------
    public function exportPdfApi(Request $request)
    {
        $query = User::with('structure')->where('role', 2);

        // Filtrer par structure_id directement sur la colonne 'structure_id' de la table users
        if ($request->filled('structure_id')) {
            $query->where('structure_id', $request->structure_id);
        }

        // Filtrer par date de création (created_at)
        if ($request->filled('created_at')) {
            try {
                $date = Carbon::parse($request->created_at)->format('Y-m-d');
                $query->whereDate('created_at', $date);
            } catch (\Exception $e) {
                // Optionnel : gérer l'erreur si la date n'est pas valide
                return response()->json([
                    'status' => 'error',
                    'message' => 'Format de date invalide pour created_at.'
                ], 422);
            }
        }

        // Filtrer par status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->get();

        $pdf = Pdf::loadView('Documents.AdminSysteme.listes_admin_structure_pdf', compact('users'))
                ->setPaper('A4', 'portrait');

        $date = now()->format('d-m-Y_His');
        $fileName = "listes_utilisateurs(admin_structure)_$date.pdf";

        return response()->make($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"$fileName\"",
        ]);
    }

    // ----------------------------------------------------------------------------
    // Telechargement de la listes des administrateurs de structures en format Excel
    // ----------------------------------------------------------------------------
    public function exportExcelApi(Request $request)
    {
        $query = User::with('structure')->where('role', 2);

        if ($request->filled('structure_id')) {
            $query->where('structure_id', $request->structure_id);
        }

        if ($request->filled('created_at')) {
            try {
                $date = Carbon::parse($request->created_at)->format('Y-m-d');
                $query->whereDate('created_at', $date);
            } catch (\Exception $e) {
                // Optionnel : gérer l'erreur si la date n'est pas valide
                return response()->json([
                    'status' => 'error',
                    'message' => 'Format de date invalide pour created_at.'
                ], 422);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $utilisateurs = $query
            ->select('name', 'email', 'code_phone', 'phone', 'gender', 'birthday', 'structure_id','created_at', 'updated_at', 'status')
            ->get()
            ->map(function ($user) {
                return [
                    'Nom' => $user->name,
                    'Email' => $user->email,
                    'Indicatif' => $user->code_phone ?? 'N/A',
                    'Téléphone' => $user->phone ?? 'N/A',
                    'Genre' => $user->gender ?? 'N/A',
                    'Naissance' => $user->birthday ?? 'N/A',
                    'Structure' => $user->structure->nom ?? 'Non assignée',
                    'Date de création' => $user->created_at->format('d-m-Y H:i:s'),
                    'Date de mise à jour' => $user->updated_at->format('d-m-Y H:i:s'),
                    'Statut' => $user->status,
                ];
            });

        $export = new class($utilisateurs) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            private $data;

            public function __construct($data)
            {
                $this->data = $data;
            }

            public function collection()
            {
                return collect($this->data);
            }

            public function headings(): array
            {
                return [
                    'Nom',
                    'Email',
                    'Indicatif',
                    'Téléphone',
                    'Genre',
                    'Naissance',
                    'Structure',
                    'Date de création',
                    'Date de mise à jour',
                    'Statut',
                ];
            }
        };

        $date = now()->format('d-m-Y_His');
        $fileName = "listes_utilisateurs(admin_structure)_$date.xlsx";

        return Excel::download($export, $fileName);
    }

}
