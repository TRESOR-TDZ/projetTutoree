<?php

namespace App\Http\Controllers\API\AdminStr;

use App\Http\Controllers\Controller;
use App\Models\Structure;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;

use Illuminate\Support\Facades\Log;
use Exception;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class GestionDoctorStrController extends Controller
{
    // -----------------------------------------------------
    // Affichage de tout les docteurs de la structure
    // -----------------------------------------------------
    public function index(Request $request)
    {
        try {
            // Get the authenticated user
            $user = $request->user();

            // Ensure the authenticated user has a structure_id
            if (!$user || !$user->structure_id) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Utilisateur non authentifié ou non assigné à une structure.'
                ], 403); // Forbidden access
            }


            $query = User::with('structure')
                         ->where('role', 1)
                         ->Where('structure_id', $user->structure_id);

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

            // Filter by creation date if provided
            if ($request->filled('created_at')) {
                try {
                    $date = Carbon::parse($request->created_at)->format('Y-m-d');
                    $query->whereDate('created_at', $date);
                } catch (Exception $e) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'Format de date invalide pour created_at.'
                    ], 422);
                }
            }

            // Filter by status if provided (e.g., 0 for inactive, 1 for active)
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('genre')) {
                $query->where('genre', $request->genre);
            }

            // Order by latest created and get the results
            $docteur = $query->latest()->get();

            return response()->json([
                'status'  => 'success',
                'docteur' => $docteur,
            ], 200);

        } catch (Exception $e) {
            // Log the error for debugging purposes
            Log::error('Error fetching doctors: ' . $e->getMessage(), ['exception' => $e]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la récupération des docteurs',
                'error'   => $e->getMessage(),
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

    // -----------------------------------------------------
    // Stockage des docteurs
    // -----------------------------------------------------
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
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

        // Use $request->user() for the authenticated user
        $authenticatedUser = $request->user();

        if (!$authenticatedUser || $authenticatedUser->structure_id == null) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Utilisateur non authentifié ou non assigné à aucune structure.'
            ], 403);
        }

        $doctor = User::create([
            'matricule' => 'DOC' . date('YmdHis') . rand(100, 999), // Génération d'un matricule unique
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'structure_id' => $authenticatedUser->structure_id, // Use authenticated user's structure_id
            'role'     => '1', // Rôle du docteur
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Docteur ajouté avec succès', // Changed message for clarity
            'data'    => $doctor,
        ], 201);
    }

    // -----------------------------------------------------
    // Visualisation du docteur
    // -----------------------------------------------------
    public function show($id)
    {
        try {
            $user = User::with('structure')->where('role', 1)->find($id);

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
    // Edition du docteur
    // -----------------------------------------------------
    public function edit(Request $request, $id)
    {
        try {

            $user = $request->user();

            $user = User::with('structure')->where('role', 1)->Where('structure_id', $user->structure_id)->find($id);

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
    // Mise à jour du docteur
    // -----------------------------------------------------
    public function update(Request $request, $id)
    {
        try {

            $user = User::where('role', 1)->find($id);

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
                    Storage::disk('public')->delete('storage/profil/' . $user->profil);
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
    // Suppression du docteur
    // -----------------------------------------------------
    public function destroy($id)
    {
        try {
            $user = User::where('role', 1)->where('structure_id', Auth::user()->structure_id)->find($id);

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
                'message' => "Le Docteur {$userName} a été supprimé avec succès"
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
    // Telechargement de la listes des docteurs de la structure en format PDF
    // ----------------------------------------------------------------------------
    public function exportPdfApi(Request $request)
    {

        if (Auth::user()->structure_id == null) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Utilisateur assigné à aucune strucutre'
            ], 404);
        }

        $query = User::with('structure')->where('role', 1)->where('structure_id', Auth::user()->structure_id);

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

        // Filtrer par sexe
        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        $users = $query->get();

        $pdf = Pdf::loadView('Documents.AdminStructure.listes_docteurs_pdf', compact('users','data'))
                ->setPaper('A4', 'portrait');

        $date = now()->format('d-m-Y_His');
        $fileName = "listes_utilisateurs(docteurs)_$date.pdf";

        return response()->make($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"$fileName\"",
        ]);
    }

    // ----------------------------------------------------------------------------
    // Telechargement de la listes des docteurs de la structure en format Excel
    // ----------------------------------------------------------------------------
    public function exportExcelApi(Request $request)
    {

        if (Auth::user()->structure_id == null) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Utilisateur assigné à aucune strucutre'
            ], 404);
        }

        $query = User::with('structure')->where('role', 1)->where('structure_id', Auth::user()->structure_id);

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
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
        $fileName = "listes_utilisateurs(docteurs)_$date.xlsx";

        return Excel::download($export, $fileName);
    }
}
