<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Liste des Administrateurs de structure de la plateforme</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #2c3e50;
            background: #fff;
            font-size: 13px;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #5e60ce;
            margin-bottom: 20px;
            padding-bottom: 10px;
        }

        header img {
            height: 60px;
        }

        header h2 {
            color: #5e60ce;
            margin: 0;
        }

        .date {
            font-size: 12px;
            color: #7f8c8d;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        th, td {
            padding: 8px;
            border: 1px solid #dee2e6;
            text-align: left;
        }

        th {
            background-color: #5e60ce;
            color: white;
        }

        tr:nth-child(even) {
            background-color: #f3f4f6;
        }

        footer {
            position: fixed;
            bottom: 0;
            text-align: center;
            font-size: 11px;
            color: #888;
            width: 100%;
        }
    </style>
</head>
<body>

    <header>
        {{--  <img src="{{ public_path('Application/logo/logo1.png') }}" alt="Logo">  --}}
        <h2>Liste des Administrateurs de structure de la plateforme</h2>
        <p class="date">Généré le {{ \Carbon\Carbon::now()->format('d/m/Y à H:i') }}</p>
    </header>

    <table>
        <thead>
            <tr>
                <th>Nom & Prénom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Genre</th>
                <th>Structure</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($users as $user)
                <tr>
                    <td>{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td>{{ $user->code_phone }} {{ $user->phone }}</td>
                    <td>{{ $user->gender ?? 'N/A' }}</td>
                    <td>{{ $user->structure?->nom ?? 'Non assignée' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <footer>
        Plateforme de suivi medical &copy; {{ date('Y') }}
    </footer>

</body>
</html>
