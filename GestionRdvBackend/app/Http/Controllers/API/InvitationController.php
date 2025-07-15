<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\Invitations;
use App\Models\Invitation;
use App\Models\Structure;
use App\Models\User;
use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class InvitationController extends Controller
{
    public function index()
    {
        try {
            $invitations = Invitation::with('structure') // si la relation est définie
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'message' => 'Liste des invitations envoyées',
                'invitations' => $invitations
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des invitations',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:invitations,email',
            'role' => 'required|string',
            'structure_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Échec de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $token = hash('sha256', Str::random(60));
            // $url = route('invitation.register', $token) . '?email=' . urlencode($request->email);
            $url = 'http://localhost:3000/invitation-register?token=' . $token . '&email=' . urlencode($request->email);


            $structure = Structure::where('matricule', $request->structure_id)->first();
            $roleLabel = $request->role == 1 ? 'Docteur' : 'Administrateur Structure';

            Mail::to($request->email)->send(new Invitations(
                $url,
                $request->email,
                $structure?->nom ?? 'Structure inconnue',
                $roleLabel
            ));

            Invitation::create([
                'matricule' => 'INV' . date('YmdHis') . rand(100, 999),
                'email'        => $request->email,
                'role'         => $request->role,
                'structure_id' => $request->structure_id,
                'token'        => $token,
            ]);

            return response()->json([
                'message' => 'Invitation envoyée avec succès',
                'email'   => $request->email,
                'structure' => $structure?->nom,
                'role'    => $roleLabel,
                'url'     => $url
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l’envoi de l’invitation',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            $invitation = Invitation::findOrFail($id);
            $invitation->delete();

            return response()->json([
                'message' => 'Invitation supprimée avec succès.'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function handleInvitationRegistration(Request $request)
    {
        $invitation = Invitation::where('email', $request->email)
                                    ->where('token', $request->token)
                                    ->first();

        if (!$invitation) {
            return response()->json(['message' => 'Lien invalide ou expiré.'], 404);
        }

        if (User::where('email', $request->email)->exists()) {
            return response()->json(['message' => 'Utilisateur déjà enregistré.'], 409);
        }

        $request->validate([
            'name_first' => 'required',
            'name_last' => 'required',
            'code_phone' => 'required',
            'phone' => 'required',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:Homme,Femme,Autre',
            'password' => 'required|min:6|confirmed',
        ]);

        $prefix = match ($invitation->type) {
            1 => 'DOC',
            2 => 'ADMSTR',
            3 => 'ADMSYS',
            default => 'PAT',
        };

        $matricule = $prefix . date('YmdHis') . rand(100, 999);

        $user = User::create([
            'matricule' => $matricule,
            'name_first' => $request->name_first,
            'name_last' => $request->name_last,
            'email' => $request->email,
            'code_phone' => $request->code_phone,
            'phone' => $request->phone,
            'birth_date' => $request->birth_date,
            'gender' => $request->gender,
            'pays' => 'undefined',
            'ville' => 'undefined',
            'region' => 'undefined',
            'point_reperage' => 'undefined',
            'type' => $invitation->type,
            'structure_id' => $invitation->structure_id,
            'password' => Hash::make($request->password),
        ]);

        $invitation->status = 'Acceptée';
        $invitation->save();

        return response()->json([
            'message' => 'Compte créé avec succès.',
            'user' => $user
        ]);
    }


}
