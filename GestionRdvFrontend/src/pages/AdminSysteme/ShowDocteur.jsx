import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, Modal
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import publicApi from "../../services/publicApi";

export default function DocteurShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États
  const [docteur, setDocteur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flashMessage, setFlashMessage] = useState("");

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

  // Charger les détails du docteur
  useEffect(() => {
    const fetchDocteurDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/admin-systeme/show/docteur/${id}`);
        
        if (response.data.status === "success") {
          setDocteur(response.data.user);
        } else {
          setError(response.data.message || "Erreur lors du chargement");
        }
      } catch (err) {
        console.error("Erreur lors du chargement du docteur:", err);
        if (err.response?.status === 404) {
          setError("Docteur non trouvé");
        } else {
          setError("Erreur lors du chargement des données");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocteurDetails();
    }
  }, [id]);

  useEffect(() => {
    feather.replace();
  }, [docteur]);

  // Suppression du docteur
  const handleDelete = async () => {
    try {
      await api.delete(`/admin-systeme/destroy/docteur/${id}`);
      setFlashMessage("Docteur supprimé avec succès");
      setTimeout(() => {
        navigate("/admin-systeme/view/docteur");
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setError("Erreur lors de la suppression");
    } finally {
      setShowDeleteModal(false);
    }
  };

  // Formatage des dates
  const formatDate = (dateString) => {
    if (!dateString) return "Non renseigné";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Calcul de l'âge
  const calculateAge = (birthday) => {
    if (!birthday) return "Non renseigné";
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} ans`;
  };

  // URL de l'image de profil
  const getProfileImageUrl = (profil) => {
    if (!profil) return `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`;
    return `${publicApi.defaults.baseURL}/storage/profil/${profil}`;
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Chargement des détails...</p>
        </Container>
      </AdminSystemeLayout>
    );
  }

  if (error) {
    return (
      <AdminSystemeLayout>
        <Container className="py-5">
          <Alert variant="danger" className="text-center">
            <i data-feather="alert-circle" className="me-2"></i>
            {error}
          </Alert>
          <div className="text-center">
            <Button variant="primary" onClick={() => navigate("/admin-systeme/view/docteur")}>
              <i data-feather="arrow-left" className="me-2"></i>
              Retour à la liste
            </Button>
          </div>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className={`py-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
        {/* En-tête avec navigation */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <Button 
              variant={theme === "dark" ? "outline-light" : "outline-secondary"}
              className="me-3"
              onClick={() => navigate("/admin-systeme/view/docteur")}
            >
              <i data-feather="arrow-left" style={{ width: "16px", height: "16px" }}></i>
            </Button>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Profil du Docteur
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Informations détaillées
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={() => navigate(`/admin-systeme/edit/doctor/${docteur.id}`)}
            >
              <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Modifier
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Supprimer
            </Button>
          </div>
        </div>

        <Row className="g-4">
          {/* Colonne gauche - Informations principales */}
          <Col lg={4}>
            <Card className={`shadow-sm border-0 h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                {/* Photo de profil */}
                <div className="mb-4">
                  <div 
                    className="rounded-circle mx-auto mb-3 overflow-hidden"
                    style={{ 
                      width: "120px", 
                      height: "120px",
                      border: `3px solid ${theme === "dark" ? "#6c757d" : "#dee2e6"}`
                    }}
                  >
                    <img
                      src={getProfileImageUrl(docteur.profil)}
                      alt="Profil"
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => {
                        e.target.src = `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`;
                      }}
                    />
                  </div>
                  
                  {/* Nom et statut */}
                  <h4 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {docteur.name}
                  </h4>
                  
                  <Badge
                    bg={
                      docteur.status === "Connecté"
                        ? "success"
                        : docteur.status === "Déconnecté"
                        ? "secondary"
                        : "warning"
                    }
                    className="mb-3 px-3 py-2"
                  >
                    <i 
                      data-feather={
                        docteur.status === "Connecté" 
                          ? "wifi" 
                          : docteur.status === "Déconnecté" 
                          ? "wifi-off" 
                          : "clock"
                      } 
                      className="me-2" 
                      style={{ width: "14px", height: "14px" }}
                    ></i>
                    {docteur.status || "Indéfini"}
                  </Badge>
                </div>

                {/* Informations de contact rapides */}
                <div className="text-start">
                  <div className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="mail" className="me-2 text-primary" style={{ width: "16px", height: "16px" }}></i>
                    <small>{docteur.email}</small>
                  </div>
                  
                  {docteur.phone && (
                    <div className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="phone" className="me-2 text-success" style={{ width: "16px", height: "16px" }}></i>
                      <small>{docteur.code_phone} {docteur.phone}</small>
                    </div>
                  )}

                  {docteur.structure && (
                    <div className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="building" className="me-2 text-info" style={{ width: "16px", height: "16px" }}></i>
                      <small>{docteur.structure.nom}</small>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Colonne droite - Détails complets */}
          <Col lg={8}>
            <div className="d-flex flex-column gap-4">
              
              {/* Informations personnelles */}
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="user" className="me-2 text-primary" style={{ width: "20px", height: "20px" }}></i>
                    Informations Personnelles
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Nom complet :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>{docteur.name}</span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Genre :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>
                          {docteur.gender === "male" ? "Masculin" : 
                           docteur.gender === "female" ? "Féminin" : 
                           docteur.gender === "other" ? "Autre" : "Non spécifié"}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Date de naissance :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>{formatDate(docteur.birthday)}</span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Âge :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>{calculateAge(docteur.birthday)}</span>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Informations de contact */}
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="phone" className="me-2 text-success" style={{ width: "20px", height: "20px" }}></i>
                    Informations de Contact
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Email :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>{docteur.email}</span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Téléphone :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>
                          {docteur.phone ? `${docteur.code_phone} ${docteur.phone}` : "Non renseigné"}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Informations professionnelles */}
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="briefcase" className="me-2 text-info" style={{ width: "20px", height: "20px" }}></i>
                    Informations Professionnelles
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Spécialité :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>
                          {docteur.speciality || "Non spécifiée"}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Structure :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>
                          {docteur.structure?.nom || "Non assignée"}
                        </span>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Statut du compte :</span>
                        <Badge
                          bg={
                            docteur.status === "Connecté"
                              ? "success"
                              : docteur.status === "Déconnecté"
                              ? "secondary"
                              : "warning"
                          }
                        >
                          {docteur.status || "Indéfini"}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Informations système */}
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="settings" className="me-2 text-warning" style={{ width: "20px", height: "20px" }}></i>
                    Informations Système
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>ID utilisateur :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>{docteur.id}</span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Rôle :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>
                          Docteur (Role {docteur.role})
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Créé le :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>
                          {formatDate(docteur.created_at)}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex justify-content-between">
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Dernière mise à jour :</span>
                        <span className={theme === "dark" ? "text-light" : "text-muted"}>
                          {formatDate(docteur.updated_at)}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        {/* Modal de confirmation de suppression */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>
              <i data-feather="alert-triangle" className="me-2 text-warning"></i>
              Confirmation de suppression
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Êtes-vous sûr de vouloir supprimer le docteur <strong>{docteur.name}</strong> ?</p>
            <p className="text-danger small">
              <i data-feather="info" className="me-1"></i>
              Cette action est irréversible.
            </p>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <i data-feather="trash-2" className="me-2"></i>
              Supprimer définitivement
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de message flash */}
        <Modal
          show={!!flashMessage}
          centered
          backdrop="static"
          keyboard={false}
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Body className="text-center">
            <i
              data-feather="check-circle"
              className="text-success"
              style={{ width: "40px", height: "40px" }}
            ></i>
            <h5 className={`mt-3 ${theme === "dark" ? "text-light" : ""}`}>{flashMessage}</h5>
          </Modal.Body>
        </Modal>
      </Container>
    </AdminSystemeLayout>
  );
}