import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Row, Col, Button, Badge, Spinner, Alert, Image
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import publicApi from "../../services/publicApi";

export default function PatientShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Récupération des détails du patient
  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin-systeme/show/patient/${id}`);
        if (res.data.status === 'success') {
          setPatient(res.data.user);
        } else {
          setError(res.data.message || "Erreur lors du chargement des données");
        }
      } catch (err) {
        console.error("Erreur lors du chargement du patient", err);
        if (err.response?.status === 404) {
          setError("Patient introuvable");
        } else {
          setError("Erreur lors du chargement des données du patient");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  // Pour s'assurer que les icônes feather sont remplacées après les mises à jour du DOM
  useEffect(() => {
    feather.replace();
  }, [patient, loading, error]);

  const formatDate = (dateString) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Connecté": return "success";
      case "Déconnecté": return "secondary";
      case "En attente": return "warning";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Connecté": return "check-circle";
      case "Déconnecté": return "x-circle";
      case "En attente": return "clock";
      default: return "help-circle";
    }
  };

  // Fonction pour générer l'avatar par défaut avec les initiales
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Chargement des détails du patient...</p>
          </div>
        </Container>
      </AdminSystemeLayout>
    );
  }

  if (error) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4">
          <Alert variant="danger" className="text-center">
            <i data-feather="alert-triangle" className="me-2"></i>
            {error}
            <div className="mt-3">
              <Button variant="outline-primary" onClick={() => navigate('/admin-systeme/view/patient')}>
                <i data-feather="arrow-left" className="me-2"></i>
                Retour à la liste
              </Button>
            </div>
          </Alert>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête avec navigation */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                className="me-3"
                onClick={() => navigate('/admin-systeme/view/patient')}
              >
                <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Retour
              </Button>
              
              {/* Photo de profil dans l'en-tête */}
              <div className="me-3 position-relative">
                {patient?.profil ? (
                  <Image 
                    src={patient.profil} 
                    alt={`Photo de profil de ${patient?.name}`}
                    roundedCircle 
                    width="60" 
                    height="60"
                    className="object-fit-cover border border-3 border-primary"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`d-flex align-items-center justify-content-center rounded-circle border border-3 border-primary ${theme === "dark" ? "bg-primary bg-opacity-25 text-primary" : "bg-primary bg-opacity-10 text-primary"}`}
                  style={{ 
                    width: "60px", 
                    height: "60px", 
                    fontSize: "1.2rem", 
                    fontWeight: "600",
                    display: patient?.profil ? "none" : "flex"
                  }}
                >
                  {getInitials(patient?.name)}
                </div>
              </div>
              
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  {patient?.name || "Patient"}
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Informations complètes du patient
                </p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-warning"
                onClick={() => navigate(`/admin-systeme/edit/patient/${patient.id}`)}
              >
                <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Modifier
              </Button>
            </div>
          </div>
        </div>

        <Row>
          {/* Carte principale des informations */}
          <Col lg={8}>
            <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex align-items-center">
                  <i data-feather="user" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                  <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Informations Personnelles
                  </span>
                </div>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                {/* Photo de profil dans la carte */}
                <Row className="g-4">
                  <Col md={12}>
                    <div className="mb-4 text-center">
                      <div className="position-relative d-inline-block">
                        {patient?.profil ? (
                          <Image 
                            src={
                                patient.profil
                                ? `${publicApi.defaults.baseURL}/storage/profil/${patient.profil}`
                                : `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`
                            }
                            alt={`Photo de profil de ${patient?.name}`}
                            roundedCircle 
                            width="120" 
                            height="120"
                            className="object-fit-cover border border-4 border-primary shadow"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                        <div 
                          className={`d-flex align-items-center justify-content-center rounded-circle border border-4 border-primary shadow ${theme === "dark" ? "bg-primary bg-opacity-25 text-primary" : "bg-primary bg-opacity-10 text-primary"}`}
                          style={{ 
                            width: "120px", 
                            height: "120px", 
                            fontSize: "2.5rem", 
                            fontWeight: "600",
                            display: patient?.profil ? "none" : "flex"
                          }}
                        >
                          {getInitials(patient?.name)}
                        </div>
                          )}
                      </div>
                      <div className="mt-3">
                        <h4 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {patient?.name || "Non renseigné"}
                        </h4>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          Patient #{patient?.matricule}
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row className="g-4">
                  <Col md={6}>
                    <div className="mb-3">
                      <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        <i data-feather="mail" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Email
                      </label>
                      <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {patient?.email || "Non renseigné"}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        <i data-feather="phone" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Téléphone
                      </label>
                      <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {patient?.code_phone && patient?.phone 
                          ? `${patient.code_phone} ${patient.phone}` 
                          : "Non renseigné"}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        <i data-feather="tag" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Genre
                      </label>
                      <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {patient?.gender || "Non spécifié"}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Date de naissance
                      </label>
                      <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {formatDate(patient?.birthday)}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        <i data-feather="building" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Structure associée
                      </label>
                      <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {patient?.structure?.nom || "Non assignée"}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Barre latérale avec statut et actions */}
          <Col lg={4}>
            {/* Carte de statut */}
            <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex align-items-center">
                  <i data-feather="activity" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                  <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Statut du Compte
                  </span>
                </div>
              </Card.Header>
              <Card.Body className={`text-center ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="mb-3">
                  <Badge 
                    bg={getStatusVariant(patient?.status)}
                    className="px-4 py-3 rounded-pill"
                    style={{ fontSize: "0.9rem" }}
                  >
                    <i 
                      data-feather={getStatusIcon(patient?.status)}
                      className="me-2"
                      style={{ width: "16px", height: "16px" }}
                    ></i>
                    {patient?.status || "Indéfini"}
                  </Badge>
                </div>
                <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Dernière connexion : {formatDate(patient?.updated_at)}
                </div>
              </Card.Body>
            </Card>

            {/* Carte d'informations système */}
            <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex align-items-center">
                  <i data-feather="info" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                  <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Informations Système
                  </span>
                </div>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <div className="mb-3">
                  <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="hash" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    ID Patient
                  </label>
                  <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    #{patient?.matricule}
                  </div>
                </div>
                <div className="mb-3">
                  <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="user-plus" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Créé le
                  </label>
                  <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {formatDate(patient?.created_at)}
                  </div>
                </div>
                <div className="mb-3">
                  <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="edit" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Modifié le
                  </label>
                  <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {formatDate(patient?.updated_at)}
                  </div>
                </div>
                <div>
                  <label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="shield" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Rôle
                  </label>
                  <div className={`mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <Badge bg="info" className="px-2 py-1">
                      Patient
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Actions rapides */}
            <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex align-items-center">
                  <i data-feather="settings" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                  <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Actions Rapides
                  </span>
                </div>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-warning"
                    className="d-flex align-items-center justify-content-center"
                    onClick={() => navigate(`/admin-systeme/edit/patient/${patient.id}`)}
                  >
                    <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Modifier les informations
                  </Button>
                  <Button 
                    variant="outline-info"
                    className="d-flex align-items-center justify-content-center"
                  >
                    <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Envoyer un email
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    className="d-flex align-items-center justify-content-center"
                  >
                    <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Exporter les données
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminSystemeLayout>
  );
}