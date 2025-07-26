<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fiche Personnel - {{ $user->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 0;
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .profile-section {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
            border-left: 5px solid #667eea;
        }

        .profile-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e9ecef;
        }

        .profile-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20px;
            color: white;
            font-size: 32px;
            font-weight: bold;
        }

        .profile-info h2 {
            font-size: 20px;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .profile-info .role-badge {
            background: #667eea;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: bold;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }

        .info-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }

        .info-item .label {
            font-size: 10px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .info-item .value {
            font-size: 13px;
            color: #2c3e50;
            font-weight: 600;
        }

        .section {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 20px;
            border: 1px solid #e9ecef;
        }

        .section-title {
            font-size: 16px;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
            display: flex;
            align-items: center;
        }

        .section-title::before {
            content: "";
            width: 4px;
            height: 20px;
            background: #667eea;
            margin-right: 10px;
            border-radius: 2px;
        }

        .structure-info {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: rgb(0, 0, 0);
            padding: 20px;
            border-radius: 10px;
            text-align: left;
        }

        .structure-info h3 {
            font-size: 18px;
            margin-bottom: 5px;
        }

        .structure-info p {
            opacity: 0.9;
            font-size: 12px;
        }

        .no-structure {
            background: #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
        }

        .system-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
        }

        .system-info .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #e9ecef;
        }

        .system-info .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .system-info .info-row .label {
            font-weight: bold;
            color: #495057;
        }

        .system-info .info-row .value {
            color: #6c757d;
        }

        .footer {
            margin-top: 40px;
            padding: 20px 0;
            border-top: 2px solid #e9ecef;
            text-align: center;
            color: #6c757d;
            font-size: 10px;
        }

        .footer p {
            margin-bottom: 5px;
        }

        .generated-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2196f3;
        }

        .generated-info .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }

        .generated-info .info-row:last-child {
            margin-bottom: 0;
        }

        .page-break {
            page-break-after: always;
        }

        @media print {
            .header {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }

            .structure-info {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>INSTITUT DE SANTÉ</h1>
        <p>Fiche Personnel - Administrateur de Structure</p>
    </div>

    <div class="container">
        <!-- Informations de génération -->
        <div class="generated-info">
            <div class="info-row">
                <span><strong>Document généré le :</strong></span>
                <span>{{ $generated_at }}</span>
            </div>
            <div class="info-row">
                <span><strong>Généré par :</strong></span>
                <span>{{ $generated_by }}</span>
            </div>
        </div>

        <!-- Section Profil Principal -->
        <div class="profile-section">
            <div class="profile-header">
                <div class="profile-avatar">
                    @if($user->profil)
                        <img src="{{ public_path('/storage/profil/' . $user->profil) }}" alt="Photo" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
                    @else
                        {{ strtoupper(substr($user->name, 0, 2)) }}
                    @endif
                </div>
                <div class="profile-info">
                    <h2>{{ $user->name }}</h2>
                    <span class="role-badge">Administrateur de Structure</span>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="label">Email</div>
                    <div class="value">{{ $user->email }}</div>
                </div>

                <div class="info-item">
                    <div class="label">ID Utilisateur</div>
                    <div class="value">#{{ $user->matricule }}</div>
                </div>

                @if($user->phone)
                <div class="info-item">
                    <div class="label">Téléphone</div>
                    <div class="value">{{ $user->code_phone }} {{ $user->phone }}</div>
                </div>
                @endif

                @if($user->birthday)
                <div class="info-item">
                    <div class="label">Date de naissance</div>
                    <div class="value">{{ \Carbon\Carbon::parse($user->birthday)->format('d/m/Y') }}</div>
                </div>
                @endif

                @if($user->gender)
                <div class="info-item">
                    <div class="label">Genre</div>
                    <div class="value">
                        @if($user->gender === 'male')
                            Masculin
                        @elseif($user->gender === 'female')
                            Féminin
                        @else
                            Autre
                        @endif
                    </div>
                </div>
                @endif

                <div class="info-item">
                    <div class="label">Statut</div>
                    <div class="value">Actif</div>
                </div>
            </div>
        </div>

        <!-- Section Structure -->
        <div class="section">
            <h3 class="section-title">Structure Assignée</h3>
            @if($user->structure_id === null)
                <div class="no-structure">
                    ⚠️ Aucune structure assignée
                </div>
            @else
                <div class="structure-info">
                    <h3>{{ $user->structure->nom }} - Matricule: {{ $user->structure->matricule }}</h3>

                    <p>Email: {{ $user->structure->email }} - Adresse: {{ $user->structure->adresse }} - Contact: {{ $user->structure->code_telephone }} {{ $user->structure->telephone }}</p>
                    <p>Horaires: {{ $user->structure->horaires_debut }} - {{ $user->structure->horaires_fin }}</p>
                    <p>Type de structure: {{ $user->structure->type_structure }} - Service: {{ $user->structure->service }}</p>
                </div>
            @endif
        </div>

        <!-- Section Informations Système -->
        <div class="section">
            <h3 class="section-title">Informations Système</h3>
            <div class="system-info">
                <div class="info-row">
                    <span class="label">Date de création :</span>
                    <span class="value">{{ \Carbon\Carbon::parse($user->created_at)->format('d/m/Y à H:i') }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Dernière modification :</span>
                    <span class="value">{{ \Carbon\Carbon::parse($user->updated_at)->format('d/m/Y à H:i') }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Rôle système :</span>
                    <span class="value">Administrateur de Structure (Niveau 2)</span>
                </div>
                @if($user->email_verified_at)
                <div class="info-row">
                    <span class="label">Email vérifié le :</span>
                    <span class="value">{{ \Carbon\Carbon::parse($user->email_verified_at)->format('d/m/Y à H:i') }}</span>
                </div>
                @else
                <div class="info-row">
                    <span class="label">Statut email :</span>
                    <span class="value" style="color: #1de438;">Vérifié</span>
                </div>
                @endif
            </div>
        </div>

        <!-- Section Permissions et Responsabilités -->
        <div class="section">
            <h3 class="section-title">Permissions et Responsabilités</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h4 style="color: #495057; margin-bottom: 10px;">Droits d'accès :</h4>
                <ul style="margin-left: 20px; color: #6c757d;">
                    <li>Gestion des utilisateurs de sa structure</li>
                    <li>Consultation des données de sa structure</li>
                    <li>Génération de rapports structurels</li>
                    <li>Gestion des paramètres de sa structure</li>
                    <li>Supervision des activités utilisateurs</li>
                </ul>

                <h4 style="color: #495057; margin: 15px 0 10px 0;">Restrictions :</h4>
                <ul style="margin-left: 20px; color: #6c757d;">
                    <li>Accès limité à sa structure uniquement</li>
                    <li>Pas d'accès aux paramètres système globaux</li>
                    <li>Pas de gestion d'autres structures</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Institut de Santé - Système de Gestion</strong></p>
        <p>Ce document a été généré automatiquement le {{ $generated_at }}</p>
        <p>Document confidentiel - Usage interne uniquement</p>
    </div>
</body>
</html>
