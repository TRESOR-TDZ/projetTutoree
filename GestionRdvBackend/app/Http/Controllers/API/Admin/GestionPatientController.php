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

use Illuminate\Support\Facades\Response;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\Rules\Password;

class GestionPatientController extends Controller
{
    // -----------------------------------------------------
    // Affichage de tout les patients
    // -----------------------------------------------------
    public function index(Request $request)
    {
        try {
            // Initialiser la requête avec relation 'structure'
            $query = User::with('structure')->where('role', 0);

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

            $patients = $query->latest()->get();
            $structures = Structure::all();

            return response()->json([
                'status'     => 'success',
                'patients'     => $patients,
                'structures' => $structures
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Une erreur est survenue lors de la récupération des patients',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // -----------------------------------------------------
    // Interface de creation des patients
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
            'matricule' => 'ADM' . date('YmdHis') . rand(100, 999), // Génération d'un matricule unique
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => '0',
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
            $user = User::where('role', 0)->find($id);

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
            $user = User::where('role', 0)->find($id);

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
    // ?ise à jour de l'administrateur
    // -----------------------------------------------------
    public function update(Request $request, $id)
    {
        try {
            $user = User::where('role', 0)->find($id);

            if (!$user) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Utilisateur introuvable'
                ], 404);
            }

            $validated = $request->validate([
                'name'       => 'sometimes|string|max:255',
                'email'      => 'sometimes|email|unique:users,email,' . $user->id,
                'birthday'   => 'nullable|date',
                'gender'     => 'nullable|string|in:male,female,other',
                'code_phone' => 'nullable|string|max:10',
                'phone'      => 'nullable|string|max:20',
                'role'       => 'nullable|string|in:0,1,2,3', // adapte selon tes rôles
                'password'   => 'nullable|string|min:6|confirmed',
            ]);

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
        $user = User::where('role', 0)->find($id);

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Utilisateur introuvable'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Utilisateur supprimé avec succès'
        ], 200);
    }

    // -------------------------------------------------------------
    // Telechargement de la listes des patients en format PDF
    // -------------------------------------------------------------
    public function exportPdfApi()
    {
        $users = User::with('structure')->where('role', 0)->get();

        $pdf = Pdf::loadView('Documents.AdminSysteme.listes_patient_pdf', compact('users'))
                ->setPaper('A4', 'portrait');

        $date = now()->format('d-m-Y_His');
        $fileName = "listes_utilisateurs(patients)_$date.pdf";

        return Response::make($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"$fileName\"",
        ]);
    }

    // -------------------------------------------------------------
    // Telechargement de la listes des patients en format Excel
    // -------------------------------------------------------------
    public function exportExcelApi()
    {
        $utilisateurs = User::with('structure')->where('role', 0)
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
        $fileName = "listes_utilisateurs(patients)_$date.xlsx";

        return Excel::download($export, $fileName);
    }
}
