<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Structure;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class GestionDashboardAdminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $year = $request->get('year', 'all');

            // Appliquer le filtre d'année si spécifié
            $userQuery = User::query();
            $structureQuery = Structure::query();

            if ($year !== 'all') {
                $userQuery->whereYear('created_at', $year);
                $structureQuery->whereYear('created_at', $year);
            }

            // Nombre total de structures
            $totalStructures = $structureQuery->count();

            // Nombre d'utilisateurs par type
            $usersByRole = $userQuery->select('role', DB::raw('COUNT(*) as total'))
                ->groupBy('role')
                ->get()
                ->mapWithKeys(function ($item) {
                    $roleNames = [
                        0 => 'Patients',
                        1 => 'Docteurs',
                        2 => 'Admin Structures',
                        3 => 'Admin Système'
                    ];
                    return [$roleNames[$item->role] => $item->total];
                });

            $structuresWithUsers = Structure::select('id', 'nom as nom_structure', 'type_structure', 'matricule')
                ->withCount([
                    'adminStructures as admin_count' => fn($q) => $year === 'all' ? null : $q->whereYear('created_at', $year),
                    'docteurs as doctor_count'       => fn($q) => $year === 'all' ? null : $q->whereYear('created_at', $year),
                ])
                ->when($year !== 'all', fn($q) => $q->whereYear('created_at', $year))
                ->get();

            // Évolution mensuelle des inscriptions par type d'utilisateur
            $monthlyEvolution = collect();
            if ($year === 'all') {
                // Si "Tout" est sélectionné, prendre l'année actuelle
                $targetYear = date('Y');
            } else {
                $targetYear = $year;
            }

            for ($month = 1; $month <= 12; $month++) {
                $monthData = [
                    'month' => sprintf('%04d-%02d', $targetYear, $month),
                    'patients' => User::where('role', 0)
                        ->whereYear('created_at', $targetYear)
                        ->whereMonth('created_at', $month)
                        ->count(),
                    'docteurs' => User::where('role', 1)
                        ->whereYear('created_at', $targetYear)
                        ->whereMonth('created_at', $month)
                        ->count(),
                    'admin_structures' => User::where('role', 2)
                        ->whereYear('created_at', $targetYear)
                        ->whereMonth('created_at', $month)
                        ->count(),
                    'admin_systeme' => User::where('role', 3)
                        ->whereYear('created_at', $targetYear)
                        ->whereMonth('created_at', $month)
                        ->count(),
                ];
                $monthlyEvolution->push($monthData);
            }

            // Années disponibles
            $availableYears = ['all'];
            $currentYear = date('Y');
            for ($i = 0; $i < 6; $i++) {
                $availableYears[] = (string)($currentYear - $i);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_structures' => $totalStructures,
                    'users_by_role' => $usersByRole,
                    'structures_with_users' => $structuresWithUsers,
                    'monthly_evolution' => $monthlyEvolution,
                    'available_years' => $availableYears,
                    'current_year' => $year,
                    'evolution_year' => $targetYear
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données du tableau de bord',
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
