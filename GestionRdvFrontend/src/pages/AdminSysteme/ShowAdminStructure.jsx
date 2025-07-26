import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Button, Row, Col, Card, Alert, Spinner, Badge, Modal
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import publicApi from "../../services/publicApi";

export default function ShowAdminStructure() {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [flashMessage, setFlashMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // État du thème
  const [theme, setTheme] = useState("light");

  // Détection du thème
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

  // Chargement des données
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/admin-systeme/show/admin-structure/${id}`);
        setAdmin(response.data.user);
      } catch (err) {
        console.error("Erreur lors du chargement des données", err);
        if (err.response?.status === 404) {
          setFlashMessage("Administrateur introuvable");
        } else {
          setFlashMessage("Erreur lors du chargement des données");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [id]);

  useEffect(() => {
    feather.replace();
  }, [admin, loading]);

  // Fonction pour télécharger le PDF
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      const response = await api.get(`/admin-systeme/download-pdf/admin-structure/${id}`, {
        responseType: 'blob',
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fiche-admin-structure-${admin?.name?.replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Erreur lors du téléchargement du PDF", err);
      setFlashMessage("Erreur lors du téléchargement du PDF");
    } finally {
      setDownloading(false);
    }
  };

  // Fonction pour supprimer l'administrateur
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/admin-systeme/destroy/admin-structure/${id}`);
      navigate('/admin-systeme/view/admin-structure', {
        state: { message: "Administrateur supprimé avec succès" }
      });
    } catch (err) {
      console.error("Erreur lors de la suppression", err);
      setFlashMessage("Erreur lors de la suppression");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4 text-center">
          <Spinner animation="border" variant="primary" />
          <p className={`mt-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
            Chargement des données...
          </p>
        </Container>
      </AdminSystemeLayout>
    );
  }

  if (!admin) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4">
          <Alert variant="danger">
            <i data-feather="alert-circle" className="me-2"></i>
            {flashMessage || "Administrateur introuvable"}
          </Alert>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin-systeme/view/admin-structure')}
            className="d-flex align-items-center"
          >
            <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Retour à la liste
          </Button>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                <i data-feather="eye" className="text-info" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Détails de l'Administrateur
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Institut de Santé - Informations détaillées
                </p>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="d-flex align-items-center"
              >
                <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Télécharger PDF
              </Button>
              
              <Button
                as={Link}
                to={`/admin-systeme/edit/admin-structure/${admin.id}`}
                variant="warning"
                className="d-flex align-items-center"
              >
                <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Modifier
              </Button>

              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="d-flex align-items-center"
              >
                <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Supprimer
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav aria-label="breadcrumb">
            <ol className={`breadcrumb ${theme === "dark" ? "text-light" : ""}`}>
              <li className="breadcrumb-item">
                <a href="/admin-systeme/dashboard" className="text-decoration-none">
                  <i data-feather="home" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Dashboard
                </a>
              </li>
              <li className="breadcrumb-item">
                <a href="/admin-systeme/view/admin-structure" className="text-decoration-none">
                  Administrateurs Structure
                </a>
              </li>
              <li className={`breadcrumb-item active ${theme === "dark" ? "text-light" : ""}`}>
                {admin.name}
              </li>
            </ol>
          </nav>
        </div>

        {/* Message d'erreur */}
        {flashMessage && (
          <Alert variant="danger" className="mb-4">
            <i data-feather="alert-circle" className="me-2"></i>
            {flashMessage}
          </Alert>
        )}

        <Row className="g-4">
          {/* Carte profil principal */}
          <Col lg={4}>
            <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                {/* Photo de profil */}
                <div className="mb-4">
                  {admin.profil ? (
                    <img
                     src={
                        admin.profil
                        ? `${publicApi.defaults.baseURL}/storage/profil/${admin.profil}`
                        : `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`
                      }
                      alt={`Profil de ${admin.name}`}
                      className="rounded-circle border border-3 border-primary"
                      style={{ width: "120px", height: "120px", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                      <i data-feather="user" className="text-primary" style={{ width: "48px", height: "48px" }}></i>
                    </div>
                  )}
                </div>

                {/* Informations principales */}
                <h4 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  {admin.name}
                </h4>
                
                <Badge bg="primary" className="px-3 py-2 mb-3">
                  <i data-feather="shield" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                  Administrateur Structure
                </Badge>

                <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <div className="mb-2">
                    <i data-feather="mail" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                    {admin.email}
                  </div>
                  
                  {admin.phone && (
                    <div className="mb-2">
                      <i data-feather="phone" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      {admin.code_phone} {admin.phone}
                    </div>
                  )}

                  <div className="mb-2">
                    <i data-feather="calendar" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                    Créé le {new Date(admin.created_at).toLocaleDateString()}
                  </div>

                  {admin.updated_at && (
                    <div>
                      <i data-feather="clock" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Modifié le {new Date(admin.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Informations détaillées */}
          <Col lg={8}>
            <Row className="g-4">
              {/* Informations personnelles */}
              <Col md={12}>
                <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Informations Personnelles
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="d-flex align-items-center">
                          <i data-feather="user" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                          <div>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Nom complet</small>
                            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {admin.name}
                            </p>
                          </div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="d-flex align-items-center">
                          <i data-feather="mail" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                          <div>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Email</small>
                            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {admin.email} 
                            </p>
                          </div>
                        </div>
                      </Col>

                      {admin.birthday && (
                        <Col md={6}>
                          <div className="d-flex align-items-center">
                            <i data-feather="calendar" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                            <div>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Date de naissance</small>
                              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {new Date(admin.birthday).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </Col>
                      )}

                      {admin.gender && (
                        <Col md={6}>
                          <div className="d-flex align-items-center">
                            <i data-feather="users" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                            <div>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Genre</small>
                              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {admin.gender === 'male' ? 'Masculin' : admin.gender === 'female' ? 'Féminin' : 'Autre'}
                              </p>
                            </div>
                          </div>
                        </Col>
                      )}

                      {admin.phone && (
                        <Col md={6}>
                          <div className="d-flex align-items-center">
                            <i data-feather="phone" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                            <div>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Téléphone</small>
                              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {admin.code_phone} {admin.phone} 
                              </p>
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              {/* Informations de structure */}
              <Col md={12}>
                <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Structure Assignée
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    {admin.structure?.nom? (
                      <div className="d-flex align-items-center">
                        <div className="bg-success bg-opacity-10 rounded p-2 me-3">
                          <i data-feather="building" className="text-success" style={{ width: "20px", height: "20px" }}></i>
                        </div>
                        <div>
                          <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {admin.structure.nom}
                          </h6>
                          <small className={theme === "dark" ? "text-light" : "text-muted"}>
                            Matricule: {admin.structure.matricule} <br />
                            Email: {admin.structure.email} <br />
                            Contact: {admin.structure.code_telephone} {admin.structure.telephone}<br />
                            <br />
                            Type de structure: {admin.structure.type_strucuture} <br />
                            service: {admin.structure.matricule} <br />
                            <br />
                            Horaires: {admin.structure.horaires_debut} - {admin.structure.horaires_fin}<br />
                          </small>
                          
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <div className="bg-warning bg-opacity-10 rounded p-3 d-inline-flex mb-2">
                          <i data-feather="alert-triangle" className="text-warning" style={{ width: "24px", height: "24px" }}></i>
                        </div>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          Aucune structure assignée
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Informations système */}
              <Col md={12}>
                <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Informations Système
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="d-flex align-items-center">
                          <i data-feather="hash" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                          <div>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>ID Utilisateur</small>
                            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              #{admin.matricule}
                            </p>
                          </div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="d-flex align-items-center">
                          <i data-feather="shield" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                          <div>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Rôle</small>
                            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              Administrateur Structure
                            </p>
                          </div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="d-flex align-items-center">
                          <i data-feather="calendar" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                          <div>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Date de création</small>
                            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {new Date(admin.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="d-flex align-items-center">
                          <i data-feather="clock" className="me-3 text-primary" style={{ width: "16px", height: "16px" }}></i>
                          <div>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Dernière modification</small>
                            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {new Date(admin.updated_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Boutons d'action */}
        <div className="mt-4 d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => navigate('/admin-systeme/view/admin-structure')}
            className="d-flex align-items-center"
          >
            <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Retour à la liste
          </Button>

          <div className="d-flex gap-2">
            <Button
              variant="success"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="d-flex align-items-center"
            >
            <>
                <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Télécharger PDF
            </>
            </Button>

            <Button
              as={Link}
              to={`/admin-systeme/edit/admin-structure/${admin.id}`}
              variant="warning"
              className="d-flex align-items-center"
            >
              <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Modifier
            </Button>
          </div>
        </div>

        {/* Modal de confirmation de suppression */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={`border-0 ${theme === "dark" ? "bg-dark" : ""}`} closeButton>
            <Modal.Title className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
              <i data-feather="alert-triangle" className="text-danger me-2" style={{ width: "20px", height: "20px" }}></i>
              Confirmer la suppression
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark" : ""}>
            <p className={theme === "dark" ? "text-light" : "text-dark"}>
              Êtes-vous sûr de vouloir supprimer l'administrateur <strong>{admin.name}</strong> ?
            </p>
            <p className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Cette action est irréversible et supprimera définitivement toutes les données associées à cet utilisateur.
            </p>
          </Modal.Body>
          <Modal.Footer className={`border-0 ${theme === "dark" ? "bg-dark" : ""}`}>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              className="d-flex align-items-center"
            >
              {deleting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Supprimer
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AdminSystemeLayout>
  );
}