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

  // const commonFormControlProps = {
  //   className: theme === "dark"
  //     ? "bg-dark text-light border-secondary focus-ring-dark form-control-lg"
  //     : "border-2 focus-ring-primary form-control-lg bg-light",
  // };

  // const commonModalHeaderProps = {
  //   className: theme === "dark"
  //     ? "bg-dark text-light border-bottom border-secondary-subtle pb-3" // Added border for separation
  //     : "border-bottom border-light-subtle pb-3 bg-gradient-subtle", // Light subtle gradient
  //   closeButton: true,
  // };

  // const commonModalFooterProps = {
  //   className: theme === "dark"
  //     ? "bg-dark text-light border-top border-secondary-subtle pt-3" // Added border for separation
  //     : "border-top border-light-subtle pt-3",
  // }

  // Render des cartes en mode grille
  const renderGridView = () => (
  <Row className="g-4">
    {loading ? (
      <Col xs={12} className="text-center py-5">
        <div className="d-flex flex-column align-items-center">
          <div 
            className={`spinner-border ${theme === "dark" ? "text-primary" : "text-primary"}`}
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Chargement des structures...</span>
          </div>
          <div className="mt-4">
            <h5 className={`fw-medium mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
              Chargement en cours
            </h5>
            <p className={`mb-0 ${theme === "dark" ? "text-light-50" : "text-muted"}`}>
              Veuillez patienter pendant que nous récupérons les données...
            </p>
          </div>
        </div>
      </Col>
    ) : structures.length === 0 ? (
      <Col xs={12} className="text-center py-5">
        <div 
          className={`p-5 rounded-4 border ${
            theme === "dark" 
              ? "bg-dark-subtle border-secondary-subtle text-light" 
              : "bg-light border-light-subtle text-dark"
          }`}
          style={{
            backdropFilter: "blur(10px)",
            boxShadow: theme === "dark" 
              ? "0 8px 32px rgba(0,0,0,0.3)" 
              : "0 8px 32px rgba(0,0,0,0.08)"
          }}
        >
          <div 
            className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-4 ${
              theme === "dark" ? "bg-primary-subtle" : "bg-primary-subtle"
            }`}
            style={{ width: "80px", height: "80px" }}
          >
            <FeatherIcon icon="database" size="32" className="text-primary" />
          </div>
          <h4 className="fw-bold mb-3">Aucune structure disponible</h4>
          <p className={`mb-4 fs-6 ${theme === "dark" ? "text-light-50" : "text-muted"}`}>
            Il semble qu'aucune structure ne corresponde à vos critères de recherche actuels.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Button variant="primary" size="sm" className="rounded-pill px-4">
              <FeatherIcon icon="plus" className="me-2" style={{ width: "16px", height: "16px" }} />
              Ajouter une structure
            </Button>
            <Button variant="outline-secondary" size="sm" className="rounded-pill px-4">
              <FeatherIcon icon="refresh-cw" className="me-2" style={{ width: "16px", height: "16px" }} />
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      </Col>
    ) : (
      structures.map((structure) => (
        <Col key={structure.id} sm={12} md={6} lg={4} xl={3} className="mb-4">
          <Card
            className={`h-100 border-0 position-relative overflow-hidden structure-card ${
              theme === "dark"
                ? "bg-dark text-light shadow-dark"
                : "bg-white shadow"
            }`}
            style={{
              borderRadius: "16px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              boxShadow: theme === "dark" 
                ? "0 4px 20px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)" 
                : "0 4px 20px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px)";
              e.currentTarget.style.boxShadow = theme === "dark"
                ? "0 20px 40px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)"
                : "0 20px 40px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = theme === "dark" 
                ? "0 4px 20px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)" 
                : "0 4px 20px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)";
            }}
          >
            {/* Image avec overlay professionnel */}
            <div className="position-relative" style={{ height: "200px" }}>
              <Card.Img
                variant="top"
                src={
                  structure.image
                    ? `${publicApi.defaults.baseURL}/storage/structures/${structure.image}`
                    : `${publicApi.defaults.baseURL}/storage/structures/placeholder.png`
                }
                style={{
                  height: "100%",
                  objectFit: "cover",
                  filter: theme === "dark" ? "brightness(0.85) contrast(1.1)" : "brightness(1) contrast(1.05)",
                }}
                alt={structure.nom}
                onClick={() => handleShowDetails(structure.id)}
              />

              {/* Overlay gradient subtil */}
              <div
                className="position-absolute w-100 h-100 top-0 start-0"
                style={{
                  background: `linear-gradient(180deg, transparent 0%, ${
                    theme === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)"
                  } 100%)`,
                  pointerEvents: "none"
                }}
              />

              {/* Badge de type redesigné */}
              <div className="position-absolute top-0 end-0 m-3">
                <Badge
                  bg="none"
                  className={`shadow-sm px-3 py-2 rounded-pill fw-medium border ${
                    theme === "dark" 
                      ? "bg-dark bg-opacity-75 text-light border-secondary-subtle" 
                      : "bg-white bg-opacity-90 text-dark border-light-subtle"
                  }`}
                  style={{
                    backdropFilter: "blur(10px)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.5px"
                  }}
                >
                  <FeatherIcon
                    icon={getStructureTypeIcon(structure.type_structure)}
                    className="me-2"
                    style={{ width: "12px", height: "12px" }}
                  />
                  {structure.type_structure}
                </Badge>
              </div>

              {/* Actions flottantes redesignées */}
              <div className="position-absolute top-0 start-0 m-3">
                <OverlayTrigger placement="top" overlay={<Tooltip>Voir les détails</Tooltip>}>
                  <Button
                    variant="none"
                    size="sm"
                    className={`rounded-circle p-2 border-0 ${
                      theme === "dark" 
                        ? "bg-dark bg-opacity-75 text-light" 
                        : "bg-white bg-opacity-90 text-dark"
                    }`}
                    onClick={() => handleShowDetails(structure.id)}
                    style={{
                      backdropFilter: "blur(10px)",
                      width: "36px",
                      height: "36px",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <FeatherIcon icon="eye" style={{ width: "16px", height: "16px" }} />
                  </Button>
                </OverlayTrigger>
              </div>
            </div>

            {/* Corps de la carte */}
            <Card.Body className="p-4">
              <div className="mb-3">
                <Card.Title
                  className={`fw-bold mb-3 lh-sm ${theme === "dark" ? "text-light" : "text-dark"}`}
                  style={{ 
                    fontSize: "1.1rem",
                    lineHeight: "1.3",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}
                >
                  {structure.nom}
                </Card.Title>

                <div className="vstack gap-2">
                  {/* Email */}
                  <div className={`small d-flex align-items-start ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <div 
                      className={`me-3 mt-1 d-flex align-items-center justify-content-center rounded ${
                        theme === "dark" ? "bg-primary bg-opacity-20" : "bg-primary bg-opacity-10"
                      }`}
                      style={{ width: "24px", height: "24px", minWidth: "24px" }}
                    >
                      <FeatherIcon icon="mail" style={{ width: "12px", height: "12px" }} className="text-primary" />
                    </div>
                    <span 
                      className="fw-medium text-truncate"
                      style={{ fontSize: "0.85rem" }}
                      title={structure.email}
                    >
                      {structure.email}
                    </span>
                  </div>

                  {/* Téléphone */}
                  <div className={`small d-flex align-items-center ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <div 
                      className={`me-3 d-flex align-items-center justify-content-center rounded ${
                        theme === "dark" ? "bg-success bg-opacity-20" : "bg-success bg-opacity-10"
                      }`}
                      style={{ width: "24px", height: "24px", minWidth: "24px" }}
                    >
                      <FeatherIcon icon="phone" style={{ width: "12px", height: "12px" }} className="text-success" />
                    </div>
                    <span className="fw-medium" style={{ fontSize: "0.85rem" }}>
                      {structure.code_telephone} {structure.telephone}
                    </span>
                  </div>

                  {/* Adresse */}
                  {structure.adresse && (
                    <div className={`small d-flex align-items-start ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <div 
                        className={`me-3 mt-1 d-flex align-items-center justify-content-center rounded ${
                          theme === "dark" ? "bg-warning bg-opacity-20" : "bg-warning bg-opacity-10"
                        }`}
                        style={{ width: "24px", height: "24px", minWidth: "24px" }}
                      >
                        <FeatherIcon icon="map-pin" style={{ width: "12px", height: "12px" }} className="text-warning" />
                      </div>
                      <span 
                        className="fw-medium text-truncate"
                        style={{ fontSize: "0.85rem" }}
                        title={structure.adresse}
                      >
                        {structure.adresse}
                      </span>
                    </div>
                  )}

                  {/* Horaires */}
                  {(structure.horaires_debut && structure.horaires_fin) && (
                    <div className={`small d-flex align-items-center ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <div 
                        className={`me-3 d-flex align-items-center justify-content-center rounded ${
                          theme === "dark" ? "bg-info bg-opacity-20" : "bg-info bg-opacity-10"
                        }`}
                        style={{ width: "24px", height: "24px", minWidth: "24px" }}
                      >
                        <FeatherIcon icon="clock" style={{ width: "12px", height: "12px" }} className="text-info" />
                      </div>
                      <span className="fw-medium" style={{ fontSize: "0.85rem" }}>
                        {structure.horaires_debut} - {structure.horaires_fin}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>

            {/* Footer avec actions */}
            <Card.Footer 
              className={`bg-transparent border-0 p-4 pt-0 ${
                theme === "dark" ? "border-secondary-subtle" : "border-light-subtle"
              }`}
            >
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-grow-1 fw-medium rounded-pill border-0"
                  onClick={() => openEditModal(structure.id)}
                  style={{
                    background: "linear-gradient(135deg, var(--bs-primary), var(--bs-primary-dark, #0d6efd))",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FeatherIcon icon="edit-2" className="me-2" style={{ width: "14px", height: "14px" }} />
                  Modifier
                </Button>
                <OverlayTrigger placement="top" overlay={<Tooltip>Supprimer</Tooltip>}>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="rounded-pill px-3"
                    onClick={() => openDeleteModal(structure.id)}
                    style={{ transition: "all 0.2s ease" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <FeatherIcon icon="trash-2" style={{ width: "14px", height: "14px" }} />
                  </Button>
                </OverlayTrigger>
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
  <div className="structures-list">
    {loading ? (
      <div className="loading-container">
        <div className="loading-content">
          <Spinner 
            animation="border" 
            role="status" 
            variant="primary"
            className="loading-spinner"
          >
            <span className="visually-hidden">Chargement des structures...</span>
          </Spinner>
          <p className={`loading-text ${theme === "dark" ? "text-light-75" : "text-secondary"}`}>
            Chargement des structures...
          </p>
        </div>
      </div>
    ) : structures.length === 0 ? (
      <div className={`empty-state ${theme === "dark" ? "empty-state-dark" : "empty-state-light"}`}>
        <div className="empty-state-icon">
          <FeatherIcon 
            icon="info" 
            size="48" 
            className="text-primary opacity-75" 
          />
        </div>
        <h4 className="empty-state-title">Aucune structure trouvée</h4>
        <p className="empty-state-description">
          Ajustez vos filtres ou ajoutez une nouvelle structure pour commencer.
        </p>
      </div>
    ) : (
      <div className="structures-grid">
        {structures.map((structure) => (
          <Card
            key={structure.id}
            className={`structure-card ${
              theme === "dark" ? "structure-card-dark" : "structure-card-light"
            }`}
          >
            <Card.Body className="structure-card-body">
              <Row className="align-items-center h-100">
                {/* Image Section */}
                <Col lg={2} md={3} className="structure-image-col">
                  <div className="structure-image-container">
                    <img
                      src={
                        structure.image
                          ? `${publicApi.defaults.baseURL}/storage/structures/${structure.image}`
                          : `${publicApi.defaults.baseURL}/storage/structures/placeholder.png`
                      }
                      alt={structure.nom}
                      className="structure-image"
                      loading="lazy"
                    />
                  </div>
                </Col>

                {/* Content Section */}
                <Col lg={6} md={5} className="structure-content-col">
                  <div className="structure-header">
                    <h5 className={`structure-title ${theme === "dark" ? "text-white" : "text-dark"}`}>
                      {structure.nom}
                    </h5>
                    <Badge
                      bg={getStructureTypeColor(structure.type_structure)}
                      className="structure-badge"
                    >
                      <FeatherIcon
                        icon={getStructureTypeIcon(structure.type_structure)}
                        className="structure-badge-icon"
                      />
                      <span className="structure-badge-text">
                        {structure.type_structure}
                      </span>
                    </Badge>
                  </div>

                  <div className="structure-details">
                    <div className="structure-detail-item">
                      <FeatherIcon 
                        icon="mail" 
                        className="structure-detail-icon" 
                      />
                      <span className={`structure-detail-text ${theme === "dark" ? "text-light-75" : "text-secondary"}`}>
                        {structure.email}
                      </span>
                    </div>
                    
                    <div className="structure-detail-item">
                      <FeatherIcon 
                        icon="phone" 
                        className="structure-detail-icon" 
                      />
                      <span className={`structure-detail-text ${theme === "dark" ? "text-light-75" : "text-secondary"}`}>
                        {structure.code_telephone} {structure.telephone}
                      </span>
                    </div>

                    {structure.adresse && (
                      <div className="structure-detail-item">
                        <FeatherIcon 
                          icon="map-pin" 
                          className="structure-detail-icon" 
                        />
                        <span className={`structure-detail-text ${theme === "dark" ? "text-light-75" : "text-secondary"}`}>
                          {structure.adresse}
                        </span>
                      </div>
                    )}
                  </div>
                </Col>

                {/* Actions Section */}
                <Col lg={4} md={4} className="structure-actions-col">
                  <div className="structure-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      className="action-btn action-btn-primary"
                      onClick={() => handleShowDetails(structure.id)}
                    >
                      <FeatherIcon 
                        icon="eye" 
                        className="action-btn-icon" 
                      />
                      <span className="action-btn-text">Détails</span>
                    </Button>
                    
                    <Button
                      variant={theme === "dark" ? "outline-light" : "outline-secondary"}
                      size="sm"
                      className="action-btn action-btn-secondary"
                      onClick={() => openEditModal(structure.id)}
                    >
                      <FeatherIcon 
                        icon="edit-2" 
                        className="action-btn-icon" 
                      />
                      <span className="d-none d-lg-inline action-btn-text">Modifier</span>
                    </Button>
                    
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="action-btn action-btn-danger"
                      onClick={() => openDeleteModal(structure.id)}
                    >
                      <FeatherIcon 
                        icon="trash-2" 
                        className="action-btn-icon" 
                      />
                      <span className="d-none d-lg-inline action-btn-text">Supprimer</span>
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </div>
    )}

    <style jsx>{`
      .structures-list {
        padding: 0;
      }

      /* Loading States */
      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
        padding: 3rem 1rem;
      }

      .loading-content {
        text-align: center;
      }

      .loading-spinner {
        width: 3rem !important;
        height: 3rem !important;
        margin-bottom: 1.5rem;
      }

      .loading-text {
        font-size: 1.1rem;
        font-weight: 500;
        margin: 0;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        border-radius: 20px;
        margin: 2rem 0;
        border: 2px dashed;
      }

      .empty-state-light {
        background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
        border-color: #e9ecef;
        color: #6c757d;
      }

      .empty-state-dark {
        background: linear-gradient(135deg, #1a1d23 0%, #2c3034 100%);
        border-color: #495057;
        color: #adb5bd;
      }

      .empty-state-icon {
        margin-bottom: 1.5rem;
      }

      .empty-state-title {
        font-weight: 700;
        font-size: 1.5rem;
        margin-bottom: 0.75rem;
        color: inherit;
      }

      .empty-state-description {
        font-size: 1rem;
        line-height: 1.6;
        max-width: 400px;
        margin: 0 auto;
        opacity: 0.8;
      }

      /* Structures Grid */
      .structures-grid {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      /* Structure Cards */
      .structure-card {
        border: none !important;
        border-radius: 20px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .structure-card-light {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }

      .structure-card-light:hover {
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
      }

      .structure-card-dark {
        background: linear-gradient(135deg, #2c3034 0%, #1a1d23 100%);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }

      .structure-card-dark:hover {
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
        transform: translateY(-2px);
        border-color: rgba(255, 255, 255, 0.2) !important;
      }

      .structure-card-body {
        padding: 2rem !important;
      }

      /* Structure Image */
      .structure-image-col {
        margin-bottom: 1rem;
      }

      .structure-image-container {
        position: relative;
        width: 90px;
        height: 90px;
        margin: 0 auto;
      }

      .structure-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.3s ease;
      }

      .structure-image:hover {
        transform: scale(1.05);
      }

      /* Structure Content */
      .structure-content-col {
        margin-bottom: 1.5rem;
      }

      .structure-header {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }

      .structure-title {
        font-weight: 700;
        font-size: 1.25rem;
        margin: 0;
        flex: 1;
        min-width: 0;
      }

      .structure-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem !important;
        border-radius: 50px !important;
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }

      .structure-badge-icon {
        width: 12px !important;
        height: 12px !important;
        margin-right: 0.5rem;
      }

      .structure-details {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .structure-detail-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .structure-detail-icon {
        width: 16px !important;
        height: 16px !important;
        flex-shrink: 0;
        opacity: 0.7;
      }

      .structure-detail-text {
        font-size: 0.9rem;
        line-height: 1.4;
        flex: 1;
      }

      /* Structure Actions */
      .structure-actions-col {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .structure-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: center;
        width: 100%;
      }

      .action-btn {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem !important;
        border-radius: 12px !important;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.3s ease;
        min-width: 44px;
        height: 38px;
        border-width: 1.5px !important;
      }

      .action-btn-icon {
        width: 16px !important;
        height: 16px !important;
      }

      .action-btn-text {
        margin-left: 0.5rem;
      }

      .action-btn-primary {
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
        border-color: transparent !important;
        color: white !important;
      }

      .action-btn-primary:hover {
        background: linear-gradient(135deg, #0056b3 0%, #004085 100%) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
      }

      .action-btn-secondary:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .action-btn-danger:hover {
        background-color: #dc3545 !important;
        border-color: #dc3545 !important;
        color: white !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      }

      /* Responsive Design */
      @media (max-width: 991.98px) {
        .structure-card-body {
          padding: 1.5rem !important;
        }

        .structure-header {
          text-align: center;
          justify-content: center;
        }

        .structure-title {
          text-align: center;
        }

        .structure-details {
          align-items: center;
          text-align: center;
        }

        .action-btn-text {
          display: none !important;
        }

        .action-btn {
          min-width: 40px;
          padding: 0.5rem !important;
        }
      }

      @media (max-width: 767.98px) {
        .structures-grid {
          gap: 1rem;
        }

        .structure-card-body {
          padding: 1.25rem !important;
        }

        .empty-state {
          padding: 3rem 1.5rem;
          margin: 1rem 0;
        }

        .loading-container {
          min-height: 250px;
          padding: 2rem 1rem;
        }
      }

      /* Utilities */
      .text-light-75 {
        color: rgba(255, 255, 255, 0.75) !important;
      }
    `}</style>
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
        <Card 
        className={`mb-4 border-0 ${theme === "dark" ? "bg-dark-card" : "bg-white"}`}
        style={{ 
          borderRadius: "16px",
          boxShadow: theme === "dark" 
            ? "0 8px 32px rgba(0, 0, 0, 0.3)" 
            : "0 8px 32px rgba(0, 0, 0, 0.08)"
        }}
        >
        <Card.Body className="p-4">
          <Row className="align-items-center g-4">
            <Col lg={filters.showFilters ? 12 : 7}>
              <div className="search-container position-relative">
                <InputGroup size="lg" className="border-0">
                  <InputGroup.Text
                    className={`border-0 ps-4 ${
                      theme === "dark" 
                        ? "bg-dark-subtle text-secondary" 
                        : "bg-light text-muted"
                    }`}
                    style={{ borderRadius: "12px 0 0 12px" }}
                  >
                    <FeatherIcon 
                      icon="search" 
                      style={{ width: "20px", height: "20px" }} 
                    />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par nom, email, adresse..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                    className={`border-0 pe-4 fs-6 ${
                      theme === "dark" 
                        ? "bg-dark-subtle text-light placeholder-text-secondary" 
                        : "bg-light text-dark placeholder-text-muted"
                    }`}
                    style={{ 
                      borderRadius: "0 12px 12px 0",
                      fontSize: "15px",
                      fontWeight: "400"
                    }}
                  />
                </InputGroup>
                <Button
                  variant="primary"
                  className="position-absolute end-0 top-50 translate-middle-y me-2 px-4 py-2 fw-semibold"
                  onClick={applyFilters}
                  style={{
                    borderRadius: "10px",
                    fontSize: "14px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
                  }}
                >
                  Rechercher
                </Button>
              </div>
            </Col>

            {!filters.showFilters && (
              <Col lg={5} className="d-flex justify-content-end align-items-center gap-3">
                <div 
                  className={`view-mode-toggle p-1 rounded-pill ${
                    theme === "dark" ? "bg-dark-subtle" : "bg-light"
                  }`}
                  style={{ border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}` }}
                >
                  <ButtonGroup className="border-0">
                    <OverlayTrigger placement="top" overlay={<Tooltip>Vue grille</Tooltip>}>
                      <Button
                        variant={viewMode === "grid" ? "primary" : "link"}
                        onClick={() => setViewMode("grid")}
                        className={`btn-icon border-0 rounded-pill px-3 py-2 ${
                          viewMode === "grid" 
                            ? "text-white" 
                            : theme === "dark" 
                              ? "text-secondary" 
                              : "text-muted"
                        }`}
                        style={{
                          background: viewMode === "grid" 
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : "transparent",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <FeatherIcon icon="grid" size={16} />
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Vue liste</Tooltip>}>
                      <Button
                        variant={viewMode === "list" ? "primary" : "link"}
                        onClick={() => setViewMode("list")}
                        className={`btn-icon border-0 rounded-pill px-3 py-2 ${
                          viewMode === "list" 
                            ? "text-white" 
                            : theme === "dark" 
                              ? "text-secondary" 
                              : "text-muted"
                        }`}
                        style={{
                          background: viewMode === "list" 
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : "transparent",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <FeatherIcon icon="list" size={16} />
                      </Button>
                    </OverlayTrigger>
                  </ButtonGroup>
                </div>

                <Button
                  variant="outline-primary"
                  onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                  className="rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                  style={{
                    border: `2px solid ${theme === "dark" ? "#667eea" : "#667eea"}`,
                    color: theme === "dark" ? "#667eea" : "#667eea",
                    fontSize: "14px",
                    transition: "all 0.3s ease"
                  }}
                >
                  <FeatherIcon icon="sliders" size={16} />
                  Filtres avancés
                </Button>
              </Col>
            )}
          </Row>

          {/* Section des filtres avancés */}
          <Collapse in={filters.showFilters}>
            <div className="mt-5">
              <div 
                className={`p-4 rounded-4 ${
                  theme === "dark" ? "bg-dark-subtle" : "bg-light"
                }`}
                style={{
                  border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
                  backdropFilter: "blur(10px)"
                }}
              >
                <div className="mb-4 pb-3 border-bottom border-opacity-25">
                  <h6 className={`mb-2 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <FeatherIcon icon="sliders" size={18} className="me-2" />
                    Filtres avancés
                  </h6>
                  <p className={`mb-0 small ${theme === "dark" ? "text-secondary" : "text-muted"}`}>
                    Affinez votre recherche avec des critères spécifiques
                  </p>
                </div>

                <Row className="g-4">
                  <Col md={6}>
                    <Form.Group controlId="type_structure_filter">
                      <Form.Label className={`fw-semibold mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <FeatherIcon icon="building" size={16} className="me-2" />
                        Type de structure
                      </Form.Label>
                      <Form.Select
                        name="type_structure"
                        value={filters.type_structure}
                        onChange={(e) => handleFilterChange("type_structure", e.target.value)}
                        className={`border-0 rounded-3 py-3 px-4 fw-medium ${
                          theme === "dark" 
                            ? "bg-dark text-light" 
                            : "bg-white text-dark"
                        }`}
                        style={{
                          fontSize: "14px",
                          boxShadow: theme === "dark" 
                            ? "0 2px 10px rgba(0, 0, 0, 0.3)" 
                            : "0 2px 10px rgba(0, 0, 0, 0.08)"
                        }}
                      >
                        <option value="">Tous les types</option>
                        <option value="Hopital">🏥 Hôpital</option>
                        <option value="Clinique">🏢 Clinique</option>
                        <option value="Centre de Santé">🏥 Centre de Santé</option>
                        <option value="Pharmacie">💊 Pharmacie</option> 
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group controlId="created_at_filter">
                      <Form.Label className={`fw-semibold mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <FeatherIcon icon="calendar" size={16} className="me-2" />
                        Date de création
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="created_at"
                        value={filters.created_at}
                        onChange={(e) => handleFilterChange("created_at", e.target.value)}
                        className={`border-0 rounded-3 py-3 px-4 fw-medium ${
                          theme === "dark" 
                            ? "bg-dark text-light" 
                            : "bg-white text-dark"
                        }`}
                        style={{
                          fontSize: "14px",
                          boxShadow: theme === "dark" 
                            ? "0 2px 10px rgba(0, 0, 0, 0.3)" 
                            : "0 2px 10px rgba(0, 0, 0, 0.08)"
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-3 mt-4 pt-4 border-top border-opacity-25">
                  <Button
                    variant="outline-secondary"
                    onClick={clearFilters}
                    className="rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                    style={{
                      fontSize: "14px",
                      border: `2px solid ${theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
                      color: theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)"
                    }}
                  >
                    <FeatherIcon icon="refresh-cw" size={16} />
                    Réinitialiser
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={applyFilters}
                    className="rounded-pill px-5 py-2 fw-bold d-flex align-items-center gap-2"
                    style={{
                      fontSize: "14px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <FeatherIcon icon="search" size={16} />
                    Appliquer les filtres
                  </Button>
                </div>
              </div>
            </div>
          </Collapse>
        </Card.Body>
      </Card>

        {/* Affichage des Structures (Grille ou Liste) */}
        {viewMode === "grid" ? renderGridView() : renderListView()}

        {/* Pagination */}
        {renderPagination()}
      </Container>

      {/* Modal Ajout Structure - Design Professionnel */}
      <Modal 
        show={showAddModal} 
        onHide={() => setShowAddModal(false)} 
        {...commonModalProps}
        className="fade-in-modal"
        backdrop="static"
      >
        <Modal.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"} position-relative`}>
          <div className="d-flex align-items-center w-100">
            <div className={`rounded-circle p-2 me-3 ${theme === "dark" ? "bg-primary-subtle" : "bg-primary bg-opacity-10"}`}>
              <FeatherIcon icon="plus" className="text-primary" size={20} />
            </div>
            <div>
              <Modal.Title className={`fw-bold mb-0 ${theme === "dark" ? "text-white" : "text-dark"}`}>
                Ajouter une Nouvelle Structure
              </Modal.Title>
              <small className={`${theme === "dark" ? "text-white-50" : "text-muted"}`}>
                Remplissez les informations ci-dessous
              </small>
            </div>
          </div>
          <Button
            variant="link"
            className={`position-absolute end-0 me-3 p-2 rounded-circle ${theme === "dark" ? "text-white-50 hover-bg-dark" : "text-muted hover-bg-light"}`}
            onClick={() => setShowAddModal(false)}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <FeatherIcon icon="x" size={18} />
          </Button>
        </Modal.Header>
        
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body className={`${theme === "dark" ? "bg-dark" : "bg-white"} px-4 py-3`}>
            <div className="form-sections">
              {/* Section Informations Principales */}
              <div className="form-section mb-4">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-primary-subtle text-primary" : "bg-primary bg-opacity-10 text-primary"}`}>
                    1
                  </span>
                  Informations Principales
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="text"
                        name="nom"
                        value={form.nom}
                        onChange={handleFormChange}
                        isInvalid={!!errors.nom}
                        placeholder="Nom de la structure"
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="building" size={16} className="me-1" />
                        Nom de la Structure *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.nom}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Select
                        name="type_structure"
                        value={form.type_structure}
                        onChange={handleFormChange}
                        isInvalid={!!errors.type_structure}
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      >
                        <option value="">Sélectionner un type</option>
                        <option value="Hopital">🏥 Hôpital</option>
                        <option value="Clinique">🏥 Clinique</option>
                        <option value="Centre de Santé">🏥 Centre de Santé</option>
                      </Form.Select>
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="layers" size={16} className="me-1" />
                        Type de Structure *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.type_structure}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Section Contact */}
              <div className="form-section mb-4">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-success-subtle text-success" : "bg-success bg-opacity-10 text-success"}`}>
                    2
                  </span>
                  Informations de Contact
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleFormChange}
                        isInvalid={!!errors.email}
                        placeholder="Email"
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="mail" size={16} className="me-1" />
                        Adresse Email *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <InputGroup className="modern-input-group">
                        <InputGroup.Text className={`${theme === "dark" ? "bg-dark border-secondary text-white" : "bg-light border-light"}`}>
                          <Form.Select
                            name="code_telephone"
                            value={form.code_telephone}
                            onChange={handleFormChange}
                            className={`border-0 ${theme === "dark" ? "bg-dark text-white" : "bg-light"}`}
                            style={{ minWidth: "80px" }}
                          >
                            <option value="+237">🇨🇲 +237</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+33">🇫🇷 +33</option>
                          </Form.Select>
                        </InputGroup.Text>
                        <Form.Control
                          type="tel"
                          name="telephone"
                          value={form.telephone}
                          onChange={handleFormChange}
                          isInvalid={!!errors.telephone}
                          placeholder="Numéro de téléphone"
                          className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                        />
                      </InputGroup>
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="phone" size={16} className="me-1" />
                        Téléphone *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.telephone}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Section Localisation */}
              <div className="form-section mb-4">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-warning-subtle text-warning" : "bg-warning bg-opacity-10 text-warning"}`}>
                    3
                  </span>
                  Localisation et Services
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="text"
                        name="adresse"
                        value={form.adresse}
                        onChange={handleFormChange}
                        isInvalid={!!errors.adresse}
                        placeholder="Adresse complète"
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="map-pin" size={16} className="me-1" />
                        Adresse *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.adresse}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="text"
                        name="service"
                        value={form.service}
                        onChange={handleFormChange}
                        placeholder="Service spécialisé"
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="activity" size={16} className="me-1" />
                        Service (optionnel)
                      </Form.Label>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Section Horaires */}
              <div className="form-section mb-4">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-info-subtle text-info" : "bg-info bg-opacity-10 text-info"}`}>
                    4
                  </span>
                  Horaires d'Ouverture
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="time"
                        name="horaires_debut"
                        value={form.horaires_debut}
                        onChange={handleFormChange}
                        isInvalid={!!errors.horaires_debut}
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="sunrise" size={16} className="me-1" />
                        Heure d'Ouverture
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.horaires_debut}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="time"
                        name="horaires_fin"
                        value={form.horaires_fin}
                        onChange={handleFormChange}
                        isInvalid={!!errors.horaires_fin}
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="sunset" size={16} className="me-1" />
                        Heure de Fermeture
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.horaires_fin}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Section Image */}
              <div className="form-section">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-secondary-subtle text-secondary" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                    5
                  </span>
                  Image de la Structure
                </h6>
                <div className={`upload-area p-4 text-center border-2 border-dashed rounded-3 ${theme === "dark" ? "border-secondary bg-dark" : "border-light bg-light"} position-relative`}>
                  <input
                    type="file"
                    name="image"
                    onChange={handleFormChange}
                    className="position-absolute w-100 h-100 opacity-0"
                    style={{ cursor: "pointer" }}
                    accept="image/*"
                  />
                  {imagePreview ? (
                    <div className="preview-container">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="img-fluid rounded-3 shadow-sm mb-3"
                        style={{ maxHeight: "200px", objectFit: "cover" }}
                      />
                      <p className={`mb-0 ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="check-circle" className="text-success me-1" size={16} />
                        Image sélectionnée - Cliquez pour changer
                      </p>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FeatherIcon icon="upload-cloud" size={48} className={`mb-3 ${theme === "dark" ? "text-white-50" : "text-muted"}`} />
                      <h6 className={`fw-semibold mb-1 ${theme === "dark" ? "text-white" : "text-dark"}`}>
                        Glissez une image ici
                      </h6>
                      <p className={`mb-0 small ${theme === "dark" ? "text-white-50" : "text-muted"}`}>
                        ou cliquez pour parcourir • JPG, PNG, GIF (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
                {errors.image && (
                  <div className="invalid-feedback d-block mt-2 fw-medium">
                    {errors.image}
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
          
          <Modal.Footer className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"} p-4`}>
            <div className="w-100 d-flex justify-content-between align-items-center">
              <Button
                variant="link"
                onClick={() => setShowAddModal(false)}
                disabled={formSubmitting}
                className={`text-decoration-none fw-medium ${theme === "dark" ? "text-white-75" : "text-muted"}`}
              >
                <FeatherIcon icon="x" size={16} className="me-1" />
                Annuler
              </Button>
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-pill px-4 shadow-sm btn-modern"
                >
                  {formSubmitting ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <FeatherIcon icon="plus" size={16} className="me-2" />
                      Créer la Structure
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Modifier Structure - Design Amélioré */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        {...commonModalProps}
        className="fade-in-modal"
        backdrop="static"
      >
        <Modal.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"} position-relative`}>
          <div className="d-flex align-items-center w-100">
            <div className={`rounded-circle p-2 me-3 ${theme === "dark" ? "bg-warning-subtle" : "bg-warning bg-opacity-10"}`}>
              <FeatherIcon icon="edit-2" className="text-warning" size={20} />
            </div>
            <div>
              <Modal.Title className={`fw-bold mb-0 ${theme === "dark" ? "text-white" : "text-dark"}`}>
                Modifier la Structure
              </Modal.Title>
              <small className={`${theme === "dark" ? "text-white-50" : "text-muted"}`}>
                {selectedStructure?.nom || "Chargement..."}
              </small>
            </div>
          </div>
          <Button
            variant="link"
            className={`position-absolute end-0 me-3 p-2 rounded-circle ${theme === "dark" ? "text-white-50 hover-bg-dark" : "text-muted hover-bg-light"}`}
            onClick={() => setShowEditModal(false)}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <FeatherIcon icon="x" size={18} />
          </Button>
        </Modal.Header>
        
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body className={`${theme === "dark" ? "bg-dark" : "bg-white"} px-4 py-3`}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <h6 className={`fw-semibold ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  Chargement des données
                </h6>
                <p className={`mb-0 ${theme === "dark" ? "text-white-50" : "text-muted"}`}>
                  Veuillez patienter...
                </p>
              </div>
            ) : (
              // Contenu identique à la modal d'ajout avec les mêmes améliorations
              // mais avec des valeurs pré-remplies et un message pour l'image existante
              <div className="form-sections">
                {/* Section Informations Principales */}
              <div className="form-section mb-4">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-primary-subtle text-primary" : "bg-primary bg-opacity-10 text-primary"}`}>
                    1
                  </span>
                  Informations Principales
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="text"
                        name="nom"
                        value={form.nom}
                        onChange={handleFormChange}
                        isInvalid={!!errors.nom}
                        placeholder="Nom de la structure"
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="building" size={16} className="me-1" />
                        Nom de la Structure *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.nom}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Select
                        name="type_structure"
                        value={form.type_structure}
                        onChange={handleFormChange}
                        isInvalid={!!errors.type_structure}
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      >
                        <option value="">Sélectionner un type</option>
                        <option value="Hopital">🏥 Hôpital</option>
                        <option value="Clinique">🏥 Clinique</option>
                        <option value="Centre de Santé">🏥 Centre de Santé</option>
                        <option value="Pharmacie">💊 Pharmacie</option>
                      </Form.Select>
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="layers" size={16} className="me-1" />
                        Type de Structure *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.type_structure}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Section Contact */}
              <div className="form-section mb-4">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-success-subtle text-success" : "bg-success bg-opacity-10 text-success"}`}>
                    2
                  </span>
                  Informations de Contact
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleFormChange}
                        isInvalid={!!errors.email}
                        placeholder="Email"
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="mail" size={16} className="me-1" />
                        Adresse Email *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <InputGroup className="modern-input-group">
                        <InputGroup.Text className={`${theme === "dark" ? "bg-dark border-secondary text-white" : "bg-light border-light"}`}>
                          <Form.Select
                            name="code_telephone"
                            value={form.code_telephone}
                            onChange={handleFormChange}
                            className={`border-0 ${theme === "dark" ? "bg-dark text-white" : "bg-light"}`}
                            style={{ minWidth: "80px" }}
                          >
                            <option value="+237">🇨🇲 +237</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+33">🇫🇷 +33</option>
                          </Form.Select>
                        </InputGroup.Text>
                        <Form.Control
                          type="tel"
                          name="telephone"
                          value={form.telephone}
                          onChange={handleFormChange}
                          isInvalid={!!errors.telephone}
                          placeholder="Numéro de téléphone"
                          className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                        />
                      </InputGroup>
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="phone" size={16} className="me-1" />
                        Téléphone *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.telephone}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Section Localisation */}
              <div className="form-section mb-4">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-warning-subtle text-warning" : "bg-warning bg-opacity-10 text-warning"}`}>
                    3
                  </span>
                  Localisation et Services
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="text"
                        name="adresse"
                        value={form.adresse}
                        onChange={handleFormChange}
                        isInvalid={!!errors.adresse}
                        placeholder="Adresse complète"
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="map-pin" size={16} className="me-1" />
                        Adresse *
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.adresse}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="text"
                        name="service"
                        value={form.service}
                        onChange={handleFormChange}
                        placeholder="Service spécialisé"
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="activity" size={16} className="me-1" />
                        Service (optionnel)
                      </Form.Label>
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Section Horaires */}
              <div className="form-section mb-4">
                <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                  <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-info-subtle text-info" : "bg-info bg-opacity-10 text-info"}`}>
                    4
                  </span>
                  Horaires d'Ouverture
                </h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="time"
                        name="horaires_debut"
                        value={form.horaires_debut}
                        onChange={handleFormChange}
                        isInvalid={!!errors.horaires_debut}
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="sunrise" size={16} className="me-1" />
                        Heure d'Ouverture
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.horaires_debut}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="form-floating-custom">
                      <Form.Control
                        type="time"
                        name="horaires_fin"
                        value={form.horaires_fin}
                        onChange={handleFormChange}
                        isInvalid={!!errors.horaires_fin}
                        className={`form-control-modern ${theme === "dark" ? "bg-dark border-secondary text-white" : "border-light"}`}
                      />
                      <Form.Label className={`form-label-modern ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                        <FeatherIcon icon="sunset" size={16} className="me-1" />
                        Heure de Fermeture
                      </Form.Label>
                      <Form.Control.Feedback type="invalid" className="fw-medium">
                        {errors.horaires_fin}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
                
                {/* Section Image avec aperçu de l'image existante */}
                <div className="form-section">
                  <h6 className={`fw-semibold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                    <span className={`badge rounded-pill me-2 ${theme === "dark" ? "bg-secondary-subtle text-secondary" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                      5
                    </span>
                    Image de la Structure
                  </h6>
                  <div className={`upload-area p-4 text-center border-2 border-dashed rounded-3 ${theme === "dark" ? "border-secondary bg-dark" : "border-light bg-light"} position-relative`}>
                    <input
                      type="file"
                      name="image"
                      onChange={handleFormChange}
                      className="position-absolute w-100 h-100 opacity-0"
                      style={{ cursor: "pointer" }}
                      accept="image/*"
                    />
                    {imagePreview ? (
                      <div className="preview-container">
                        <Image
                          src={imagePreview}
                          alt="Nouvel aperçu"
                          className="img-fluid rounded-3 shadow-sm mb-3"
                          style={{ maxHeight: "200px", objectFit: "cover" }}
                        />
                        <p className={`mb-0 ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                          <FeatherIcon icon="refresh-cw" className="text-info me-1" size={16} />
                          Nouvelle image sélectionnée
                        </p>
                      </div>
                    ) : selectedStructure?.image ? (
                      <div className="current-image-container">
                        <Image
                          src={`${publicApi.defaults.baseURL}/storage/structures/${selectedStructure.image}`}
                          alt="Image actuelle"
                          className="img-fluid rounded-3 shadow-sm mb-3"
                          style={{ maxHeight: "200px", objectFit: "cover" }}
                        />
                        <p className={`mb-0 ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                          <FeatherIcon icon="image" className="text-primary me-1" size={16} />
                          Image actuelle - Cliquez pour changer
                        </p>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <FeatherIcon icon="upload-cloud" size={48} className={`mb-3 ${theme === "dark" ? "text-white-50" : "text-muted"}`} />
                        <h6 className={`fw-semibold mb-1 ${theme === "dark" ? "text-white" : "text-dark"}`}>
                          Ajouter une image
                        </h6>
                        <p className={`mb-0 small ${theme === "dark" ? "text-white-50" : "text-muted"}`}>
                          Glissez une image ici ou cliquez pour parcourir
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          
          <Modal.Footer className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"} p-4`}>
            <div className="w-100 d-flex justify-content-between align-items-center">
              <Button
                variant="link"
                onClick={() => setShowEditModal(false)}
                disabled={formSubmitting}
                className={`text-decoration-none fw-medium ${theme === "dark" ? "text-white-75" : "text-muted"}`}
              >
                <FeatherIcon icon="x" size={16} className="me-1" />
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={formSubmitting}
                className="rounded-pill px-4 shadow-sm btn-modern"
              >
                {formSubmitting ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <FeatherIcon icon="save" size={16} className="me-2" />
                    Enregistrer les Modifications
                  </>
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Détails Structure - Design Premium */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)} 
        {...commonModalProps}
        className="fade-in-modal details-modal"
        size="lg"
      >
        <Modal.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"} position-relative`}>
          <div className="d-flex align-items-center w-100">
            <div className={`rounded-circle p-2 me-3 ${theme === "dark" ? "bg-info-subtle" : "bg-info bg-opacity-10"}`}>
              <FeatherIcon icon="eye" className="text-info" size={20} />
            </div>
            <div>
              <Modal.Title className={`fw-bold mb-0 ${theme === "dark" ? "text-white" : "text-dark"}`}>
                Détails de la Structure
              </Modal.Title>
              <small className={`${theme === "dark" ? "text-white-50" : "text-muted"}`}>
                Informations complètes
              </small>
            </div>
          </div>
          <Button
            variant="link"
            className={`position-absolute end-0 me-3 p-2 rounded-circle ${theme === "dark" ? "text-white-50 hover-bg-dark" : "text-muted hover-bg-light"}`}
            onClick={() => setShowDetailsModal(false)}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <FeatherIcon icon="x" size={18} />
          </Button>
        </Modal.Header>
        
        <Modal.Body className={`${theme === "dark" ? "bg-dark" : "bg-white"} p-0`}>
          {loading || !selectedStructure ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <h6 className={`fw-semibold ${theme === "dark" ? "text-white" : "text-dark"}`}>
                Chargement des détails
              </h6>
              <p className={`mb-0 ${theme === "dark" ? "text-white-50" : "text-muted"}`}>
                Veuillez patienter...
              </p>
            </div>
          ) : (
            <>
              {/* Header avec image et infos principales */}
              <div className={`details-header p-4 ${theme === "dark" ? "bg-gradient-dark" : "bg-gradient-light"} position-relative overflow-hidden`}>
                <div className="row align-items-center">
                  <div className="col-auto">
                    <div className="position-relative">
                      <img
                        src={
                          selectedStructure.image
                            ? `${publicApi.defaults.baseURL}/storage/structures/${selectedStructure.image}`
                            : `${publicApi.defaults.baseURL}/storage/structures/placeholder.png`
                        }
                        alt={selectedStructure.nom}
                        className="rounded-4 shadow-lg"
                        style={{ 
                          width: "100px", 
                          height: "100px", 
                          objectFit: "cover",
                          border: `4px solid ${theme === "dark" ? "#495057" : "#fff"}`
                        }}
                      />
                      <div className={`position-absolute bottom-0 end-0 rounded-circle p-1 ${theme === "dark" ? "bg-dark" : "bg-white"} shadow-sm`}>
                        <FeatherIcon
                          icon={getStructureTypeIcon(selectedStructure.type_structure)}
                          size={16}
                          className={`text-${getStructureTypeColor(selectedStructure.type_structure)}`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <h4 className={`fw-bold mb-1 ${theme === "dark" ? "text-white" : "text-dark"}`}>
                      {selectedStructure.nom}
                    </h4>
                    <Badge
                      bg={getStructureTypeColor(selectedStructure.type_structure)}
                      className="rounded-pill px-3 py-2 fw-semibold mb-2"
                    >
                      {selectedStructure.type_structure}
                    </Badge>
                    <p className={`mb-0 ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                      <FeatherIcon icon="calendar" size={14} className="me-1" />
                      Créée le {new Date(selectedStructure.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu des détails */}
              <div className="details-content p-4">
                <div className="row g-4">
                  {/* Contact */}
                  <div className="col-md-6">
                    <div className={`details-card h-100 p-3 rounded-3 ${theme === "dark" ? "bg-dark border border-secondary" : "bg-light border"}`}>
                      <h6 className={`fw-bold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                        <FeatherIcon icon="phone" size={18} className="text-primary me-2" />
                        Contact
                      </h6>
                      <div className="space-y-3">
                        <div className="d-flex align-items-start">
                          <FeatherIcon icon="mail" size={16} className="text-primary me-3 mt-1 flex-shrink-0" />
                          <div>
                            <span className={`fw-medium ${theme === "dark" ? "text-white" : "text-dark"}`}>Email</span>
                            <br />
                            <span className={`${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                              {selectedStructure.email}
                            </span>
                          </div>
                        </div>
                        <div className="d-flex align-items-start">
                          <FeatherIcon icon="phone" size={16} className="text-success me-3 mt-1 flex-shrink-0" />
                          <div>
                            <span className={`fw-medium ${theme === "dark" ? "text-white" : "text-dark"}`}>Téléphone</span>
                            <br />
                            <span className={`${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                              {selectedStructure.code_telephone} {selectedStructure.telephone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Localisation */}
                  <div className="col-md-6">
                    <div className={`details-card h-100 p-3 rounded-3 ${theme === "dark" ? "bg-dark border border-secondary" : "bg-light border"}`}>
                      <h6 className={`fw-bold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                        <FeatherIcon icon="map-pin" size={18} className="text-warning me-2" />
                        Localisation
                      </h6>
                      <div className="space-y-3">
                        {selectedStructure.adresse && (
                          <div className="d-flex align-items-start">
                            <FeatherIcon icon="map-pin" size={16} className="text-warning me-3 mt-1 flex-shrink-0" />
                            <div>
                              <span className={`fw-medium ${theme === "dark" ? "text-white" : "text-dark"}`}>Adresse</span>
                              <br />
                              <span className={`${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                                {selectedStructure.adresse}
                              </span>
                            </div>
                          </div>
                        )}
                        {selectedStructure.service && (
                          <div className="d-flex align-items-start">
                            <FeatherIcon icon="activity" size={16} className="text-info me-3 mt-1 flex-shrink-0" />
                            <div>
                              <span className={`fw-medium ${theme === "dark" ? "text-white" : "text-dark"}`}>Service</span>
                              <br />
                              <span className={`${theme === "dark" ? "text-white-75" : "text-muted"}`}>
                                {selectedStructure.service}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Horaires */}
                  {(selectedStructure.horaires_debut && selectedStructure.horaires_fin) && (
                    <div className="col-12">
                      <div className={`details-card p-3 rounded-3 ${theme === "dark" ? "bg-dark border border-secondary" : "bg-light border"}`}>
                        <h6 className={`fw-bold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                          <FeatherIcon icon="clock" size={18} className="text-secondary me-2" />
                          Horaires d'Ouverture
                        </h6>
                        <div className="d-flex align-items-center">
                          <div className={`rounded-pill px-3 py-2 me-3 ${theme === "dark" ? "bg-success-subtle" : "bg-success bg-opacity-10"}`}>
                            <FeatherIcon icon="sunrise" size={16} className="text-success me-2" />
                            <span className={`fw-semibold ${theme === "dark" ? "text-white" : "text-dark"}`}>
                              {selectedStructure.horaires_debut}
                            </span>
                          </div>
                          <FeatherIcon icon="arrow-right" size={16} className={`${theme === "dark" ? "text-white-50" : "text-muted"}`} />
                          <div className={`rounded-pill px-3 py-2 ms-3 ${theme === "dark" ? "bg-danger-subtle" : "bg-danger bg-opacity-10"}`}>
                            <FeatherIcon icon="sunset" size={16} className="text-danger me-2" />
                            <span className={`fw-semibold ${theme === "dark" ? "text-white" : "text-dark"}`}>
                              {selectedStructure.horaires_fin}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statistiques ou informations supplémentaires */}
                  <div className="col-12">
                    <div className={`details-card p-3 rounded-3 ${theme === "dark" ? "bg-dark border border-secondary" : "bg-light border"}`}>
                      <h6 className={`fw-bold mb-3 d-flex align-items-center ${theme === "dark" ? "text-white" : "text-dark"}`}>
                        <FeatherIcon icon="bar-chart" size={18} className="text-primary me-2" />
                        Informations Système
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <div className="text-center">
                            <div className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center ${theme === "dark" ? "bg-primary-subtle" : "bg-primary bg-opacity-10"}`} style={{width: '40px', height: '40px'}}>
                              <FeatherIcon icon="calendar-plus" size={16} className="text-primary" />
                            </div>
                            <small className={`fw-medium ${theme === "dark" ? "text-white-75" : "text-muted"}`}>Créée</small>
                            <p className={`mb-0 fw-bold ${theme === "dark" ? "text-white" : "text-dark"}`}>
                              {new Date(selectedStructure.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="text-center">
                            <div className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center ${theme === "dark" ? "bg-success-subtle" : "bg-success bg-opacity-10"}`} style={{width: '40px', height: '40px'}}>
                              <FeatherIcon icon="check-circle" size={16} className="text-success" />
                            </div>
                            <small className={`fw-medium ${theme === "dark" ? "text-white-75" : "text-muted"}`}>Statut</small>
                            <p className={`mb-0 fw-bold text-success`}>Actif</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="text-center">
                            <div className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center ${theme === "dark" ? "bg-info-subtle" : "bg-info bg-opacity-10"}`} style={{width: '40px', height: '40px'}}>
                              <FeatherIcon icon="hash" size={16} className="text-info" />
                            </div>
                            <small className={`fw-medium ${theme === "dark" ? "text-white-75" : "text-muted"}`}>ID</small>
                            <p className={`mb-0 fw-bold ${theme === "dark" ? "text-white" : "text-dark"}`}>
                              #{selectedStructure.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        
        <Modal.Footer className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"} p-4`}>
          <div className="w-100 d-flex justify-content-between align-items-center">
            <Button
              variant="link"
              onClick={() => setShowDetailsModal(false)}
              className={`text-decoration-none fw-medium ${theme === "dark" ? "text-white-75" : "text-muted"}`}
            >
              <FeatherIcon icon="x" size={16} className="me-1" />
              Fermer
            </Button>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedStructure.id);
                }}
                className="rounded-pill px-4 shadow-sm btn-modern"
              >
                <FeatherIcon icon="edit-2" size={16} className="me-2" />
                Modifier
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal Confirmation de Suppression - Design Moderne */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)} 
        {...commonModalProps}
        className="fade-in-modal"
        centered
        size="sm"
      >
        <Modal.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"} text-center pb-0`}>
          <div className="w-100 text-center">
            <div className={`rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center ${theme === "dark" ? "bg-danger-subtle" : "bg-danger bg-opacity-10"}`} style={{width: '60px', height: '60px'}}>
              <FeatherIcon icon="alert-triangle" className="text-danger" size={24} />
            </div>
            <Modal.Title className={`fw-bold ${theme === "dark" ? "text-white" : "text-dark"}`}>
              Confirmer la Suppression
            </Modal.Title>
          </div>
        </Modal.Header>
        
        <Modal.Body className={`${theme === "dark" ? "bg-dark text-white" : "bg-white"} text-center px-4`}>
          <p className={`mb-3 ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
            Êtes-vous sûr de vouloir supprimer définitivement cette structure ?
          </p>
          {selectedStructure && (
            <div className={`p-3 rounded-3 mb-3 ${theme === "dark" ? "bg-dark border border-secondary" : "bg-light border"}`}>
              <div className="d-flex align-items-center justify-content-center">
                <img
                  src={
                    selectedStructure.image
                      ? `${publicApi.defaults.baseURL}/storage/structures/${selectedStructure.image}`
                      : `${publicApi.defaults.baseURL}/storage/structures/placeholder.png`
                  }
                  alt={selectedStructure.nom}
                  className="rounded-circle me-3"
                  style={{ width: "40px", height: "40px", objectFit: "cover" }}
                />
                <div className="text-start">
                  <p className={`mb-0 fw-semibold ${theme === "dark" ? "text-white" : "text-dark"}`}>
                    {selectedStructure.nom}
                  </p>
                  <small className={`${theme === "dark" ? "text-white-50" : "text-muted"}`}>
                    {selectedStructure.type_structure}
                  </small>
                </div>
              </div>
            </div>
          )}
          <div className={`alert ${theme === "dark" ? "alert-dark border-danger" : "alert-light border-danger"} border d-flex align-items-center`}>
            <FeatherIcon icon="info" size={16} className="text-danger me-2 flex-shrink-0" />
            <small className={`mb-0 ${theme === "dark" ? "text-white-75" : "text-muted"}`}>
              <strong>Attention :</strong> Cette action est irréversible. Toutes les données associées seront perdues.
            </small>
          </div>
        </Modal.Body>
        
        <Modal.Footer className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"} p-4`}>
          <div className="w-100 d-flex justify-content-center gap-3">
            <Button
              variant="outline-secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
              className="rounded-pill px-4 flex-fill"
            >
              <FeatherIcon icon="x" size={16} className="me-1" />
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={loading}
              className="rounded-pill px-4 flex-fill shadow-sm"
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Suppression...
                </>
              ) : (
                <>
                  <FeatherIcon icon="trash-2" size={16} className="me-1" />
                  Supprimer Définitivement
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Styles CSS Personnalisés */}
      <style jsx>{`
        .fade-in-modal .modal-dialog {
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .form-control-modern {
          border-radius: 12px !important;
          padding: 12px 16px;
          font-size: 14px;
          transition: all 0.2s ease;
          border: 1px solid;
        }

        .form-control-modern:focus {
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
          border-color: #0d6efd;
          transform: translateY(-1px);
        }

        .form-label-modern {
          font-weight: 500;
          margin-bottom: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
        }

        .form-section {
          position: relative;
          padding: 20px;
          border-radius: 16px;
          background: ${theme === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.01)"};
          border: 1px solid ${theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"};
          transition: all 0.2s ease;
        }

        .form-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px ${theme === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.08)"};
        }

        .upload-area {
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .upload-area:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px ${theme === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"};
        }

        .btn-modern {
          transition: all 0.2s ease;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .btn-modern:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(13, 110, 253, 0.3);
        }

        .details-card {
          transition: all 0.2s ease;
        }

        .details-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px ${theme === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.08)"};
        }

        .bg-gradient-light {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .bg-gradient-dark {
          background: linear-gradient(135deg, #343a40 0%, #212529 100%);
        }

        .modern-input-group .input-group-text {
          border-radius: 12px 0 0 12px !important;
          border-right: none !important;
        }

        .modern-input-group .form-control {
          border-radius: 0 12px 12px 0 !important;
          border-left: none !important;
        }

        .space-y-3 > * + * {
          margin-top: 1rem;
        }

        .hover-bg-light:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
        }

        .hover-bg-dark:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }

        .text-white-75 {
          color: rgba(255, 255, 255, 0.75) !important;
        }

        .text-white-50 {
          color: rgba(255, 255, 255, 0.5) !important;
        }

        .bg-primary-subtle {
          background-color: rgba(13, 110, 253, 0.1) !important;
        }

        .bg-success-subtle {
          background-color: rgba(25, 135, 84, 0.1) !important;
        }

        .bg-warning-subtle {
          background-color: rgba(255, 193, 7, 0.1) !important;
        }

        .bg-info-subtle {
          background-color: rgba(13, 202, 240, 0.1) !important;
        }

        .bg-danger-subtle {
          background-color: rgba(220, 53, 69, 0.1) !important;
        }

        .bg-secondary-subtle {
          background-color: rgba(108, 117, 125, 0.1) !important;
        }

        .details-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${theme === "dark" 
            ? "radial-gradient(circle at 20% 80%, rgba(13, 110, 253, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(25, 135, 84, 0.1) 0%, transparent 50%)"
            : "radial-gradient(circle at 20% 80%, rgba(13, 110, 253, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(25, 135, 84, 0.05) 0%, transparent 50%)"
          };
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .form-section {
            padding: 15px;
            margin-bottom: 15px;
          }
          
          .modal-dialog {
            margin: 10px;
          }
          
          .details-header {
            text-align: center;
          }
          
          .details-header .row {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </AdminSystemeLayout>
  );
}