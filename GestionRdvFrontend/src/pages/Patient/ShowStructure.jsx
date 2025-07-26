import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Image, Table } from "react-bootstrap";
import api from "../../services/api";
import publicApi from "../../services/publicApi";
import PatientLayout from "../../layouts/Patient/LayoutPatient";
import feather from "feather-icons";

export default function StructureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

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

  // Charger les détails de la structure
  useEffect(() => {
    const fetchStructureDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/patient/show/structure/${id}`, {
          params: { id }
        });
        
        if (response.data.status === 'success') {
          setStructure(response.data.data);
          // Obtenir l'heure actuelle pour vérifier si ouvert
          const now = new Date();
          setCurrentTime(now.toTimeString().slice(0, 8));
        } else {
          setError(response.data.message || "Structure non trouvée");
        }
      } catch (err) {
        setError("Erreur lors du chargement des détails de la structure");
        console.error("Erreur API:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStructureDetails();
    }
  }, [id]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [structure]);

  // Fonction pour obtenir l'URL de l'image
  const getStructureImageUrl = (image) => {
    if (!image) return null;
    return `${publicApi.defaults.baseURL}/storage/structures/${image}`;
  };

  // Fonction pour obtenir l'icône selon le type de structure
  const getStructureIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'hôpital':
        return 'heart';
      case 'clinique':
        return 'activity';
      case 'centre médical':
      case 'centre':
        return 'user-check';
      case 'polyclinique':
        return 'shield';
      default:
        return 'building';
    }
  };

  // Fonction pour vérifier si une structure est ouverte
  const isStructureOpen = (structure) => {
    if (!currentTime || !structure?.horaires_debut || !structure?.horaires_fin) return false;
    
    const currentTimeMinutes = timeToMinutes(currentTime);
    const startTimeMinutes = timeToMinutes(structure.horaires_debut);
    const endTimeMinutes = timeToMinutes(structure.horaires_fin);
    
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  };

  // Fonction utilitaire pour convertir le temps en minutes
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Fonction pour générer les étoiles de notation (simulation)
  const generateStars = (rating = 4.0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i 
          key={i} 
          data-feather="star" 
          className="text-warning" 
          style={{width: "18px", height: "18px", fill: "currentColor"}}
        ></i>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <i 
          key="half" 
          data-feather="star" 
          className="text-warning" 
          style={{width: "18px", height: "18px", fill: "currentColor", opacity: 0.5}}
        ></i>
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i 
          key={`empty-${i}`} 
          data-feather="star" 
          className="text-muted" 
          style={{width: "18px", height: "18px"}}
        ></i>
      );
    }
    
    return stars;
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <PatientLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement des détails de la structure...</p>
          </div>
        </Container>
      </PatientLayout>
    );
  }

  if (error) {
    return (
      <PatientLayout>
        <Container className="py-4">
          <Alert variant="danger" className="mb-4">
            <i data-feather="alert-circle" className="me-2" />
            {error}
          </Alert>
          <div className="text-center">
            <Button variant="primary" onClick={() => navigate(-1)}>
              <i data-feather="arrow-left" className="me-2" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
          </div>
        </Container>
      </PatientLayout>
    );
  }

  if (!structure) {
    return (
      <PatientLayout>
        <Container className="py-4">
          <Alert variant="warning" className="mb-4">
            <i data-feather="info" className="me-2" />
            Structure non trouvée
          </Alert>
        </Container>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <Container className={`py-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/patient/structures" className="text-decoration-none">
                <i data-feather="map-pin" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                Structures de Santé
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {structure.nom}
            </li>
          </ol>
        </nav>

        <Row>
          {/* Colonne principale */}
          <Col lg={8} className="mb-4">
            {/* Image principale */}
            {structure.image && (
              <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div style={{ height: '400px', overflow: 'hidden', borderRadius: '12px' }}>
                  <Image
                    src={getStructureImageUrl(structure.image)}
                    alt={structure.nom}
                    fluid
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </Card>
            )}

            {/* Informations principales */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex align-items-center justify-content-between">
                  <h4 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather={getStructureIcon(structure.type_structure)} className="me-2 text-primary" style={{ width: '24px', height: '24px' }}></i>
                    {structure.nom}
                  </h4>
                  <Badge bg={isStructureOpen(structure) ? "success" : "danger"} className="fs-6 p-2">
                    <i data-feather={isStructureOpen(structure) ? "check-circle" : "x-circle"} className="me-1" style={{ width: '16px', height: '16px' }}></i>
                    {isStructureOpen(structure) ? "Ouvert" : "Fermé"}
                  </Badge>
                </div>
                <div className="mt-2">
                  <Badge bg={structure.type_structure === "Hôpital" ? "primary" : structure.type_structure === "Clinique" ? "info" : "secondary"} className="me-2">
                    {structure.type_structure}
                  </Badge>
                  <div className="d-inline-flex align-items-center">
                    {generateStars(4.2)}
                    <span className="ms-2 text-muted">(4.2/5 - 127 avis)</span>
                  </div>
                </div>
              </Card.Header>
              
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <Row>
                  <Col md={6} className="mb-3">
                    <div className="d-flex align-items-start">
                      <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                        <i data-feather="credit-card" className="text-primary" style={{ width: '20px', height: '20px' }}></i>
                      </div>
                      <div>
                        <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>Matricule</h6>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          {structure.matricule || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </Col>

                  <Col md={6} className="mb-3">
                    <div className="d-flex align-items-start">
                      <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                        <i data-feather="user-check" className="text-success" style={{ width: '20px', height: '20px' }}></i>
                      </div>
                      <div>
                        <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>Médecins disponibles</h6>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          {structure.docteurs_count || 0} médecin{(structure.docteurs_count || 0) > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </Col>

                  <Col md={12} className="mb-3">
                    <div className="d-flex align-items-start">
                      <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                        <i data-feather="map-pin" className="text-info" style={{ width: '20px', height: '20px' }}></i>
                      </div>
                      <div>
                        <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>Adresse complète</h6>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          {structure.adresse || 'Adresse non renseignée'}
                        </p>
                      </div>
                    </div>
                  </Col>

                  <Col md={6} className="mb-3">
                    <div className="d-flex align-items-start">
                      <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
                        <i data-feather="phone" className="text-warning" style={{ width: '20px', height: '20px' }}></i>
                      </div>
                      <div>
                        <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>Téléphone</h6>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          {structure.code_telephone && `${structure.code_telephone} `}
                          {structure.telephone || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </Col>

                  <Col md={6} className="mb-3">
                    <div className="d-flex align-items-start">
                      <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-secondary bg-opacity-10"}`}>
                        <i data-feather="mail" className="text-secondary" style={{ width: '20px', height: '20px' }}></i>
                      </div>
                      <div>
                        <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>Email</h6>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          {structure.email || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </Col>

                  <Col md={12} className="mb-3">
                    <div className="d-flex align-items-start">
                      <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                        <i data-feather="clock" className="text-primary" style={{ width: '20px', height: '20px' }}></i>
                      </div>
                      <div>
                        <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>Horaires d'ouverture</h6>
                        <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          {structure.horaires_debut === "00:00:00" && structure.horaires_fin === "23:59:59"
                            ? "24h/24 - 7 jours sur 7"
                            : `${structure.horaires_debut?.slice(0,5) || '00:00'} - ${structure.horaires_fin?.slice(0,5) || '23:59'}`}
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Services disponibles */}
            {structure.service && (
              <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="activity" className="me-2 text-primary" style={{ width: '20px', height: '20px' }}></i>
                    Services disponibles
                  </h5>
                </Card.Header>
                <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                  <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    {structure.service}
                  </p>
                </Card.Body>
              </Card>
            )}

            {/* Informations supplémentaires */}
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="info" className="me-2 text-primary" style={{ width: '20px', height: '20px' }}></i>
                  Informations supplémentaires
                </h5>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className={`d-block mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Date de création:
                      </strong>
                      <span className={theme === "dark" ? "text-light" : "text-muted"}>
                        {formatDate(structure.created_at)}
                      </span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className={`d-block mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Dernière mise à jour:
                      </strong>
                      <span className={theme === "dark" ? "text-light" : "text-muted"}>
                        {formatDate(structure.updated_at)}
                      </span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Colonne latérale */}
          <Col lg={4}>
            {/* Actions rapides */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="zap" className="me-2 text-primary" style={{ width: '20px', height: '20px' }}></i>
                  Actions rapides
                </h5>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="d-flex align-items-center justify-content-center"
                  >
                    <i data-feather="calendar" className="me-2" style={{ width: '18px', height: '18px' }}></i>
                    Prendre un rendez-vous
                  </Button>
                  
                  {structure.telephone && (
                    <Button 
                      variant="outline-success" 
                      className="d-flex align-items-center justify-content-center"
                      href={`tel:${structure.code_telephone}${structure.telephone}`}
                    >
                      <i data-feather="phone" className="me-2" style={{ width: '18px', height: '18px' }}></i>
                      Appeler maintenant
                    </Button>
                  )}
                  
                  {structure.email && (
                    <Button 
                      variant="outline-info" 
                      className="d-flex align-items-center justify-content-center"
                      href={`mailto:${structure.email}`}
                    >
                      <i data-feather="mail" className="me-2" style={{ width: '18px', height: '18px' }}></i>
                      Envoyer un email
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline-warning" 
                    className="d-flex align-items-center justify-content-center"
                  >
                    <i data-feather="map-pin" className="me-2" style={{ width: '18px', height: '18px' }}></i>
                    Voir sur la carte
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    className="d-flex align-items-center justify-content-center"
                  >
                    <i data-feather="share-2" className="me-2" style={{ width: '18px', height: '18px' }}></i>
                    Partager
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Statistiques */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="bar-chart-2" className="me-2 text-primary" style={{ width: '20px', height: '20px' }}></i>
                  Statistiques
                </h5>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <div className="text-center mb-3">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className={`p-3 rounded ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                        <div className="text-primary">
                          <i data-feather="user-check" style={{ width: '24px', height: '24px' }}></i>
                        </div>
                        <h4 className={`mb-0 mt-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {structure.docteurs_count || 0}
                        </h4>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          Médecins
                        </small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className={`p-3 rounded ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                        <div className="text-success">
                          <i data-feather="calendar" style={{ width: '24px', height: '24px' }}></i>
                        </div>
                        <h4 className={`mb-0 mt-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          127
                        </h4>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          RDV ce mois
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <hr className="my-3" />
                
                <div className="small">
                  <div className="d-flex justify-content-between mb-2">
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>Note moyenne :</span>
                    <div className="d-flex align-items-center">
                      <span className="fw-bold text-warning me-1">4.2</span>
                      <i data-feather="star" className="text-warning" style={{ width: '14px', height: '14px', fill: 'currentColor' }}></i>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>Temps d'attente moyen :</span>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>15 min</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>Taux de satisfaction :</span>
                    <span className="fw-bold text-success">89%</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>Statut actuel :</span>
                    <Badge bg={isStructureOpen(structure) ? "success" : "danger"}>
                      {isStructureOpen(structure) ? "Ouvert" : "Fermé"}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Médecins disponibles */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="users" className="me-2 text-primary" style={{ width: '20px', height: '20px' }}></i>
                  Équipe médicale
                </h5>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <div className="text-center">
                  <div className={`p-4 rounded ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                    <div className="text-info mb-3">
                      <i data-feather="user-check" style={{ width: '48px', height: '48px' }}></i>
                    </div>
                    <h3 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {structure.docteurs_count || 0}
                    </h3>
                    <p className={`mb-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Médecin{(structure.docteurs_count || 0) > 1 ? 's' : ''} disponible{(structure.docteurs_count || 0) > 1 ? 's' : ''}
                    </p>
                    <Button 
                      variant="info" 
                      size="sm"
                      className="d-flex align-items-center justify-content-center w-100"
                    >
                      <i data-feather="eye" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                      Voir tous les médecins
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Horaires détaillés */}
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="clock" className="me-2 text-primary" style={{ width: '20px', height: '20px' }}></i>
                  Horaires détaillés
                </h5>
              </Card.Header>
              <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                <div className="small">
                  {structure.horaires_debut === "00:00:00" && structure.horaires_fin === "23:59:59" ? (
                    <div className="text-center">
                      <div className={`p-3 rounded ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                        <i data-feather="clock" className="text-success mb-2" style={{ width: '32px', height: '32px' }}></i>
                        <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          Ouvert 24h/24
                        </div>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          7 jours sur 7
                        </small>
                      </div>
                    </div>
                  ) : (
                    <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                      <tbody>
                        <tr>
                          <td className={theme === "dark" ? "text-light" : "text-muted"}>Lundi - Vendredi :</td>
                          <td className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {structure.horaires_debut?.slice(0,5) || '00:00'} - {structure.horaires_fin?.slice(0,5) || '23:59'}
                          </td>
                        </tr>
                        <tr>
                          <td className={theme === "dark" ? "text-light" : "text-muted"}>Samedi :</td>
                          <td className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {structure.horaires_debut?.slice(0,5) || '00:00'} - {structure.horaires_fin?.slice(0,5) || '23:59'}
                          </td>
                        </tr>
                        <tr>
                          <td className={theme === "dark" ? "text-light" : "text-muted"}>Dimanche :</td>
                          <td className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {structure.horaires_debut?.slice(0,5) || '00:00'} - {structure.horaires_fin?.slice(0,5) || '23:59'}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  )}
                  
                  <hr className="my-3" />
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      <i data-feather="clock" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                      Maintenant :
                    </span>
                    <Badge bg={isStructureOpen(structure) ? "success" : "danger"}>
                      {isStructureOpen(structure) ? "Ouvert" : "Fermé"}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Boutons de navigation */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <Button 
            variant={theme === "dark" ? "outline-light" : "outline-secondary"}
            onClick={() => navigate(-1)}
          >
            <i data-feather="arrow-left" className="me-2" style={{ width: '16px', height: '16px' }}></i>
            Retour
          </Button>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary"
              as={Link}
              to="/patient/structures"
            >
              <i data-feather="list" className="me-2" style={{ width: '16px', height: '16px' }}></i>
              Voir toutes les structures
            </Button>
            
            <Button 
              variant="primary"
            >
              <i data-feather="calendar" className="me-2" style={{ width: '16px', height: '16px' }}></i>
              Prendre rendez-vous
            </Button>
          </div>
        </div>
      </Container>
    </PatientLayout>
  );
}