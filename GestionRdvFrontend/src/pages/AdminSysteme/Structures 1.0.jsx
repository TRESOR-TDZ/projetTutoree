import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Pagination,
  Collapse,
  Alert,
  Badge,
  Spinner,
  InputGroup,
  OverlayTrigger,
  Tooltip,
  ButtonGroup,
  Image,
} from "react-bootstrap";
import api from "../../services/api";
import publicApi from "../../services/publicApi";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import FeatherIcon from "../../components/AdminSysteme/FeatherIcon";
import 'animate.css'; 

export default function StructuresDisplay() {
  /* -------------------- États -------------------- */
  const [structures, setStructures] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 0,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    type_structure: "",
    created_at: "",
    showFilters: false,
  });
  const [viewMode, setViewMode] = useState("grid"); // grid ou list
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false); // New state for form submission loading
  const [flashMessage, setFlashMessage] = useState(null);

  /* ----- Modals ----- */
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedStructure, setSelectedStructure] = useState(null);
  const [editingStructureId, setEditingStructureId] = useState(null);
  const [deletingStructureId, setDeletingStructureId] = useState(null);

  /* ----- Form & Erreurs ----- */
  const emptyForm = {
    image: null,
    code_telephone: "+237",
    telephone: "",
    nom: "",
    email: "",
    type_structure: "",
    adresse: "",
    service: "",
    horaires_debut: "",
    horaires_fin: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  /* ----- Thème ----- */
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

  /* -------------------- Fonctions de Récupération des Données -------------------- */
  const fetchStructures = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await api.get(
          `/admin-systeme/view/structures?page=${page}`,
          { params: filters }
        );
        setStructures(data.data?.data || data.data);
        setPagination({
          current_page: data.data?.current_page,
          last_page: data.data?.last_page,
          per_page: data.data?.per_page,
          total: data.data?.total,
        });
      } catch (err) {
        console.error("Erreur lors du chargement des structures:", err);
        setFlashMessage({
          type: "danger",
          message: "Impossible de charger les structures. Veuillez réessayer."
        });
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  /* ----- Effets secondaires ----- */
  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  /* -------------------- Gestionnaires de Formulaires et Modals -------------------- */
  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setImagePreview(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && files[0]) {
      const file = files[0];
      setForm(prev => ({ ...prev, [name]: file }));

      // Créer aperçu de l'image
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormSubmitting(true);

    const payload = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val !== null && val !== "") {
        payload.append(key, val);
      }
    });

    try {
      await api.post("/admin-systeme/store/structures", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchStructures();
      setShowAddModal(false);
      resetForm();
      setFlashMessage({
        type: "success",
        message: "✨ Structure ajoutée avec succès !"
      });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setFlashMessage({
          type: "danger",
          message: "⚠️ Veuillez corriger les erreurs dans le formulaire."
        });
      } else {
        console.error("Erreur lors de l'ajout:", err);
        setFlashMessage({
          type: "danger",
          message: "❌ Erreur lors de l'ajout de la structure."
        });
      }
    } finally {
      setFormSubmitting(false);
      setTimeout(() => setFlashMessage(null), 5000);
    }
  };

  const openEditModal = async (id) => {
    setLoading(true); // Indicate loading for fetching data for edit
    try {
      const { data } = await api.get(`/admin-systeme/show/structures/${id}`);
      if (data.structure || data.data) {
        const s = data.structure || data.data;
        setForm({
          image: null, // Image should be re-uploaded for security/simplicity
          code_telephone: s.code_telephone || "+237",
          telephone: s.telephone || "",
          nom: s.nom || "",
          email: s.email || "",
          type_structure: s.type_structure || "",
          adresse: s.adresse || "",
          service: s.service || "",
          horaires_debut: s.horaires_debut || "",
          horaires_fin: s.horaires_fin || "",
        });
        setEditingStructureId(id);
        setErrors({});
        setImagePreview(null); // Clear preview for new upload
        setShowEditModal(true);
      }
    } catch (err) {
      console.error("Erreur chargement pour édition:", err);
      setFlashMessage({
        type: "danger",
        message: "❌ Impossible de charger les données pour l'édition."
      });
      setTimeout(() => setFlashMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormSubmitting(true); // Indicate loading for form submission

    const payload = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === "image") {
        if (val instanceof File) {
          payload.append(key, val);
        }
      } else if (val !== null && val !== "") {
        payload.append(key, val);
      }
    });

    payload.append("_method", "PUT"); // Laravel specific for PUT with FormData

    try {
      await api.post(`/admin-systeme/update/structures/${editingStructureId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchStructures();
      setShowEditModal(false);
      resetForm();
      setEditingStructureId(null);
      setFlashMessage({
        type: "success",
        message: "✨ Structure mise à jour avec succès !"
      });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setFlashMessage({
          type: "danger",
          message: "⚠️ Veuillez corriger les erreurs dans le formulaire."
        });
      } else {
        console.error("Erreur lors de la mise à jour:", err);
        setFlashMessage({
          type: "danger",
          message: "❌ Erreur lors de la mise à jour."
        });
      }
    } finally {
      setFormSubmitting(false);
      setTimeout(() => setFlashMessage(null), 5000);
    }
  };

  const handleShowDetails = async (id) => {
    setLoading(true); // Indicate loading for fetching details
    try {
      const { data } = await api.get(`/admin-systeme/show/structures/${id}`);
      setSelectedStructure(data.structure || data.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Erreur chargement des détails:", err);
      setFlashMessage({
        type: "danger",
        message: "❌ Impossible de charger les détails."
      });
      setTimeout(() => setFlashMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeletingStructureId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoading(true); // Indicate loading for delete operation
    try {
      await api.delete(`/admin-systeme/destroy/structures/${deletingStructureId}`);
      await fetchStructures();
      setShowDeleteModal(false);
      setDeletingStructureId(null);
      setFlashMessage({
        type: "success",
        message: "✨ Structure supprimée avec succès !"
      });
    } catch (err) {
      console.error("Erreur suppression:", err);
      setFlashMessage({
        type: "danger",
        message: "❌ Erreur lors de la suppression."
      });
    } finally {
      setLoading(false);
      setTimeout(() => setFlashMessage(null), 5000);
    }
  };

  /* ----- Gestion des filtres ----- */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchStructures(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type_structure: "",
      created_at: "",
      showFilters: false, // Hide filters when cleared
    });
    // Optional: Re-fetch structures after clearing filters
    // fetchStructures(1); // This will be triggered by useEffect due to filters change
  };

  /* ----- Pagination ----- */
  const changePage = (page) => {
    fetchStructures(page);
    setPagination(p => ({ ...p, current_page: page }));
  };

  const renderPagination = () => {
    if (pagination.last_page <= 1) return null;

    const items = [];
    const maxVisible = 5;
    let start = Math.max(1, pagination.current_page - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.last_page, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => changePage(1)}>
          1
        </Pagination.Item>
      );
      if (start > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === pagination.current_page}
          onClick={() => changePage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (end < pagination.last_page) {
      if (end < pagination.last_page - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      items.push(
        <Pagination.Item key={pagination.last_page} onClick={() => changePage(pagination.last_page)}>
          {pagination.last_page}
        </Pagination.Item>
      );
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
        <div className={`small fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
          Affichage de <strong>{pagination.per_page * (pagination.current_page - 1) + 1}</strong> à{" "}
          <strong>{Math.min(pagination.per_page * pagination.current_page, pagination.total)}</strong> sur{" "}
          <strong>{pagination.total}</strong> structures
        </div>
        <Pagination className="mb-0 shadow-sm">
          <Pagination.Prev
            disabled={pagination.current_page === 1}
            onClick={() => changePage(pagination.current_page - 1)}
            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
          />
          {items}
          <Pagination.Next
            disabled={pagination.current_page === pagination.last_page}
            onClick={() => changePage(pagination.current_page + 1)}
            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
          />
        </Pagination>
      </div>
    );
  };

  /* ----- Utilitaires ----- */
  const getStructureTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "hopital": return "primary";
      case "clinique": return "success";
      case "centre de santé": return "warning";
      case "pharmacie": return "info"; // Added another type for demo
      default: return "secondary";
    }
  };

  const getStructureTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "hopital": return "plus-square";
      case "clinique": return "heart";
      case "centre de santé": return "shield";
      case "pharmacie": return "medkit"; // Using 'medkit' (assuming it exists or choose a similar one)
      default: return "building";
    }
  };

  /* ----- Props communes pour les Modals ----- */
  const commonModalProps = {
    centered: true,
    size: "lg",
    backdrop: "static",
    contentClassName: theme === "dark"
      ? "bg-dark-card text-light border-0 shadow-lg backdrop-blur" // Using bg-dark-card for consistency
      : "border-0 shadow-xl bg-white backdrop-blur",
  };

  const commonFormControlProps = {
    className: theme === "dark"
      ? "bg-dark text-light border-secondary focus-ring-dark form-control-lg"
      : "border-2 focus-ring-primary form-control-lg bg-light",
  };

  const commonModalHeaderProps = {
    className: theme === "dark"
      ? "bg-dark text-light border-bottom border-secondary-subtle pb-3" // Added border for separation
      : "border-bottom border-light-subtle pb-3 bg-gradient-subtle", // Light subtle gradient
    closeButton: true,
  };

  const commonModalFooterProps = {
    className: theme === "dark"
      ? "bg-dark text-light border-top border-secondary-subtle pt-3" // Added border for separation
      : "border-top border-light-subtle pt-3",
  }

  // Render des cartes en mode grille
  const renderGridView = () => (
    <Row className="g-4">
      {loading ? (
        <Col xs={12} className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Chargement des structures...</span>
          </Spinner>
          <p className={`mt-3 ${theme === "dark" ? "text-light-50" : "text-muted"}`}>Chargement des structures...</p>
        </Col>
      ) : structures.length === 0 ? (
        <Col xs={12} className="text-center py-5">
          <div className={`p-4 rounded-3 ${theme === "dark" ? "bg-dark-card text-light" : "bg-light text-muted"}`}>
            <FeatherIcon icon="info" size="30" className="mb-3 text-primary" />
            <h4 className="fw-bold">Aucune structure trouvée</h4>
            <p className="mb-0">Ajustez vos filtres ou ajoutez une nouvelle structure.</p>
          </div>
        </Col>
      ) : (
        structures.map((structure) => (
          <Col key={structure.id} sm={12} md={6} lg={4} xl={3} className="mb-4">
            <Card
              className={`h-100 border-0 shadow-hover position-relative overflow-hidden ${
                theme === "dark"
                  ? "bg-dark-card backdrop-blur border-secondary-subtle"
                  : "bg-white shadow-sm"
              }`}
              style={{
                borderRadius: "20px",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow = theme === "dark"
                  ? "0 20px 40px rgba(0,0,0,0.4)"
                  : "0 20px 40px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              {/* Gradient overlay */}
              <div
                className="position-absolute w-100 h-100"
                style={{
                  background: `linear-gradient(135deg, ${
                    theme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.95)"
                  } 0%, transparent 50%)`,
                  zIndex: 1,
                  pointerEvents: "none"
                }}
              />

              <div className="position-relative">
                <Card.Img
                  variant="top"
                  src={
                    structure.image
                      ? `${publicApi.defaults.baseURL}/storage/structures/${structure.image}`
                      : `${publicApi.defaults.baseURL}/storage/structures/placeholder.png`
                  }
                  style={{
                    height: "220px",
                    objectFit: "cover",
                    filter: theme === "dark" ? "brightness(0.9) contrast(1.1)" : "none",
                    cursor: "pointer", // Indicate clickable
                  }}
                  alt={structure.nom}
                  onClick={() => handleShowDetails(structure.id)}
                />

                {/* Badge de type flottant */}
                <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 2 }}>
                  <Badge
                    bg={getStructureTypeColor(structure.type_structure)}
                    className="shadow-lg px-3 py-2 rounded-pill fw-semibold"
                    style={{
                      backdropFilter: "blur(10px)",
                      fontSize: "0.75rem",
                    }}
                  >
                    <FeatherIcon
                      icon={getStructureTypeIcon(structure.type_structure)}
                      className="me-2"
                      style={{ width: "14px", height: "14px" }}
                    />
                    {structure.type_structure}
                  </Badge>
                </div>

                {/* Actions flottantes */}
                <div className="position-absolute top-0 start-0 m-3" style={{ zIndex: 2 }}>
                  <ButtonGroup size="sm" className="shadow-sm">
                    <OverlayTrigger placement="top" overlay={<Tooltip>Voir détails</Tooltip>}>
                      <Button
                        variant={theme === "dark" ? "dark" : "light"}
                        className="btn-icon rounded-circle"
                        onClick={() => handleShowDetails(structure.id)}
                        style={{ backdropFilter: "blur(10px)" }}
                      >
                        <FeatherIcon icon="eye" style={{ width: "16px", height: "16px" }} />
                      </Button>
                    </OverlayTrigger>
                  </ButtonGroup>
                </div>
              </div>

              <Card.Body className="p-4 position-relative" style={{ zIndex: 2 }}>
                <div className="mb-3">
                  <Card.Title
                    className={`fw-bold mb-2 text-truncate ${theme === "dark" ? "text-light" : "text-dark"}`}
                    style={{ fontSize: "1.25rem" }}
                  >
                    {structure.nom}
                  </Card.Title>

                  <div className="space-y-2">
                    <div className={`small d-flex align-items-center mb-2 ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                      <div className={`p-1 rounded-circle me-2 ${theme === "dark" ? "bg-primary-subtle" : "bg-primary-subtle"}`}>
                        <FeatherIcon icon="mail" style={{ width: "12px", height: "12px" }} className="text-primary" />
                      </div>
                      <span className="text-truncate fw-medium">{structure.email}</span>
                    </div>

                    <div className={`small d-flex align-items-center mb-2 ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                      <div className={`p-1 rounded-circle me-2 ${theme === "dark" ? "bg-success-subtle" : "bg-success-subtle"}`}>
                        <FeatherIcon icon="phone" style={{ width: "12px", height: "12px" }} className="text-success" />
                      </div>
                      <span className="fw-medium">{structure.code_telephone} {structure.telephone}</span>
                    </div>

                    {structure.adresse && (
                      <div className={`small d-flex align-items-center mb-2 ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                        <div className={`p-1 rounded-circle me-2 ${theme === "dark" ? "bg-warning-subtle" : "bg-warning-subtle"}`}>
                          <FeatherIcon icon="map-pin" style={{ width: "12px", height: "12px" }} className="text-warning" />
                        </div>
                        <span className="text-truncate fw-medium">{structure.adresse}</span>
                      </div>
                    )}

                    {(structure.horaires_debut && structure.horaires_fin) && (
                      <div className={`small d-flex align-items-center ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                        <div className={`p-1 rounded-circle me-2 ${theme === "dark" ? "bg-info-subtle" : "bg-info-subtle"}`}>
                          <FeatherIcon icon="clock" style={{ width: "12px", height: "12px" }} className="text-info" />
                        </div>
                        <span className="fw-medium">
                          {structure.horaires_debut} - {structure.horaires_fin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>

              <Card.Footer className="bg-transparent border-0 p-4 pt-0">
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="flex-grow-1 fw-semibold rounded-pill"
                    onClick={() => openEditModal(structure.id)}
                  >
                    <FeatherIcon icon="edit-2" className="me-2" style={{ width: "14px", height: "14px" }} />
                    Modifier
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="rounded-pill"
                    onClick={() => openDeleteModal(structure.id)}
                  >
                    <FeatherIcon icon="trash-2" style={{ width: "14px", height: "14px" }} />
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        ))
      )}
    </Row>
  );

  // Render des cartes en mode liste
  const renderListView = () => (
    <div className="space-y-3">
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Chargement des structures...</span>
          </Spinner>
          <p className={`mt-3 ${theme === "dark" ? "text-light-50" : "text-muted"}`}>Chargement des structures...</p>
        </div>
      ) : structures.length === 0 ? (
        <div className={`p-4 rounded-3 text-center ${theme === "dark" ? "bg-dark-card text-light" : "bg-light text-muted"}`}>
            <FeatherIcon icon="info" size="30" className="mb-3 text-primary" />
            <h4 className="fw-bold">Aucune structure trouvée</h4>
            <p className="mb-0">Ajustez vos filtres ou ajoutez une nouvelle structure.</p>
          </div>
      ) : (
        structures.map((structure) => (
          <Card
            key={structure.id}
            className={`border-0 shadow-sm hover-shadow-lg ${
              theme === "dark"
                ? "bg-dark-card border-secondary-subtle"
                : "bg-white"
            }`}
            style={{
              borderRadius: "16px",
              transition: "all 0.3s ease",
            }}
          >
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={2} className="text-center">
                  <img
                    src={
                      structure.image
                        ? `${publicApi.defaults.baseURL}/storage/structures/${structure.image}`
                        : `${publicApi.defaults.baseURL}/storage/structures/placeholder.png`
                    }
                    alt={structure.nom}
                    className="rounded-3 shadow-sm"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover"
                    }}
                  />
                </Col>

                <Col md={6}>
                  <div className="d-flex align-items-center mb-2">
                    <h5 className={`mb-0 me-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {structure.nom}
                    </h5>
                    <Badge
                      bg={getStructureTypeColor(structure.type_structure)}
                      className="rounded-pill px-3 py-1"
                    >
                      <FeatherIcon
                        icon={getStructureTypeIcon(structure.type_structure)}
                        className="me-1"
                        style={{ width: "12px", height: "12px" }}
                      />
                      {structure.type_structure}
                    </Badge>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className={`small ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                        <FeatherIcon icon="mail" className="me-2" style={{ width: "14px", height: "14px" }} />
                        {structure.email}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className={`small ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                        <FeatherIcon icon="phone" className="me-2" style={{ width: "14px", height: "14px" }} />
                        {structure.code_telephone} {structure.telephone}
                      </div>
                    </div>
                  </div>

                  {structure.adresse && (
                    <div className={`small mt-2 ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                      <FeatherIcon icon="map-pin" className="me-2" style={{ width: "14px", height: "14px" }} />
                      {structure.adresse}
                    </div>
                  )}
                </Col>

                <Col md={4} className="text-end">
                  <div className="d-flex gap-2 justify-content-end flex-wrap">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill"
                      onClick={() => handleShowDetails(structure.id)}
                    >
                      <FeatherIcon icon="eye" className="me-2" style={{ width: "14px", height: "14px" }} />
                      Détails
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="rounded-pill"
                      onClick={() => openEditModal(structure.id)}
                    >
                      <FeatherIcon icon="edit-2" style={{ width: "14px", height: "14px" }} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="rounded-pill"
                      onClick={() => openDeleteModal(structure.id)}
                    >
                      <FeatherIcon icon="trash-2" style={{ width: "14px", height: "14px" }} />
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );

  /* -------------------- Render -------------------- */
  return (
    <AdminSystemeLayout>
      <Container fluid className="px-4 py-3">
        {/* Header moderne avec gradient et glassmorphism */}
        <div className="position-relative mb-5">
          <div
            className={`rounded-5 p-5 position-relative overflow-hidden ${
              theme === "dark"
                ? "bg-dark border border-secondary-subtle"
                : "bg-primary-gradient"
            }`}
            style={{
              background: theme === "dark"
                ? "linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Formes décoratives */}
            <div
              className="position-absolute opacity-10"
              style={{
                top: "-50px",
                right: "-50px",
                width: "200px",
                height: "200px",
                background: theme === "dark" ? "#4a5568" : "rgba(255,255,255,0.2)",
                borderRadius: "50%",
              }}
            />
            <div
              className="position-absolute opacity-10"
              style={{
                bottom: "-30px",
                left: "-30px",
                width: "150px",
                height: "150px",
                background: theme === "dark" ? "#4a5568" : "rgba(255,255,255,0.15)",
                borderRadius: "50%",
              }}
            />

            <Row className="align-items-center position-relative">
              <Col lg={8}>
                <div className="d-flex align-items-center mb-3">
                  <div
                    className={`p-3 rounded-4 me-4 ${
                      theme === "dark" ? "bg-primary-subtle" : "bg-white bg-opacity-20"
                    }`}
                  >
                    <FeatherIcon
                      icon="plus-square"
                      className={`fs-2 ${theme === "dark" ? "text-primary" : "text-white"}`}
                    />
                  </div>
                  <div>
                    <h1 className={`mb-1 fw-bold ${theme === "dark" ? "text-white" : "text-white"}`}>
                      Gestion des Structures
                    </h1>
                    <p className={`mb-0 ${theme === "dark" ? "text-light opacity-75" : "text-white-50"}`}>
                      Ajoutez, modifiez ou supprimez des structures de santé
                    </p>
                  </div>
                </div>
              </Col>
              <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
                <Button
                  variant={theme === "dark" ? "outline-light" : "white"}
                  className={`py-3 px-4 rounded-pill shadow-sm fw-bold ${
                    theme === "dark" ? "text-primary border-primary" : "text-primary"
                  }`}
                  onClick={openAddModal}
                >
                  <FeatherIcon icon="plus-circle" className="me-2" />
                  Ajouter une structure
                </Button>
              </Col>
            </Row>
          </div>
        </div>

        {flashMessage && (
          <Alert
            variant={flashMessage.type}
            onClose={() => setFlashMessage(null)}
            dismissible
            className="shadow-sm animate__animated animate__fadeInDown"
          >
            {flashMessage.message}
          </Alert>
        )}

        {/* Barre de recherche et filtres */}
        <Card className={`mb-4 shadow-sm border-0 ${theme === "dark" ? "bg-dark-card border-secondary-subtle" : "bg-white"}`}
          style={{ borderRadius: "1rem" }}
        >
          <Card.Body className="p-4">
            <Row className="align-items-center g-3">
              <Col lg={filters.showFilters ? 12 : 6}>
                <InputGroup className="shadow-sm-light">
                  <InputGroup.Text
                    className={`${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light border-light"}`}
                  >
                    <FeatherIcon icon="search" style={{ width: "18px", height: "18px" }} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par nom, email, adresse..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                    {...commonFormControlProps}
                    className={`${commonFormControlProps.className} rounded-end`}
                  />
                  <Button
                    variant={theme === "dark" ? "outline-secondary" : "outline-primary"}
                    className="ms-2 rounded-pill px-3" // Rounded for consistency
                    onClick={applyFilters}
                  >
                    Rechercher
                  </Button>
                </InputGroup>
              </Col>

              {!filters.showFilters && (
                <Col lg={6} className="d-flex justify-content-end align-items-center gap-3">
                  <ButtonGroup className="shadow-sm">
                    <OverlayTrigger placement="top" overlay={<Tooltip>Mode Grille</Tooltip>}>
                      <Button
                        variant={viewMode === "grid" ? "primary" : (theme === "dark" ? "dark" : "light")}
                        onClick={() => setViewMode("grid")}
                        className={`btn-icon ${theme === "dark" && viewMode !== "grid" ? "border-secondary text-light" : ""}`}
                      >
                        <FeatherIcon icon="grid" />
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Mode Liste</Tooltip>}>
                      <Button
                        variant={viewMode === "list" ? "primary" : (theme === "dark" ? "dark" : "light")}
                        onClick={() => setViewMode("list")}
                        className={`btn-icon ${theme === "dark" && viewMode !== "list" ? "border-secondary text-light" : ""}`}
                      >
                        <FeatherIcon icon="list" />
                      </Button>
                    </OverlayTrigger>
                  </ButtonGroup>

                  <Button
                    variant={theme === "dark" ? "outline-secondary" : "outline-primary"}
                    onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                    className="rounded-pill px-3 fw-semibold" // Added rounded-pill for consistency
                  >
                    <FeatherIcon icon="filter" className="me-2" />
                    Filtres
                  </Button>
                </Col>
              )}
            </Row>

            {/* Collapse des filtres avancés */}
            <Collapse in={filters.showFilters}>
              <div className="mt-4 pt-3 border-top border-light-subtle"> {/* Added border-top for separation */}
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group controlId="type_structure_filter">
                      <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                        Type de Structure
                      </Form.Label>
                      <Form.Select
                        name="type_structure"
                        value={filters.type_structure}
                        onChange={(e) => handleFilterChange("type_structure", e.target.value)}
                        {...commonFormControlProps}
                      >
                        <option value="">Tous les types</option>
                        <option value="Hopital">Hôpital</option>
                        <option value="Clinique">Clinique</option>
                        <option value="Centre de Santé">Centre de Santé</option>
                        <option value="Pharmacie">Pharmacie</option> {/* Added for example */}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="created_at_filter">
                      <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>
                        Date de Création
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="created_at"
                        value={filters.created_at}
                        onChange={(e) => handleFilterChange("created_at", e.target.value)}
                        {...commonFormControlProps}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      onClick={applyFilters}
                      className="flex-grow-1 rounded-pill fw-semibold me-2"
                    >
                      <FeatherIcon icon="check-circle" className="me-2" /> Appliquer
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={clearFilters}
                      className="rounded-pill px-3"
                    >
                      <FeatherIcon icon="x-circle" /> Réinitialiser
                    </Button>
                  </Col>
                </Row>
              </div>
            </Collapse>
          </Card.Body>
        </Card>

        {/* Affichage des Structures (Grille ou Liste) */}
        {viewMode === "grid" ? renderGridView() : renderListView()}

        {/* Pagination */}
        {renderPagination()}
      </Container>

      {/* Modal Ajout Structure */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} {...commonModalProps}>
        <Modal.Header {...commonModalHeaderProps}>
          <Modal.Title className="fw-bold">Ajouter une Nouvelle Structure</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="nom">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Nom de la Structure</Form.Label>
                  <Form.Control
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleFormChange}
                    isInvalid={!!errors.nom}
                    {...commonFormControlProps}
                  />
                  <Form.Control.Feedback type="invalid">{errors.nom}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="email">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    isInvalid={!!errors.email}
                    {...commonFormControlProps}
                  />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="type_structure">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Type de Structure</Form.Label>
                  <Form.Select
                    name="type_structure"
                    value={form.type_structure}
                    onChange={handleFormChange}
                    isInvalid={!!errors.type_structure}
                    {...commonFormControlProps}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="Hopital">Hôpital</option>
                    <option value="Clinique">Clinique</option>
                    <option value="Centre de Santé">Centre de Santé</option>
                    <option value="Pharmacie">Pharmacie</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.type_structure}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="adresse">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Adresse</Form.Label>
                  <Form.Control
                    type="text"
                    name="adresse"
                    value={form.adresse}
                    onChange={handleFormChange}
                    isInvalid={!!errors.adresse}
                    {...commonFormControlProps}
                  />
                  <Form.Control.Feedback type="invalid">{errors.adresse}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="telephone">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Téléphone</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className={theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light border-light"}>
                      <Form.Control
                        as="select"
                        name="code_telephone"
                        value={form.code_telephone}
                        onChange={handleFormChange}
                        isInvalid={!!errors.code_telephone}
                        className={theme === "dark" ? "bg-dark text-light border-0" : "bg-light border-0"}
                        style={{ width: "fit-content", appearance: "none" }}
                      >
                        <option value="+237">+237 (CM)</option>
                        <option value="+1">+1 (US/CA)</option>
                        <option value="+33">+33 (FR)</option>
                        {/* Add more as needed */}
                      </Form.Control>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="telephone"
                      value={form.telephone}
                      onChange={handleFormChange}
                      isInvalid={!!errors.telephone}
                      {...commonFormControlProps}
                      className={`${commonFormControlProps.className} rounded-end`}
                    />
                    <Form.Control.Feedback type="invalid">{errors.telephone}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="service">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Service (optionnel)</Form.Label>
                  <Form.Control
                    type="text"
                    name="service"
                    value={form.service}
                    onChange={handleFormChange}
                    isInvalid={!!errors.service}
                    {...commonFormControlProps}
                  />
                  <Form.Control.Feedback type="invalid">{errors.service}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="horaires_debut">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Heure d'ouverture</Form.Label>
                  <Form.Control
                    type="time"
                    name="horaires_debut"
                    value={form.horaires_debut}
                    onChange={handleFormChange}
                    isInvalid={!!errors.horaires_debut}
                    {...commonFormControlProps}
                  />
                  <Form.Control.Feedback type="invalid">{errors.horaires_debut}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="horaires_fin">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Heure de fermeture</Form.Label>
                  <Form.Control
                    type="time"
                    name="horaires_fin"
                    value={form.horaires_fin}
                    onChange={handleFormChange}
                    isInvalid={!!errors.horaires_fin}
                    {...commonFormControlProps}
                  />
                  <Form.Control.Feedback type="invalid">{errors.horaires_fin}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId="image">
                  <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Image</Form.Label>
                  <Form.Control
                    type="file"
                    name="image"
                    onChange={handleFormChange}
                    isInvalid={!!errors.image}
                    {...commonFormControlProps}
                  />
                  <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                  {imagePreview && (
                    <div className="mt-3 text-center">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="img-thumbnail rounded-3"
                        style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "cover" }}
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer {...commonModalFooterProps}>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={formSubmitting} className="rounded-pill px-4">
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={formSubmitting} className="rounded-pill px-4">
              {formSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <FeatherIcon icon="save" className="me-2" /> Enregistrer
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Modifier Structure */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} {...commonModalProps}>
        <Modal.Header {...commonModalHeaderProps}>
          <Modal.Title className="fw-bold">Modifier la Structure</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className={`mt-2 ${theme === "dark" ? "text-light-50" : "text-muted"}`}>Chargement des données...</p>
              </div>
            ) : (
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group controlId="edit_nom">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Nom de la Structure</Form.Label>
                    <Form.Control
                      type="text"
                      name="nom"
                      value={form.nom}
                      onChange={handleFormChange}
                      isInvalid={!!errors.nom}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.nom}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="edit_email">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      isInvalid={!!errors.email}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="edit_type_structure">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Type de Structure</Form.Label>
                    <Form.Select
                      name="type_structure"
                      value={form.type_structure}
                      onChange={handleFormChange}
                      isInvalid={!!errors.type_structure}
                      {...commonFormControlProps}
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="Hopital">Hôpital</option>
                      <option value="Clinique">Clinique</option>
                      <option value="Centre de Santé">Centre de Santé</option>
                      <option value="Pharmacie">Pharmacie</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.type_structure}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="edit_adresse">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Adresse</Form.Label>
                    <Form.Control
                      type="text"
                      name="adresse"
                      value={form.adresse}
                      onChange={handleFormChange}
                      isInvalid={!!errors.adresse}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.adresse}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="edit_telephone">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Téléphone</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className={theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light border-light"}>
                        <Form.Control
                          as="select"
                          name="code_telephone"
                          value={form.code_telephone}
                          onChange={handleFormChange}
                          isInvalid={!!errors.code_telephone}
                          className={theme === "dark" ? "bg-dark text-light border-0" : "bg-light border-0"}
                          style={{ width: "fit-content", appearance: "none" }}
                        >
                          <option value="+237">+237 (CM)</option>
                          <option value="+1">+1 (US/CA)</option>
                          <option value="+33">+33 (FR)</option>
                          {/* Add more as needed */}
                        </Form.Control>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="telephone"
                        value={form.telephone}
                        onChange={handleFormChange}
                        isInvalid={!!errors.telephone}
                        {...commonFormControlProps}
                        className={`${commonFormControlProps.className} rounded-end`}
                      />
                      <Form.Control.Feedback type="invalid">{errors.telephone}</Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="edit_service">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Service (optionnel)</Form.Label>
                    <Form.Control
                      type="text"
                      name="service"
                      value={form.service}
                      onChange={handleFormChange}
                      isInvalid={!!errors.service}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.service}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="edit_horaires_debut">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Heure d'ouverture</Form.Label>
                    <Form.Control
                      type="time"
                      name="horaires_debut"
                      value={form.horaires_debut}
                      onChange={handleFormChange}
                      isInvalid={!!errors.horaires_debut}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.horaires_debut}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="edit_horaires_fin">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Heure de fermeture</Form.Label>
                    <Form.Control
                      type="time"
                      name="horaires_fin"
                      value={form.horaires_fin}
                      onChange={handleFormChange}
                      isInvalid={!!errors.horaires_fin}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.horaires_fin}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="edit_image">
                    <Form.Label className={`fw-medium ${theme === "dark" ? "text-light opacity-75" : "text-muted"}`}>Image (laissez vide pour garder l'actuelle)</Form.Label>
                    <Form.Control
                      type="file"
                      name="image"
                      onChange={handleFormChange}
                      isInvalid={!!errors.image}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                    {imagePreview && (
                      <div className="mt-3 text-center">
                        <p className={`small ${theme === "dark" ? "text-light-50" : "text-muted"}`}>Nouvel aperçu:</p>
                        <img
                          src={imagePreview}
                          alt="Nouvel aperçu"
                          className="img-thumbnail rounded-3"
                          style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                    {!imagePreview && selectedStructure?.image && ( // Show current image if no new one
                      <div className="mt-3 text-center">
                        <p className={`small ${theme === "dark" ? "text-light-50" : "text-muted"}`}>Image actuelle:</p>
                        <Image
                          src={`${publicApi.defaults.baseURL}/storage/structures/${selectedStructure.image}`}
                          alt="Image actuelle"
                          className="img-thumbnail rounded-3"
                          style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer {...commonModalFooterProps}>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={formSubmitting} className="rounded-pill px-4">
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={formSubmitting} className="rounded-pill px-4">
              {formSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <FeatherIcon icon="save" className="me-2" /> Enregistrer les modifications
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Détails Structure */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} {...commonModalProps}>
        <Modal.Header {...commonModalHeaderProps}>
          <Modal.Title className="fw-bold">Détails de la Structure</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading || !selectedStructure ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className={`mt-2 ${theme === "dark" ? "text-light-50" : "text-muted"}`}>Chargement des détails...</p>
            </div>
          ) : (
            <Row className="g-4 align-items-center">
              <Col md={4} className="text-center">
                <Card className={`h-100 border-0 ${theme === "dark" ? "bg-dark-card" : "bg-light"}`}>
                  <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
                    <img
                      src={
                        selectedStructure.image
                          ? `${publicApi.defaults.baseURL}/storage/structures/${selectedStructure.image}`
                          : `${publicApi.defaults.baseURL}/storage/structures/placeholder.png`
                      }
                      alt={selectedStructure.nom}
                      className="rounded-circle shadow-lg mb-3"
                      style={{ width: "120px", height: "120px", objectFit: "cover", border: `3px solid ${theme === "dark" ? "var(--bs-primary)" : "var(--bs-primary)"}` }}
                    />
                    <h5 className={`mb-1 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>{selectedStructure.nom}</h5>
                    <Badge
                      bg={getStructureTypeColor(selectedStructure.type_structure)}
                      className="rounded-pill px-3 py-1 fw-semibold mt-2"
                    >
                      <FeatherIcon
                        icon={getStructureTypeIcon(selectedStructure.type_structure)}
                        className="me-1"
                        style={{ width: "12px", height: "12px" }}
                      />
                      {selectedStructure.type_structure}
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={8}>
                <div className={`details-list ${theme === "dark" ? "text-light-75" : "text-dark-75"}`}>
                  <h6 className={`fw-bold mb-3 ${theme === "dark" ? "text-light" : "text-primary"}`}>Informations Générales</h6>
                  <ul className="list-unstyled space-y-2">
                    <li className="d-flex align-items-center mb-2">
                      <FeatherIcon icon="mail" className={`me-3 text-primary`} style={{ minWidth: '20px' }} />
                      <span className="fw-medium">Email:</span> <span className="ms-2">{selectedStructure.email}</span>
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <FeatherIcon icon="phone" className={`me-3 text-success`} style={{ minWidth: '20px' }} />
                      <span className="fw-medium">Téléphone:</span> <span className="ms-2">{selectedStructure.code_telephone} {selectedStructure.telephone}</span>
                    </li>
                    {selectedStructure.adresse && (
                      <li className="d-flex align-items-center mb-2">
                        <FeatherIcon icon="map-pin" className={`me-3 text-warning`} style={{ minWidth: '20px' }} />
                        <span className="fw-medium">Adresse:</span> <span className="ms-2">{selectedStructure.adresse}</span>
                      </li>
                    )}
                    {selectedStructure.service && (
                      <li className="d-flex align-items-center mb-2">
                        <FeatherIcon icon="tool" className={`me-3 text-info`} style={{ minWidth: '20px' }} />
                        <span className="fw-medium">Service:</span> <span className="ms-2">{selectedStructure.service}</span>
                      </li>
                    )}
                    {(selectedStructure.horaires_debut && selectedStructure.horaires_fin) && (
                      <li className="d-flex align-items-center mb-2">
                        <FeatherIcon icon="clock" className={`me-3 text-secondary`} style={{ minWidth: '20px' }} />
                        <span className="fw-medium">Horaires:</span> <span className="ms-2">{selectedStructure.horaires_debut} - {selectedStructure.horaires_fin}</span>
                      </li>
                    )}
                    <li className="d-flex align-items-center">
                      <FeatherIcon icon="calendar" className={`me-3 text-danger`} style={{ minWidth: '20px' }} />
                      <span className="fw-medium">Créée le:</span> <span className="ms-2">{new Date(selectedStructure.created_at).toLocaleDateString()}</span>
                    </li>
                  </ul>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer {...commonModalFooterProps}>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)} className="rounded-pill px-4">
            Fermer
          </Button>
          <Button variant="primary" onClick={() => {
            setShowDetailsModal(false);
            openEditModal(selectedStructure.id);
          }} className="rounded-pill px-4">
            <FeatherIcon icon="edit-2" className="me-2" /> Modifier
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Confirmation de Suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} {...commonModalProps}>
        <Modal.Header {...commonModalHeaderProps}>
          <Modal.Title className="fw-bold">Confirmation de Suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          Êtes-vous sûr de vouloir supprimer cette structure ? Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer {...commonModalFooterProps}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading} className="rounded-pill px-4">
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading} className="rounded-pill px-4">
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Suppression...
              </>
            ) : (
              <>
                <FeatherIcon icon="trash-2" className="me-1" /> Supprimer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminSystemeLayout>
  );
}