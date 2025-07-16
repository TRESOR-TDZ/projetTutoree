<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string',
            'email'    => 'required|email|unique:users',
            'role'     => 'nullable',
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
                'status' => 'error',
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'matricule' => 'PAT' . date('YmdHis') . rand(100, 999),
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role ?? 0,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Inscription réussie',
            'user' => [
                'matricule' => $user->matricule,
                'email' => $user->email,
                'name'  => $user->name,
                'role'  => $user->role,
            ]
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        // Validation manuelle avec message d’erreurs JSON
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Identifiants invalides'
            ], 401);
        }

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Connexion réussie',
            'data' => [
                'token' => $token,
                'user'  => $user,
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Deconnexion reussie']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'       => 'sometimes|string|max:255',
            'email'      => 'sometimes|email|unique:users,email,' . $user->id,
            'birthday'   => 'nullable|date',
            'gender'     => 'nullable|string|in:male,female,other',
            'code_phone' => 'nullable|string|max:10',
            'phone'      => 'nullable|string|max:20',
            'password'   => 'nullable|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Hash du mot de passe s’il est présent
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Informations mises à jour avec succès',
            'data' => [
                'user' => $user
            ]
        ]);
    }

}
