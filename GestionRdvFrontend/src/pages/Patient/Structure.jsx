import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, Form, Badge, Table, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../services/api";
import publicApi from "../../services/publicApi";
import PatientLayout from "../../layouts/Patient/LayoutPatient";
import feather from "feather-icons";

export default function StructuresSante() {
  // États principaux
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filtres et recherche
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [onlyOpenFilter, setOnlyOpenFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "table"
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

  // Fonction pour récupérer les structures depuis l'API
  const fetchStructures = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: page // Ajout du paramètre page
      };
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type_structure = typeFilter;
      if (onlyOpenFilter) params.only_open = true;

      const response = await api.get('/patient/view/structure', { params });
      
      if (response.data.success) {
        setStructures(response.data.data.data || []);
        setCurrentTime(response.data.current_time);
        setTotalPages(response.data.data.last_page || 1);
        setCurrentPage(response.data.data.current_page || 1);
      } else {
        setError(response.data.message || "Erreur lors du chargement des structures");
      }
      
    } catch (err) {
      setError("Erreur lors du chargement des structures de santé");
      console.error("Erreur API:", err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, onlyOpenFilter]);

  // Effect pour charger les données initiales
  useEffect(() => {
    fetchStructures(1); // Toujours commencer à la page 1 lors d'un nouveau chargement
  }, [search, typeFilter, onlyOpenFilter, fetchStructures]); // Recharger quand les filtres changent

  // Effect pour gérer le changement de page
  useEffect(() => {
    if (currentPage) { // Éviter le double appel pour la page 1
      fetchStructures(currentPage);
    }
  }, [currentPage, fetchStructures]);

  useEffect(() => {
    feather.replace();
  }, [structures, loading, showDetailModal]);

  // Fonction pour changer de page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      // Scroll vers le haut lors du changement de page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (newPage <= -1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      // Scroll vers le haut lors du changement de page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setOnlyOpenFilter(false);
    setCurrentPage(1); // Remettre à la page 1
  };

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
    if (!currentTime || !structure.horaires_debut || !structure.horaires_fin) return false;
    
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
      stars.push(<i key={i} data-feather="star" className="text-warning" style={{width: "14px", height: "14px", fill: "currentColor"}}></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" data-feather="star" className="text-warning" style={{width: "14px", height: "14px", fill: "currentColor", opacity: 0.5}}></i>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} data-feather="star" className="text-muted" style={{width: "14px", height: "14px"}}></i>);
    }
    
    return stars;
  };

  // Fonction pour afficher les détails d'une structure
  const showStructureDetails = (structure) => {
    setSelectedStructure(structure);
    setShowDetailModal(true);
  };

  // Fonction pour obtenir la position géographique
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Position:', position.coords.latitude, position.coords.longitude);
          alert('Localisation activée ! Recherche des structures proches...');
        },
        (error) => {
          alert('Impossible d\'obtenir votre position. Vérifiez vos paramètres de localisation.');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
  };

  // Fonction pour gérer la recherche avec Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1); // Remettre à la page 1 lors d'une nouvelle recherche
      fetchStructures(1);
    }
  };

  // Fonction pour le bouton filtrer
  const handleFilter = () => {
    setCurrentPage(1); // Remettre à la page 1 lors du filtrage
    fetchStructures(1);
  };

  return (
    <PatientLayout>
      <Container className={`py-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
        {/* En-tête avec titre et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="map-pin" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Structures de Santé
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Trouvez et choisissez la structure de santé la plus proche de vous
              </p>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {structures.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Structures
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="building" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-success">
                        {structures.filter(s => isStructureOpen(s)).length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Ouvertes
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="clock" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-info">
                        {structures.reduce((total, s) => total + (s.docteurs_count || 0), 0)}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Médecins Disponibles
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="user-check" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-warning">
                        {structures.filter(s => s.service).length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Avec Services
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="award" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Panneau principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="map" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Liste des Structures de Santé
                </span>
                {/* Informations de pagination */}
                <span className={`ms-3 small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Page {currentPage} sur {totalPages}
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                <Button
                  variant={theme === "dark" ? "outline-light" : "outline-primary"}
                  size="sm"
                  onClick={getLocation}
                >
                  <i data-feather="map-pin" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                  Ma position
                </Button>
                
                {/* Toggle vue */}
                <div className="btn-group" role="group">
                  <Button
                    variant={viewMode === "grid" ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <i data-feather="grid" style={{ width: "16px", height: "16px" }}></i>
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <i data-feather="list" style={{ width: "16px", height: "16px" }}></i>
                  </Button>
                </div>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche globale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nom, adresse, email, téléphone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="filter" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Type de structure
                  </Form.Label>
                  <Form.Select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les types</option>
                    <option value="Hôpital">Hôpital</option>
                    <option value="Clinique">Clinique</option>
                    <option value="Centre Médical">Centre Médical</option>
                    <option value="Polyclinique">Polyclinique</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="clock" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Disponibilité
                  </Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="only-open"
                      label="Ouvert maintenant"
                      checked={onlyOpenFilter}
                      onChange={(e) => setOnlyOpenFilter(e.target.checked)}
                      className={theme === "dark" ? "text-light" : ""}
                    />
                  </div>
                </Col>
                <Col md={2}>
                  <Form.Label className="small opacity-0">Action</Form.Label>
                  <div>
                    <Button 
                      variant={theme === "dark" ? "outline-light" : "outline-primary"} 
                      className="w-100" 
                      onClick={handleFilter}
                    >
                      <i data-feather="search" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Filtrer
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Affichage du contenu */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className={`mt-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Chargement des structures de santé...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-5">
                <i data-feather="alert-triangle" className="text-danger mb-3" style={{ width: "48px", height: "48px" }}></i>
                <h5 className="text-danger">{error}</h5>
                <Button variant="primary" onClick={() => fetchStructures(currentPage)} className="mt-3">
                  <i data-feather="refresh-cw" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Réessayer
                </Button>
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  /* Vue en grille */
                  <Row className="g-4">
                    {structures.length > 0 ? (
                      structures.map((structure) => (
                        <Col key={structure.id} lg={6} xl={6}>
                          <Card 
                            className={`h-100 shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}
                            style={{ 
                              borderRadius: '12px',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                            }}
                          >
                            {/* Image de la structure (cliquable) */}
                            {structure.image && (
                              <div style={{ height: '200px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                                <Link to={`/patient/view/structure/${structure.id}`}>
                                  <img
                                    src={getStructureImageUrl(structure.image)}
                                    alt={structure.nom}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      transition: 'transform 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  />
                                </Link>
                              </div>
                            )}

                            {/* En-tête de la carte */}
                            <div 
                              className="d-flex align-items-center p-3"
                              style={{
                                background: `linear-gradient(135deg, ${theme === "dark" ? "#374151" : "#f8f9fa"}, ${theme === "dark" ? "#1f2937" : "#e5e7eb"})`,
                                borderRadius: structure.image ? '0' : '12px 12px 0 0'
                              }}
                            >
                              <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                                <i data-feather={getStructureIcon(structure.type_structure)} className="text-primary" style={{ width: "20px", height: "20px" }}></i>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className={`mb-1 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {structure.nom}
                                </h6>
                                <div className="d-flex align-items-center gap-2">
                                  <Badge bg={structure.type_structure === "Hôpital" ? "primary" : structure.type_structure === "Clinique" ? "info" : "secondary"}>
                                    {structure.type_structure}
                                  </Badge>
                                  <Badge bg={isStructureOpen(structure) ? "success" : "danger"}>
                                    <i data-feather={isStructureOpen(structure) ? "check" : "x"} style={{ width: "12px", height: "12px" }}></i>
                                    {isStructureOpen(structure) ? "Ouvert" : "Fermé"}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <Card.Body className="p-3">
                              {/* Informations principales */}
                              <div className="mb-3">
                                <div className={`small mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  <i data-feather="map-pin" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                                  {structure.adresse || 'Adresse non renseignée'}
                                </div>
                                <div className={`small mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                  <i data-feather="clock" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                                  {structure.horaires_debut === "00:00:00" && structure.horaires_fin === "23:59:59" 
                                    ? "24h/24 - 7j/7" 
                                    : `${structure.horaires_debut?.slice(0,5) || '00:00'} - ${structure.horaires_fin?.slice(0,5) || '23:59'}`
                                  }
                                </div>
                                <div className={`small mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                  <i data-feather="phone" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                                  {structure.code_telephone && `${structure.code_telephone} `}{structure.telephone || 'Non renseigné'}
                                </div>
                              </div>

                              {/* Services */}
                              {structure.service && (
                                <div className="mb-3">
                                  <small className={`text-muted d-block mb-1 ${theme === "dark" ? "text-light" : ""}`}>
                                    <i data-feather="activity" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                    Services:
                                  </small>
                                  <small className={theme === "dark" ? "text-light" : "text-dark"}>
                                    {structure.service.length > 80 
                                      ? structure.service.substring(0, 80) + "..."
                                      : structure.service
                                    }
                                  </small>
                                </div>
                              )}

                              {/* Statistiques et évaluation */}
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="d-flex gap-3">
                                  <div className="text-center">
                                    <div className={`fw-bold text-primary ${theme === "dark" ? "text-light" : ""}`}>
                                      {structure.docteurs_count || 0}
                                    </div>
                                    <div className="small text-muted">Médecins</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`fw-bold text-primary ${theme === "dark" ? "text-light" : ""}`}>
                                      {structure.matricule || 'N/A'}
                                    </div>
                                    <div className="small text-muted">Matricule</div>
                                  </div>
                                </div>
                                <div className="text-end">
                                  <div className="d-flex align-items-center mb-1">
                                    {generateStars(4.0)}
                                    <span className="small text-muted ms-1">(4.0)</span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="flex-fill"
                                  onClick={() => showStructureDetails(structure)}
                                >
                                  <i data-feather="info" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                                  Détails
                                </Button>
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  className="flex-fill"
                                  as={Link}
                                  to={`/patient/view/structure/${structure.id}`}
                                >
                                  <i data-feather="eye" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                                  Voir plus
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Col xs={12}>
                        <div className="text-center py-5">
                          <i data-feather="map-pin" className="text-muted mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                          <h6 className={theme === "dark" ? "text-light" : "text-muted"}>Aucune structure trouvée</h6>
                          <p className={`small mb-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                            Aucune structure ne correspond à vos critères de recherche.
                          </p>
                          <Button 
                            variant="primary" 
                            onClick={resetFilters}
                          >
                            <i data-feather="refresh-cw" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Réinitialiser
                          </Button>
                        </div>
                      </Col>
                    )}
                  </Row>
                ) : (
                  /* Vue en tableau */
                  <div className="table-responsive">
                    <Table hover className={`align-middle ${theme === "dark" ? "table-dark" : ""}`} style={{ borderRadius: "8px", overflow: "hidden" }}>
                      <thead className="table-primary">
                        <tr>
                          <th className="text-center" style={{ width: "50px" }}>#</th>
                          <th>
                            <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Structure
                          </th>
                          <th className="d-none d-md-table-cell">
                            <i data-feather="map-pin" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Adresse
                          </th>
                          <th className="d-none d-lg-table-cell">
                            <i data-feather="clock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Horaires
                          </th>
                          <th className="text-center">
                            <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Médecins
                          </th>
                          <th className="text-center d-none d-md-table-cell">
                            <i data-feather="phone" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Contact
                          </th>
                          <th className="text-center">
                            <i data-feather="activity" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Statut
                          </th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {structures.map((structure, index) => (
                          <tr key={structure.id}>
                            <td className="text-center">{((currentPage - 1) * 10) + index + 1}</td>
                            <td>
                              <div className="fw-bold">{structure.nom}</div>
                              <small className="text-muted">{structure.type_structure}</small>
                            </td>
                            <td className="d-none d-md-table-cell">{structure.adresse || 'Non renseignée'}</td>
                            <td className="d-none d-lg-table-cell">
                              {structure.horaires_debut === "00:00:00" && structure.horaires_fin === "23:59:59"
                                ? "24h/24 - 7j/7"
                                : `${structure.horaires_debut?.slice(0,5) || '00:00'} - ${structure.horaires_fin?.slice(0,5) || '23:59'}`}
                            </td>
                            <td className="text-center">{structure.docteurs_count || 0}</td>
                            <td className="text-center d-none d-md-table-cell">
                              <small>{structure.telephone || 'Non renseigné'}</small>
                            </td>
                            <td className="text-center">
                              <Badge bg={isStructureOpen(structure) ? "success" : "danger"}>
                                {isStructureOpen(structure) ? "Ouvert" : "Fermé"}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <div className="btn-group">
                                <Button size="sm" variant="outline-primary" onClick={() => showStructureDetails(structure)}>
                                  <i data-feather="info" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="primary"
                                  as={Link}
                                  to={`/patient/structure/${structure.id}`}
                                >
                                  <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Pagination améliorée */}
                {totalPages > 1 && (
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4">
                    {/* Informations sur la pagination */}
                    <div className={`mb-2 mb-md-0 small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Affichage de la page {currentPage} sur {totalPages}
                    </div>
                    
                    {/* Contrôles de pagination */}
                    <nav aria-label="Pagination des structures">
                      <div className="d-flex align-items-center gap-2">
                        {/* Bouton Première page */}
                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          title="Première page"
                        >
                          <i data-feather="chevrons-left" style={{ width: "14px", height: "14px" }}></i>
                        </Button>

                        {/* Bouton Page précédente */}
                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          title="Page précédente"
                        >
                          <i data-feather="chevron-left" style={{ width: "14px", height: "14px" }}></i>
                        </Button>

                        {/* Numéros de page */}
                        <div className="d-flex gap-1">
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                            // Ajuster si on est proche de la fin
                            if (endPage - startPage + 1 < maxVisiblePages) {
                              startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }

                            // Première page si pas visible
                            if (startPage > 1) {
                              pages.push(
                                <Button
                                  key={1}
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handlePageChange(1)}
                                >
                                  1
                                </Button>
                              );
                              if (startPage > 2) {
                                pages.push(
                                  <span key="ellipsis1" className={`px-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                    ...
                                  </span>
                                );
                              }
                            }

                            // Pages visibles
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <Button
                                  key={i}
                                  variant={currentPage === i ? "primary" : "outline-primary"}
                                  size="sm"
                                  onClick={() => handlePageChange(i)}
                                  className={currentPage === i ? "fw-bold" : ""}
                                >
                                  {i}
                                </Button>
                              );
                            }

                            // Dernière page si pas visible
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(
                                  <span key="ellipsis2" className={`px-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                    ...
                                  </span>
                                );
                              }
                              pages.push(
                                <Button
                                  key={totalPages}
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handlePageChange(totalPages)}
                                >
                                  {totalPages}
                                </Button>
                              );
                            }

                            return pages;
                          })()}
                        </div>

                        {/* Bouton Page suivante */}
                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          title="Page suivante"
                        >
                          <i data-feather="chevron-right" style={{ width: "14px", height: "14px" }}></i>
                        </Button>

                        {/* Bouton Dernière page */}
                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          title="Dernière page"
                        >
                          <i data-feather="chevrons-right" style={{ width: "14px", height: "14px" }}></i>
                        </Button>
                      </div>
                    </nav>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Modal de détails d'une structure */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
        className={theme === "dark" ? "modal-dark" : ""}
      >
        <Modal.Header closeButton className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Modal.Title>
            <i data-feather="info" className="me-2" style={{ width: "20px", height: "20px" }}></i>
            Détails de la structure
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          {selectedStructure && (
            <div>
              {/* En-tête avec image si disponible */}
              {selectedStructure.image && (
                <div className="text-center mb-4">
                  <img
                    src={getStructureImageUrl(selectedStructure.image)}
                    alt={selectedStructure.nom}
                    className="img-fluid rounded"
                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="mb-4 text-center">
                <h4 className={theme === "dark" ? "text-light" : "text-dark"}>
                  {selectedStructure.nom}
                </h4>
                <Badge bg={selectedStructure.type_structure === "Hôpital" ? "primary" : selectedStructure.type_structure === "Clinique" ? "info" : "secondary"} className="mb-2">
                  {selectedStructure.type_structure}
                </Badge>
                <br />
                <Badge bg={isStructureOpen(selectedStructure) ? "success" : "danger"}>
                  {isStructureOpen(selectedStructure) ? "Ouvert maintenant" : "Fermé"}
                </Badge>
              </div>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="credit-card" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Matricule:
                    </strong>
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      {selectedStructure.matricule || 'Non renseigné'}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Médecins disponibles:
                    </strong>
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      {selectedStructure.docteurs_count || 0} médecin{(selectedStructure.docteurs_count || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </Col>
              </Row>

              <div className="mb-3">
                <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="map-pin" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Adresse:
                </strong>
                <span className={theme === "dark" ? "text-light" : "text-muted"}>
                  {selectedStructure.adresse || 'Adresse non renseignée'}
                </span>
              </div>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="phone" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Téléphone:
                    </strong>
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      {selectedStructure.code_telephone && `${selectedStructure.code_telephone} `}
                      {selectedStructure.telephone || 'Non renseigné'}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Email:
                    </strong>
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      {selectedStructure.email || 'Non renseigné'}
                    </span>
                  </div>
                </Col>
              </Row>

              <div className="mb-3">
                <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="clock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Horaires d'ouverture:
                </strong>
                <span className={theme === "dark" ? "text-light" : "text-muted"}>
                  {selectedStructure.horaires_debut === "00:00:00" && selectedStructure.horaires_fin === "23:59:59"
                    ? "24h/24 - 7j/7"
                    : `${selectedStructure.horaires_debut?.slice(0,5) || '00:00'} - ${selectedStructure.horaires_fin?.slice(0,5) || '23:59'}`}
                </span>
              </div>

              {selectedStructure.service && (
                <div className="mb-3">
                  <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="activity" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Services proposés:
                  </strong>
                  <span className={theme === "dark" ? "text-light" : "text-muted"}>
                    {selectedStructure.service}
                  </span>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            <i data-feather="x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Fermer
          </Button>
          {selectedStructure && (
            <Button 
              variant="primary" 
              as={Link} 
              to={`/patient/structure/${selectedStructure.id}`}
              onClick={() => setShowDetailModal(false)}
            >
              <i data-feather="eye" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Voir la page complète
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </PatientLayout>
  );
}