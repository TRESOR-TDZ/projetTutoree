import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, Form, Badge, Table, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../services/api";
import publicApi from "../../services/publicApi";
import PatientLayout from "../../layouts/Patient/LayoutPatient";
import feather from "feather-icons";

export default function Docteurs() {
  // États principaux
  const [docteurs, setDocteurs] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocteur, setSelectedDocteur] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filtres et recherche
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "table"
  
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

  // Fonction pour récupérer les docteurs depuis l'API
  const fetchDocteurs = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: page // Ajout du paramètre page
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter;

      const response = await api.get('/patient/view/doctor', { params });
      
      if (response.data.status === 'success') {
        setDocteurs(response.data.docteurs || []); // Note: l'API retourne 'docteurs' mais ce sont les docteurs
        setStructures(response.data.structures || []);
        // Si l'API ne retourne pas de pagination, on simule
        const itemsPerPage = 12; // 4 docteurs par ligne * 3 lignes
        const totalItems = response.data.docteurs?.length || 0;
        setTotalPages(Math.ceil(totalItems / itemsPerPage));
        setCurrentPage(page);
      } else {
        setError(response.data.message || "Erreur lors du chargement des docteurs");
      }
      
    } catch (err) {
      setError("Erreur lors du chargement des docteurs");
      console.error("Erreur API:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, genderFilter]);

  // Effect pour charger les données initiales
  useEffect(() => {
    fetchDocteurs(1);
  }, [search, statusFilter, genderFilter, fetchDocteurs]);

  // Effect pour gérer le changement de page
  useEffect(() => {
    if (currentPage && currentPage !== 1) {
      fetchDocteurs(currentPage);
    }
  }, [currentPage, fetchDocteurs]);

  useEffect(() => {
    feather.replace();
  }, [docteurs, loading, showDetailModal]);

  // Fonction pour changer de page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setGenderFilter("");
    setCurrentPage(1);
  };

  // Fonction pour obtenir l'URL de l'image de profil
  const getDocteurImageUrl = (profil) => {
    if (!profil) return null;
    return `${publicApi.defaults.baseURL}/storage/profil/${profil}`;
  };

  // Fonction pour obtenir l'icône selon le genre
  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
      case 'homme':
      case 'm':
        return 'user';
      case 'female':
      case 'femme':
      case 'f':
        return 'user';
      default:
        return 'user';
    }
  };

  // Fonction pour obtenir la couleur du badge de statut
  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
      case "actif":
      case "active":
        return { bg: "success", text: "Disponible" };
      case 0:
      case "inactif":
      case "inactive":
        return { bg: "danger", text: "Indisponible" };
      default:
        return { bg: "secondary", text: "Inconnu" };
    }
  };

  // Fonction pour générer les étoiles de notation (simulation)
  const generateStars = (rating = 4.5) => {
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

  // Fonction pour afficher les détails d'un docteur
  const showDocteurDetails = (docteur) => {
    setSelectedDocteur(docteur);
    setShowDetailModal(true);
  };

  // Fonction pour gérer la recherche avec Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchDocteurs(1);
    }
  };

  // Fonction pour le bouton filtrer
  const handleFilter = () => {
    setCurrentPage(1);
    fetchDocteurs(1);
  };

  // Pagination des docteurs pour l'affichage
  const itemsPerPage = 12; // 4 docteurs par ligne * 3 lignes
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocteurs = docteurs.slice(startIndex, endIndex);

  return (
    <PatientLayout>
      <Container className={`py-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
        {/* En-tête avec titre et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="users" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Nos Docteurs
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Découvrez nos professionnels de santé qualifiés et expérimentés
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
                        {docteurs.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Docteurs
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="users" style={{ width: "24px", height: "24px" }}></i>
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
                        {docteurs.filter(d => d.status === 1).length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Disponibles
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="check-circle" style={{ width: "24px", height: "24px" }}></i>
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
                        {docteurs.filter(d => d.gender === 'male' || d.gender === 'homme' || d.gender === 'm').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Hommes
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="user" style={{ width: "24px", height: "24px" }}></i>
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
                        {docteurs.filter(d => d.gender === 'female' || d.gender === 'femme' || d.gender === 'f').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Femmes
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="user" style={{ width: "24px", height: "24px" }}></i>
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
                <i data-feather="user-check" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Liste des Docteurs
                </span>
                {/* Informations de pagination */}
                <span className={`ms-3 small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Page {currentPage} sur {totalPages}
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
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
                    placeholder="Nom, email, téléphone, structure..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="activity" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="1">Disponible</option>
                    <option value="0">Indisponible</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="users" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Genre
                  </Form.Label>
                  <Form.Select
                    value={genderFilter}
                    onChange={e => setGenderFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les genres</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                  </Form.Select>
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
                  Chargement des docteurs...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-5">
                <i data-feather="alert-triangle" className="text-danger mb-3" style={{ width: "48px", height: "48px" }}></i>
                <h5 className="text-danger">{error}</h5>
                <Button variant="primary" onClick={() => fetchDocteurs(currentPage)} className="mt-3">
                  <i data-feather="refresh-cw" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Réessayer
                </Button>
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  /* Vue en grille - 4 docteurs par ligne */
                  <Row className="g-4">
                    {currentDocteurs.length > 0 ? (
                      currentDocteurs.map((docteur) => (
                        <Col key={docteur.id} lg={3} md={4} sm={6}>
                          <Card 
                            className={`h-100 shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}
                            style={{ 
                              borderRadius: '12px',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-5px)';
                              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                            }}
                          >
                            {/* Photo de profil */}
                            <div className="text-center pt-4">
                              <div 
                                className="mx-auto mb-3 rounded-circle overflow-hidden border-3 border-primary"
                                style={{ width: '80px', height: '80px' }}
                              >
                                {docteur.profil ? (
                                  <img
                                    src={getDocteurImageUrl(docteur.profil)}
                                    alt={docteur.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="d-flex align-items-center justify-content-center h-100 bg-primary text-white"
                                    style={{ fontSize: '24px' }}
                                  >
                                    {docteur.name?.charAt(0)?.toUpperCase() || 'D'}
                                  </div>
                                )}
                              </div>
                            </div>

                            <Card.Body className="text-center px-3 pb-3">
                              {/* Nom et statut */}
                              <h6 className={`mb-1 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                Dr. {docteur.name}
                              </h6>
                              
                              <div className="mb-2">
                                <Badge bg={getStatusBadge(docteur.status).bg}>
                                  {getStatusBadge(docteur.status).text}
                                </Badge>
                              </div>

                              {/* Structure */}
                              {docteur.structure && (
                                <div className={`small mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                  <i data-feather="building" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                  {docteur.structure.nom}
                                </div>
                              )}

                              {/* Informations de contact */}
                              <div className={`small mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                <i data-feather="phone" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {docteur.code_phone && `${docteur.code_phone} `}{docteur.phone || 'Non renseigné'}
                              </div>

                              <div className={`small mb-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                <i data-feather="mail" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {docteur.email || 'Non renseigné'}
                              </div>

                              {/* Évaluation */}
                              <div className="mb-3">
                                <div className="d-flex justify-content-center align-items-center mb-1">
                                  {generateStars(4.5)}
                                  <span className="small text-muted ms-1">(4.5)</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="flex-fill"
                                  onClick={() => showDocteurDetails(docteur)}
                                >
                                  <i data-feather="info" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                  Détails
                                </Button>
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  className="flex-fill"
                                  as={Link}
                                  to={`/patient/view/doctor/${docteur.id}`}
                                >
                                  <i data-feather="calendar" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                  Consulter
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Col xs={12}>
                        <div className="text-center py-5">
                          <i data-feather="user-x" className="text-muted mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                          <h6 className={theme === "dark" ? "text-light" : "text-muted"}>Aucun docteur trouvé</h6>
                          <p className={`small mb-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                            Aucun docteur ne correspond à vos critères de recherche.
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
                            <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Docteur
                          </th>
                          <th className="d-none d-md-table-cell">
                            <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Structure
                          </th>
                          <th className="d-none d-lg-table-cell">
                            <i data-feather="phone" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Contact
                          </th>
                          <th className="text-center d-none d-md-table-cell">
                            <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Genre
                          </th>
                          <th className="text-center">
                            <i data-feather="activity" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Statut
                          </th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDocteurs.map((docteur, index) => (
                          <tr key={docteur.id}>
                            <td className="text-center">{startIndex + index + 1}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div 
                                  className="me-3 rounded-circle overflow-hidden"
                                  style={{ width: '40px', height: '40px', minWidth: '40px' }}
                                >
                                  {docteur.profil ? (
                                    <img
                                      src={getDocteurImageUrl(docteur.profil)}
                                      alt={docteur.name}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100 bg-primary text-white">
                                      {docteur.name?.charAt(0)?.toUpperCase() || 'D'}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-bold">Dr. {docteur.name}</div>
                                  <small className="text-muted">{docteur.email}</small>
                                </div>
                              </div>
                            </td>
                            <td className="d-none d-md-table-cell">
                              {docteur.structure?.nom || 'Non assigné'}
                            </td>
                            <td className="d-none d-lg-table-cell">
                              <div>
                                <small>{docteur.phone || 'Non renseigné'}</small>
                              </div>
                            </td>
                            <td className="text-center d-none d-md-table-cell">
                              <Badge bg={docteur.gender === 'male' ? "info" : "warning"}>
                                {docteur.gender === 'male' ? 'Homme' : docteur.gender === 'female' ? 'Femme' : 'Non défini'}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge bg={getStatusBadge(docteur.status).bg}>
                                {getStatusBadge(docteur.status).text}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <div className="btn-group">
                                <Button size="sm" variant="outline-primary" onClick={() => showDocteurDetails(docteur)}>
                                  <i data-feather="info" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="primary"
                                  as={Link}
                                  to={`/patient/view/doctor/${docteur.id}`}
                                >
                                  <i data-feather="calendar" style={{ width: "14px", height: "14px" }}></i>
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
                      Affichage de la page {currentPage} sur {totalPages} ({docteurs.length} docteurs au total)
                    </div>
                    
                    {/* Contrôles de pagination */}
                    <nav aria-label="Pagination des docteurs">
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

      {/* Modal de détails d'un docteur */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
        className={theme === "dark" ? "modal-dark" : ""}
      >
        <Modal.Header closeButton className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Modal.Title>
            <i data-feather="user" className="me-2" style={{ width: "20px", height: "20px" }}></i>
            Profil du Docteur
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          {selectedDocteur && (
            <div>
              {/* En-tête avec photo de profil */}
              <div className="text-center mb-4">
                <div 
                  className="mx-auto mb-3 rounded-circle overflow-hidden border-3 border-primary"
                  style={{ width: '120px', height: '120px' }}
                >
                  {selectedDocteur.profil ? (
                    <img
                      src={getDocteurImageUrl(selectedDocteur.profil)}
                      alt={selectedDocteur.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div 
                      className="d-flex align-items-center justify-content-center h-100 bg-primary text-white"
                      style={{ fontSize: '36px' }}
                    >
                      {selectedDocteur.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                  )}
                </div>
                <h4 className={theme === "dark" ? "text-light" : "text-dark"}>
                  Dr. {selectedDocteur.name}
                </h4>
                <Badge bg={getStatusBadge(selectedDocteur.status).bg} className="mb-2">
                  {getStatusBadge(selectedDocteur.status).text}
                </Badge>
                <br />
                <div className="d-flex justify-content-center align-items-center mb-2">
                  {generateStars(4.5)}
                  <span className="small text-muted ms-2">(4.5/5 - 127 avis)</span>
                </div>
              </div>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="credit-card" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Matricule:
                    </strong>
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      {selectedDocteur.matricule || 'Non renseigné'}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Genre:
                    </strong>
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      {selectedDocteur.gender === 'male' ? 'Homme' : selectedDocteur.gender === 'female' ? 'Femme' : 'Non défini'}
                    </span>
                  </div>
                </Col>
              </Row>

              <div className="mb-3">
                <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Structure:
                </strong>
                <span className={theme === "dark" ? "text-light" : "text-muted"}>
                  {selectedDocteur.structure?.nom || 'Non assigné'}
                  {selectedDocteur.structure?.type_structure && (
                    <Badge bg="secondary" className="ms-2">
                      {selectedDocteur.structure.type_structure}
                    </Badge>
                  )}
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
                      {selectedDocteur.code_phone && `${selectedDocteur.code_phone} `}
                      {selectedDocteur.phone || 'Non renseigné'}
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
                      {selectedDocteur.email || 'Non renseigné'}
                    </span>
                  </div>
                </Col>
              </Row>

              {selectedDocteur.birthday && (
                <div className="mb-3">
                  <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Date de naissance:
                  </strong>
                  <span className={theme === "dark" ? "text-light" : "text-muted"}>
                    {new Date(selectedDocteur.birthday).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}

              {/* Informations sur la structure */}
              {selectedDocteur.structure && (
                <div className="mt-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
                  <h6 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Informations sur la structure
                  </h6>
                  <Row>
                    <Col md={6}>
                      <small className={`d-block ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        <strong>Adresse:</strong> {selectedDocteur.structure.adresse || 'Non renseignée'}
                      </small>
                    </Col>
                    <Col md={6}>
                      <small className={`d-block ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        <strong>Téléphone:</strong> {selectedDocteur.structure.telephone || 'Non renseigné'}
                      </small>
                    </Col>
                  </Row>
                  {selectedDocteur.structure.service && (
                    <small className={`d-block mt-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <strong>Services:</strong> {selectedDocteur.structure.service}
                    </small>
                  )}
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
          {selectedDocteur && (
            <Button 
              variant="primary" 
              as={Link} 
              to={`/patient/view/doctor/${selectedDocteur.id}`}
              onClick={() => setShowDetailModal(false)}
            >
              <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Prendre rendez-vous
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </PatientLayout>
  );
}