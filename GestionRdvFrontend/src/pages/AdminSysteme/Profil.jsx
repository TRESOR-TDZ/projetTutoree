import React, { useEffect, useState } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Row, Col, Badge, Button, Spinner
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import publicApi from "../../services/publicApi";

export default function Profile() {
  // États
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flashMessage, setFlashMessage] = useState(null);

  // État thème
  const [theme, setTheme] = useState("light");

  // Détecte thème au chargement et sur changement DOM
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Récupérer les informations de l'utilisateur
  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const res = await api.get("/me");
      setUser(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement du profil", err);
      setFlashMessage({ type: "danger", message: "Échec du chargement du profil." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Pour s'assurer que les icônes feather sont remplacées après les mises à jour du DOM
  useEffect(() => {
    feather.replace();
  }, [user, loading, flashMessage]);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Chargement du profil...</p>
          </div>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête avec titre */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="user" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Mon Profil
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Consultez et gérez vos informations personnelles.
              </p>
            </div>
          </div>
        </div>

        {/* Panneau principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="user" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Informations Personnelles
                </span>
              </div>
              <Button 
                variant="primary" 
                className="d-flex align-items-center" 
                as="a" 
                href="/admin-systeme/edit/profil"
              >
                <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Modifier le profil
              </Button>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {user && (
              <Row>
                {/* Section Image de profil */}
                <Col md={4} className="mb-4 mb-md-0">
                  <div className="text-center">
                    <div className="position-relative d-inline-block">
                        <Card.Img
                          src={
                            user.profil
                            ? `${publicApi.defaults.baseURL}/storage/profil/${user.profil}`
                            : `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`
                          }
                          alt="Photo de profil"
                          className="rounded-circle shadow"
                          style={{
                            width: "200px",
                            height: "200px",
                            objectFit: "cover",
                            border: theme === "dark" ? "4px solid #495057" : "4px solid #e9ecef"
                          }}
                        />
                    </div>
                    <div className="mt-3">
                      <h4 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {user.name}
                      </h4>
                      <p className={`mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        {user.email}
                      </p>
                      <Badge 
                        bg={user.email_verified_at ? "success" : "warning"}
                        className="px-3 py-2"
                      >
                        <i 
                          data-feather={user.email_verified_at ? "check-circle" : "clock"}
                          className="me-1" 
                          style={{ width: "12px", height: "12px" }}
                        ></i>
                        {user.email_verified_at ? "Email vérifié" : "Email non vérifié"}
                      </Badge>
                    </div>
                  </div>
                </Col>

                {/* Section Informations */}
                <Col md={8}>
                  <div className="row g-4">
                    {/* Informations personnelles */}
                    <div className="col-12">
                      <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="info" className="me-2 text-primary" style={{ width: "18px", height: "18px" }}></i>
                        Informations personnelles
                      </h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                            <div className="d-flex align-items-center mb-2">
                              <i data-feather="calendar" className="text-primary me-2" style={{ width: "16px", height: "16px" }}></i>
                              <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Date de naissance</small>
                            </div>
                            <span className={theme === "dark" ? "text-light" : "text-dark"}>
                              {formatDate(user.birthday)}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                            <div className="d-flex align-items-center mb-2">
                              <i data-feather="users" className="text-primary me-2" style={{ width: "16px", height: "16px" }}></i>
                              <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Genre</small>
                            </div>
                            <span className={theme === "dark" ? "text-light" : "text-dark"}>
                              {user.gender }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informations de contact */}
                    <div className="col-12">
                      <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="phone" className="me-2 text-success" style={{ width: "18px", height: "18px" }}></i>
                        Contact
                      </h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                            <div className="d-flex align-items-center mb-2">
                              <i data-feather="mail" className="text-success me-2" style={{ width: "16px", height: "16px" }}></i>
                              <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Email</small>
                            </div>
                            <span className={theme === "dark" ? "text-light" : "text-dark"}>
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                            <div className="d-flex align-items-center mb-2">
                              <i data-feather="phone" className="text-success me-2" style={{ width: "16px", height: "16px" }}></i>
                              <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Téléphone</small>
                            </div>
                            <span className={theme === "dark" ? "text-light" : "text-dark"}>
                              {user.code_phone && user.phone 
                                ? `${user.code_phone} ${user.phone}` 
                                : "Non renseigné"
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informations du compte */}
                    <div className="col-12">
                      <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="settings" className="me-2 text-info" style={{ width: "18px", height: "18px" }}></i>
                        Compte
                      </h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                            <div className="d-flex align-items-center mb-2">
                              <i data-feather="calendar" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                              <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Membre depuis</small>
                            </div>
                            <span className={theme === "dark" ? "text-light" : "text-dark"}>
                              {formatDate(user.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                            <div className="d-flex align-items-center mb-2">
                              <i data-feather="clock" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                              <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Dernière modification</small>
                            </div>
                            <span className={theme === "dark" ? "text-light" : "text-dark"}>
                              {formatDate(user.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Message flash (si nécessaire) */}
        {flashMessage && (
          <div className={`alert alert-${flashMessage.type} mt-3`} role="alert">
            {flashMessage.message}
          </div>
        )}
      </Container>
    </AdminSystemeLayout>
  );
}