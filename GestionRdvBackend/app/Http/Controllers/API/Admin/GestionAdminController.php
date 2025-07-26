<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Structure;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Response;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Validation\Rules\Password;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;


class GestionAdminController extends Controller
{
    // -----------------------------------------------------
    // Affichage de tout les administrateurs
    // -----------------------------------------------------
    public function index(Request $request)
    {
        try {
            // Initialiser la requête avec relation 'structure'
            $query = User::with('structure')->where('role', 3);

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

            if ($request->filled('type_structure')) {
                $query->where('type_structure', $request->type_structure);
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

            $admins = $query->latest()->get();
            $structures = Structure::all();

            return response()->json([
                'status'     => 'success',
                'admins'     => $admins,
                'structures' => $structures
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la récupération des administrateurs',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // -----------------------------------------------------
    // Interface de creation des administrateurs
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

        $admin = User::create([
            'matricule' => 'ADMSYS' . date('YmdHis') . rand(100, 999), // Génération d'un matricule unique
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => '3',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Administrateur ajouté avec succès',
            'data'    => $admin,
        ], 201);
    }

    // -----------------------------------------------------
    // Visualisation de l'administrateur
    // -----------------------------------------------------
    public function show($id)
    {
        try {
            $user = User::where('role', 3)->find($id);

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
    // Edition de l'administrateur
    // -----------------------------------------------------
    public function edit($id)
    {
        try {
            $user = User::where('role', 3)->find($id);

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
    // Mise à jour de l'administrateur
    // -----------------------------------------------------
    public function update(Request $request, $id)
    {
        try {
            $user = User::where('role', 3)->find($id);

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
                'password' => ['nullable', 'confirmed', Password::min(8)
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
                if ($user->profil && Storage::disk('public')->exists('storage/profil/' . $user->profil)) {
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
    // Suppression de l'administrateur
    // -----------------------------------------------------
    public function destroy($id)
    {
        try {
            $user = User::where('role', 3)->find($id);

            if (!$user) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            // Vérifier s'il y a des relations à gérer avant la suppression
            // Par exemple, vous pourriez vouloir réassigner les éléments liés à cet admin

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

    // -------------------------------------------------------------
    // Telechargement de la listes des administrateurs en format PDF
    // -------------------------------------------------------------
    public function exportPdfApi()
    {
        $users = User::with('structure')->where('role', 3)->get();

        $pdf = Pdf::loadView('Documents.AdminSysteme.listes_admin_systeme_pdf', compact('users'))
                ->setPaper('A4', 'portrait');

        $date = now()->format('d-m-Y_His');
        $fileName = "listes_utilisateurs(admin_systeme)_$date.pdf";

        return Response::make($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"$fileName\"",
        ]);
    }

    // -------------------------------------------------------------
    // Telechargement de la listes des administrateurs en format Excel
    // -------------------------------------------------------------
    public function exportExcelApi()
    {
        $utilisateurs = User::with('structure')->where('role', 3)
            ->select('name', 'email', 'code_phone', 'phone', 'gender', 'birthday', 'structure_id')
            ->get()
            ->map(function ($user) {
                return [
                    'Nom' => $user->name,
                    'Email' => $user->email,
                    'Indicatif' => $user->code_phone,
                    'Téléphone' => $user->phone,
                    'Genre' => $user->gender,
                    'Naissance' => $user->birthday,
                    'Structure' => $user->structure->nom ?? 'Non assignée',
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
                ];
            }
        };

        $date = now()->format('d-m-Y_His');
        $fileName = "listes_utilisateurs(admin_systeme)_$date.xlsx";

        return Excel::download($export, $fileName);
    }
}
