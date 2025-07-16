<?php

use App\Http\Controllers\API\Admin\GestionAdminController;
use App\Http\Controllers\API\Admin\GestionPatientController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\InvitationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

Route::get('/welcome', fn() => response()->json(['message' => 'Acceuil General']))->name('welcome');;

// Validation de l'invitation envoyée
Route::post('/register-invitation', [InvitationController::class, 'handleInvitationRegistration']);


Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/login',    [AuthController::class, 'login'])->name('login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',     [AuthController::class, 'me']);
    Route::put('/me/update', [AuthController::class, 'update']);

    Route::post('/logout',[AuthController::class, 'logout'])->name('logout');

    // Admin uniquement (role = 3)
    Route::middleware('role:3')->group(function () {
        Route::get('/admin-systeme/dashboard', fn() => response()->json(['message' => 'Bienvenue Admin']));

        // Gestion Admin systeme
        Route::get('/admin-systeme/view/admin-systeme', [GestionAdminController::class, 'index'])->name('admin-systeme.index');           // Liste des admin systeme
        Route::get('/admin-systeme/show/admin-systeme/{id}', [GestionAdminController::class, 'show'])->name('admin-systeme.show');         // Voir un admin
        Route::post('/admin-systeme/store/admin-systeme', [GestionAdminController::class, 'store'])->name('admin-systeme.store');          // Ajouter un admin
        Route::put('/admin-systeme/update/admin-systeme/{id}', [GestionAdminController::class, 'update'])->name('admin-systeme.update');     // Modifier un admin
        Route::delete('/admin-systeme/destroy/admin-systeme/{id}', [GestionAdminController::class, 'destroy'])->name('admin-systeme.destroy');// Supprimer un admin
        Route::get('/admin-systeme/edit/admin-systeme/{id}', [GestionAdminController::class, 'edit'])->name('admin-systeme.edit');    // (optionnel) Formulaire d'édition

        Route::get('/admin-systeme/download/liste/admin-systeme/excel', [GestionAdminController::class, 'exportExcelApi']);
        Route::get('/admin-systeme/download/liste/admin-systeme/pdf', [GestionAdminController::class, 'exportPdfApi']);

        // Gestion Patient
        Route::get('/admin-systeme/view/patient', [GestionPatientController::class, 'index'])->name('admin-systeme.index');           // Liste des admin systeme
        Route::get('/admin-systeme/show/patient/{id}', [GestionPatientController::class, 'show'])->name('admin-systeme.show');         // Voir un admin
        Route::post('/admin-systeme/store/patient', [GestionPatientController::class, 'store'])->name('admin-systeme.store');          // Ajouter un admin
        Route::put('/admin-systeme/update/patient/{id}', [GestionPatientController::class, 'update'])->name('admin-systeme.update');     // Modifier un admin
        Route::delete('/admin-systeme/destroy/patient/{id}', [GestionPatientController::class, 'destroy'])->name('admin-systeme.destroy');// Supprimer un admin
        Route::get('/admin-systeme/edit/patient/{id}', [GestionPatientController::class, 'edit'])->name('admin-systeme.edit');    // (optionnel) Formulaire d'édition

        Route::get('/admin-systeme/download/liste/patient/excel', [GestionPatientController::class, 'exportExcelApi']);
        Route::get('/admin-systeme/download/liste/patient/pdf', [GestionPatientController::class, 'exportPdfApi']);

        // Invitation
        Route::get('/admin-systeme/view/invitations', [InvitationController::class, 'index'])->name('invitation');
        Route::post('admin-systeme/invitation/users', [InvitationController::class, 'store'])->name('invitations.store');
        Route::delete('/admin-systeme/destroy/invitations/{id}', [InvitationController::class, 'destroy'])->name('invitations.destroy');

    });

    // Admin Structure uniquement (role = 2)
    Route::middleware('role:2')->group(function () {
        Route::get('/admin-structure/dashboard', fn() => response()->json(['message' => 'Bienvenue Docteur']));
    });

    // Docteur uniquement (role = 1)
    Route::middleware('role:1')->group(function () {
        Route::get('/doctor/dashboard', fn() => response()->json(['message' => 'Bienvenue Docteur']));
    });

    // Patient uniquement (role = 0)
    Route::middleware('role:0')->group(function () {
        Route::get('/patient/dashboard', fn() => response()->json(['message' => 'Bienvenue Patient']));
    });

});
