import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Button, Row, Col, Badge, Alert, Spinner
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import publicApi from "../../services/publicApi";

export default function ShowAdminSysteme() {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Chargement des données utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await api.get(`/admin-systeme/show/admin-systeme/${id}`);
        setUser(response.data.user);

      } catch (err) {
        console.error("Erreur lors du chargement des données", err);
        if (err.response?.status === 404) {
          setError("Administrateur système introuvable");
        } else {
          setError("Erreur lors du chargement des données");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  useEffect(() => {
    feather.replace();
  }, [loading, user]);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Fonction pour formater le genre
  const formatGender = (gender) => {
    switch (gender) {
      case "male": return "Masculin";
      case "female": return "Féminin";
      case "other": return "Autre";
      default: return "Non renseigné";
    }
  };

  // Fonction pour obtenir le statut
  const getStatusInfo = () => {
    if (!user) return { variant: "secondary", text: "Inconnu", icon: "help-circle" };
    
    // Vous pouvez adapter cette logique selon vos besoins
    if (user.email_verified_at) {
      return { variant: "success", text: "Actif", icon: "check-circle" };
    } else {
      return { variant: "warning", text: "En attente", icon: "clock" };
    }
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4 text-center">
          <Spinner animation="border" variant="primary" />
          <div className={`mt-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
            Chargement des données...
          </div>
        </Container>
      </AdminSystemeLayout>
    );
  }

  if (error) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4 text-center">
          <Alert variant="danger">
            <i data-feather="alert-triangle" className="me-2"></i>
            {error}
          </Alert>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate("/admin-systeme/view/admin-systeme")}
          >
            <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Retour à la liste
          </Button>
        </Container>
      </AdminSystemeLayout>
    );
  }

  if (!user) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4 text-center">
          <Alert variant="warning">
            <i data-feather="alert-triangle" className="me-2"></i>
            Administrateur système introuvable
          </Alert>
        </Container>
      </AdminSystemeLayout>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête avec navigation */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center">
              <Button
                variant="outline-secondary"
                className="me-3"
                onClick={() => navigate("/admin-systeme/view/admin-systeme")}
              >
                <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Retour
              </Button>
              
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                <i data-feather="eye" className="text-info" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Détails de l'Administrateur Système
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Informations complètes de {user.name}
                </p>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button
                variant="outline-warning"
                className="d-flex align-items-center"
                onClick={() => navigate(`/admin-systeme/edit/admin-systeme/${user.id}`)}
              >
                <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Modifier
              </Button>
            </div>
          </div>
        </div>

        <Row className="g-4">
          {/* Carte principale avec photo et informations de base */}
          <Col lg={4}>
            <Card className={`shadow-sm border-0 h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="mb-4">
                  {user.profil ? (
                    <img
                      src={`${publicApi.defaults.baseURL}/storage/profil/${user.profil}`}
                      alt="Profil"
                      className="rounded-circle border shadow-sm"
                      style={{ width: "150px", height: "150px", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center border mx-auto"
                         style={{ width: "150px", height: "150px" }}>
                      <i data-feather="user" style={{ width: "60px", height: "60px" }}></i>
                    </div>
                  )}
                </div>

                <h4 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  {user.name}
                </h4>
                
                <div className="mb-3">
                  <Badge bg={statusInfo.variant} className="px-3 py-2">
                    <i data-feather={statusInfo.icon} className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    {statusInfo.text}
                  </Badge>
                </div>

                <div className="text-start">
                  <div className={`d-flex align-items-center mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    <span className="small">{user.email}</span>
                  </div>
                  
                  {user.phone && (
                    <div className={`d-flex align-items-center mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <i data-feather="phone" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      <span className="small">{user.code_phone || ""} {user.phone}</span>
                    </div>
                  )}

                  <div className={`d-flex align-items-center mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="shield" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    <span className="small">Administrateur Système</span>
                  </div>

                  <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    <span className="small">Créé le {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Informations détaillées */}
          <Col lg={8}>
            <div className="d-flex flex-column gap-4 h-100">
              {/* Informations personnelles */}
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <div className="d-flex align-items-center">
                    <i data-feather="user" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Informations personnelles
                    </span>
                  </div>
                </Card.Header>
                <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                  <Row className="g-4">
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Nom complet
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {user.name || "Non renseigné"}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Date de naissance
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {formatDate(user.birthday)}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Genre
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {formatGender(user.gender)}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Adresse email
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {user.email}
                          {user.email_verified_at && (
                            <Badge bg="success" className="ms-2">
                              <i data-feather="check" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                              Vérifié
                            </Badge>
                          )}
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Informations de contact */}
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <div className="d-flex align-items-center">
                    <i data-feather="phone" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Informations de contact
                    </span>
                  </div>
                </Card.Header>
                <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                  <Row className="g-4">
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Code pays
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {user.code_phone || "Non renseigné"}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Numéro de téléphone
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {user.phone || "Non renseigné"}
                        </p>
                      </div>
                    </Col>
                    {(user.code_phone && user.phone) && (
                      <Col md={12}>
                        <div>
                          <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                            Numéro complet
                          </label>
                          <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {user.code_phone} {user.phone}
                          </p>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

              {/* Informations système */}
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <div className="d-flex align-items-center">
                    <i data-feather="settings" className="text-info me-2" style={{ width: "20px", height: "20px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Informations système
                    </span>
                  </div>
                </Card.Header>
                <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                  <Row className="g-4">
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Structure d'affectation
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {user.structure?.nom || "Non assignée"}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          ID Utilisateur
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          #{user.id}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Date de création
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"} text-uppercase`}>
                          Dernière modification
                        </label>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {formatDate(user.updated_at)}
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        {/* Actions rapides */}
        <Card className={`shadow-sm border-0 mt-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body className={`text-center ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>Actions rapides</h6>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => navigate(`/admin-systeme/edit/admin-systeme/${user.id}`)}
                className="d-flex align-items-center"
              >
                <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Modifier
              </Button>
              
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate("/admin-systeme/view/admin-systeme")}
                className="d-flex align-items-center"
              >
                <i data-feather="list" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Voir la liste
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </AdminSystemeLayout>
  );
}