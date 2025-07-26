import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import feather from "feather-icons";

export default function Welcome() {
  useEffect(() => {
    feather.replace();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Navbar styled like your dashboards */}
      <nav className="navbar navbar-expand-lg bg-white dark:bg-dark shadow-sm px-4 py-3">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-dark dark:text-white">
            Gestion Rendez-vous
          </span>

          <div className="ms-auto d-flex gap-2">
            <Link to="/login" className="btn btn-outline-primary">
              <i data-feather="log-in" className="me-1" />
              Connexion
            </Link>
            <Link to="/register" className="btn btn-primary">
              <i data-feather="user-plus" className="me-1" />
              Inscription
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <div className="d-flex justify-content-center align-items-center flex-column text-center py-5 px-3">
        <div className="card shadow-lg rounded-4 p-5 bg-white dark:bg-gray-900 text-dark dark:text-white" style={{ maxWidth: "500px" }}>
          <h2 className="fw-bold mb-3">Bienvenue !</h2>
          <p className="text-muted dark:text-gray-300 mb-4">
            Gérer vos rendez-vous médicaux en toute simplicité.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/login" className="btn btn-outline-primary">
              <i data-feather="log-in" className="me-1" />
              Connexion
            </Link>
            <Link to="/register" className="btn btn-primary">
              <i data-feather="user-plus" className="me-1" />
              Inscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
