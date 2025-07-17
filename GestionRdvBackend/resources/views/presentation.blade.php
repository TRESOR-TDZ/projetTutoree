<!DOCTYPE html>
<html lang="fr" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Suivi Médical – Bienvenue</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #4f46e5, #3b82f6);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        header {
            padding: 2rem 1rem;
            text-align: center;
        }
        .main-content {
            flex: 1;
            padding: 2rem 1rem;
            background-color: white;
            color: #2c3e50;
            border-top-left-radius: 30px;
            border-top-right-radius: 30px;
        }
        .feature-icon {
            font-size: 2.5rem;
            color: #4f46e5;
        }
        footer {
            padding: 1rem;
            text-align: center;
            font-size: 0.9rem;
            color: #e0e0e0;
        }
    </style>
</head>
<body>
    <header>
        <h1 class="fw-bold">Bienvenue sur l’API de Suivi Médical</h1>
        <p class="lead">Plateforme centralisée pour la gestion des patients, consultations, et téléservices médicaux.</p>
        <a href="https://laravel.com/docs/12.x/eloquent-resources" class="btn btn-light btn-lg mt-3">
            <i class="bi bi-book me-2"></i> Consulter la documentation
        </a>
    </header>

    <div class="main-content container">
        <div class="row text-center mb-5">
            <div class="col-md-4 mb-4">
                <div class="feature-icon mb-3"><i class="bi bi-person-badge"></i></div>
                <h5>Prise de rendez-vous</h5>
                <p class="text-muted">Création, suivi, et historique complet des rendez-vous.</p>
            </div>
            <div class="col-md-4 mb-4">
                <div class="feature-icon mb-3"><i class="bi bi-calendar-check"></i></div>
                <h5>Consultation</h5>
                <p class="text-muted">Consultations physiques ou téléconsultations avec notifications.</p>
            </div>
            <div class="col-md-4 mb-4">
                <div class="feature-icon mb-3"><i class="bi bi-shield-lock"></i></div>
                <h5>Sécurité & authentification</h5>
                <p class="text-muted">API sécurisée avec authentification par tokens et rôles utilisateurs.</p>
            </div>
        </div>

        <div class="text-center">
            <h4 class="fw-bold">Commencer avec l’API</h4>
            <p class="text-muted">Utilisez l’authentification via Laravel Sanctum ou Passport selon vos besoins.</p>
            <a href="http://localhost:3000/login" class="btn btn-outline-primary mt-2">
                <i class="bi bi-box-arrow-in-right me-1"></i> Se connecter
            </a>
            <a href="http://localhost:3000/register" class="btn btn-outline-success mt-2 ms-2">
                <i class="bi bi-person-plus me-1"></i> Créer un compte
            </a>
        </div>
    </div>

    <footer>
        &copy; {{ date('Y') }} API Suivi Médical – Tous droits réservés.
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
