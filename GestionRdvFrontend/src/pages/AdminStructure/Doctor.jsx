import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Button,
  Row,
  Col,
  Card,
  Table,
  Form,
  InputGroup,
  Modal,
  Badge,
  Alert,
  Dropdown,
  Pagination
} from "react-bootstrap";
import feather from "feather-icons";
import api from "../../services/api"; // Assuming this is configured to hit your API
import AdminStructureLayout from "../../layouts/AdminStructure/Layout"; // Keep this layout as it was in Doctor.jsx
import fileDownload from "js-file-download"; // For file downloads
import { useAuth } from "../../contexts/AuthContext";

export default function GestionDocteurs() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    gender: "",
    created_at: ""
  });

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data for adding a doctor
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  // Form data for inviting a doctor
  const [inviteForm, setInviteForm] = useState({
    email: "",
    structure_id: `${user.structure_id}`, 
    role: "1", // Role 1 for doctor
  });

  // Alerts
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 10; // Number of doctors per page, adjust as needed

  // Theme state (from Docteur.jsx)
  const [theme, setTheme] = useState("light");

  // Detect theme on load and DOM changes
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


  // Function to load doctors with filters
  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filters.created_at) params.created_at = filters.created_at;
      if (filters.status) params.status = filters.status;

      const response = await api.get('/admin-structure/view/docteur', { params });
      if (response.data.status === 'success') {
        setDoctors(response.data.docteur || []);
      } else {
        showAlert("danger", response.data.message || "Erreur lors du chargement des docteurs.");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des docteurs:", error);
      showAlert("danger", "Erreur réseau ou serveur lors du chargement des docteurs.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters.created_at, filters.status]);

  useEffect(() => {
    feather.replace();
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    feather.replace();
  }, [doctors]);


  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post('/admin-structure/store/docteur', formData);
      if (response.data.status === 'success') {
        loadDoctors();
        setShowAddModal(false);
        setFormData({ name: "", email: "", password: "", password_confirmation: "" });
        showAlert("success", response.data.message);
      } else {
        if (response.data.errors) {
          const errorMessages = Object.values(response.data.errors).flat().join(" ");
          showAlert("danger", `Erreur de validation: ${errorMessages}`);
        } else {
          showAlert("danger", response.data.message || "Erreur lors de l'ajout du docteur.");
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du docteur:", error);
      showAlert("danger", "Erreur réseau ou serveur lors de l'ajout du docteur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteDoctor = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post('/admin-structure/invite/docteur', inviteForm);
      if (response.data.status === 'success') {
        loadDoctors();
        setShowInviteModal(false);
        setInviteForm({
          email: "",
          structure_id: `${user.structure_id}`,
          role: "1"
        });
        showAlert("success", response.data.message || "Invitation envoyée avec succès.");
      } else {
        if (response.data.errors) {
          const errorMessages = Object.values(response.data.errors).flat().join(" ");
          showAlert("danger", `Erreur de validation: ${errorMessages}`);
        } else {
          showAlert("danger", response.data.message || "Erreur lors de l'envoi de l'invitation.");
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'invitation du docteur:", error);
      showAlert("danger", "Erreur réseau ou serveur lors de l'envoi de l'invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;

    setIsSubmitting(true);
    try {
      const response = await api.delete(`/admin-structure/destroy/docteur/${selectedDoctor.id}`);
      if (response.data.status === 'success') {
        loadDoctors();
        setShowDeleteModal(false);
        setSelectedDoctor(null);
        showAlert("success", response.data.message);
      } else {
        showAlert("danger", response.data.message || "Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du docteur:", error);
      showAlert("danger", "Erreur réseau ou serveur lors de la suppression.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = !searchTerm ||
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.phone && doctor.phone.includes(searchTerm));

    const matchesStatus = !filters.status || doctor.status === filters.status;
    const matchesGender = !filters.gender || doctor.gender === filters.gender;

    return matchesSearch && matchesStatus && matchesGender;
  });

  const handleDownloadPdf = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (createdAtFilter) params.append('created_at', createdAtFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin-structure/download/liste/docteur/pdf?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `liste_docteurs_${new Date().toISOString().slice(0, 10)}.pdf`;
      fileDownload(res.data, filename);
    } catch (err) {
      console.error("Erreur lors du téléchargement PDF :", err);
      showAlert("danger", "Erreur lors du téléchargement PDF.");
    }
  };

  const handleDownloadExcel = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (createdAtFilter) params.append('created_at', createdAtFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin-structure/download/liste/docteur/excel?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `liste_docteurs_${new Date().toISOString().slice(0, 10)}.xlsx`;
      fileDownload(res.data, filename);
    } catch (err) {
      console.error("Erreur lors du téléchargement Excel :", err);
      showAlert("danger", "Erreur lors du téléchargement Excel.");
    }
  };

  // Pagination logic
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminStructureLayout>
      <Container fluid className="p-0">

        {/* Alert */}
        {alert.show && (
          <Alert variant={alert.type} className="mb-4" dismissible onClose={() => setAlert({ show: false })}>
            {alert.message}
          </Alert>
        )}

        {/* Header */}
        <Row className="mb-4">
          <Col xs={12}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
              <div className="mb-3 mb-md-0">
                <h1 className={`h3 mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="users" className="me-2"></i>
                  Gestion des Docteurs
                </h1>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Gérer l'équipe médicale de votre structure ({filteredDoctors.length} docteurs)
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={loadDoctors}
                  disabled={loading}
                >
                  <i data-feather="refresh-cw" className="me-1"></i>
                  <span className="d-none d-sm-inline">Actualiser</span>
                </Button>

                {/* Dropdown Export avec style médical */}
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-primary"
                    className="d-flex align-items-center"
                    id="dropdown-export"
                  >
                    <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Exporter
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow-lg border-0"> {/* Removed fixed minWidth */}
                    <div className="p-3">
                      <h6 className="text-primary mb-3">
                        <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Rapport PDF
                      </h6>
                      <Form onSubmit={handleDownloadPdf} className="mb-4">
                        <Form.Control
                          type="text"
                          placeholder="Rechercher par nom, email..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="mb-2"
                        />
                        <Form.Control
                          type="date"
                          value={createdAtFilter}
                          onChange={e => setCreatedAtFilter(e.target.value)}
                          className="mb-2"
                        />
                        <Form.Select
                          value={statusFilter}
                          onChange={e => setStatusFilter(e.target.value)}
                          className="mb-3"
                        >
                          <option value="">Tous les statuts</option>
                          <option value="Connecté">Connecté</option>
                          <option value="Déconnecté">Déconnecté</option>
                        </Form.Select>
                        <Button type="submit" variant="primary" className="w-100">
                          <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Télécharger PDF
                        </Button>
                      </Form>

                      <hr />

                      <h6 className="text-success mb-3">
                        <i data-feather="file" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Fichier Excel
                      </h6>
                      <Form onSubmit={handleDownloadExcel}>
                        <Button type="submit" variant="success" className="w-100">
                          <i data-feather="file" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Télécharger Excel
                        </Button>
                      </Form>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>

                <Button
                  variant="info"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                >
                  <i data-feather="mail" className="me-1"></i>
                  <span className="d-none d-sm-inline">Inviter</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                >
                  <i data-feather="plus" className="me-1"></i>
                  <span className="d-none d-sm-inline">Ajouter</span>
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Quick Stats */}
        <Row className="mb-4 g-3"> {/* Added g-3 for consistent gutter */}
          <Col xs={12} sm={6} md={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className={`rounded-3 p-3 me-3 ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                    <i data-feather="users" className="text-primary"></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Total Docteurs</h6>
                    <h4 className={`mb-0 ${theme === "dark" ? "text-light" : "text-primary"}`}>{doctors.length}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className={`rounded-3 p-3 me-3 ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                    <i data-feather="user-check" className="text-success"></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Connectés</h6>
                    <h4 className="mb-0 text-success">
                      {doctors.filter(d => d.status === 'Connecté').length}
                    </h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className={`rounded-3 p-3 me-3 ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
                    <i data-feather="user-x" className="text-warning"></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Déconnectés</h6>
                    <h4 className="mb-0 text-warning">
                      {doctors.filter(d => d.status === 'Déconnecté').length}
                    </h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className={`rounded-3 p-3 me-3 ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                    <i data-feather="filter" className="text-info"></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Filtrés</h6>
                    <h4 className="mb-0 text-info">{filteredDoctors.length}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
          <Card.Body>
            <Row className="g-3"> {/* Added g-3 for consistent gutter */}
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : ""}`}>Recherche</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
                      <i data-feather="search" style={{ width: '16px', height: '16px' }}></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Nom, email, téléphone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadDoctors();
                        }
                      }}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={2}>
                <Form.Group>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : ""}`}>Statut</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous</option>
                    <option value="Connecté">Connecté</option>
                    <option value="Déconnecté">Déconnecté</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={2}>
                <Form.Group>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : ""}`}>Genre</Form.Label>
                  <Form.Select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={3}>
                <Form.Group>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : ""}`}>Date de création</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.created_at}
                    onChange={(e) => setFilters({ ...filters, created_at: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={1} className="d-flex align-items-end">
                <Button
                  variant={theme === "dark" ? "outline-light" : "outline-secondary"}
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({ status: "", gender: "", created_at: "" });
                    loadDoctors();
                  }}
                  title="Réinitialiser les filtres"
                  className="w-100" 
                >
                  <i data-feather="x" style={{ width: '16px', height: '16px' }}></i>
                  <span className="d-md-none ms-2">Réinitialiser</span> {/* Show text on small screens */}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Doctors Table */}
        <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-light text-dark"} d-flex flex-column flex-md-row align-items-md-center justify-content-between`}>
            <h5 className="mb-2 mb-md-0">
              <i data-feather="list" className="me-2"></i>
              Liste des Docteurs
            </h5>
            <small className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              {indexOfFirstDoctor + 1} - {Math.min(indexOfLastDoctor, filteredDoctors.length)} sur {filteredDoctors.length}
            </small>
          </Card.Header>
          <Card.Body className="p-0">
              <div className="table-responsive"> {/* Added table-responsive for horizontal scroll */}
                <Table hover responsive="md" className={`mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                  <thead className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                    <tr>
                      <th className="border-0">#</th>
                      <th className="border-0">Nom</th>
                      <th className="border-0 d-none d-md-table-cell">Email</th>
                      <th className="border-0 d-none d-md-table-cell">Téléphone</th>
                      <th className="border-0 d-none d-md-table-cell">Genre</th>
                      <th className="border-0 d-none d-md-table-cell">Statut</th>
                      <th className="border-0 d-none d-md-table-cell">Date création</th>
                      <th className="border-0 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDoctors.map((doctor, index) => (
                      <tr key={doctor.id} className={theme === "dark" ? "border-secondary" : ""}>
                        <td>
                          <Badge bg="light" text="dark" className="rounded-circle p-2">
                            {index + 1}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className={`${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"} rounded-circle p-2 me-2`}>
                              <i data-feather="user" className="text-primary" style={{ width: '16px', height: '16px' }}></i>
                            </div>
                            <strong className={theme === "dark" ? "text-light" : "text-dark"}>{doctor.name}</strong>
                          </div>
                        </td>
                        <td className="border-0 d-none d-md-table-cell">
                          <a href={`mailto:${doctor.email}`} className={`text-decoration-none ${theme === "dark" ? "text-info" : ""}`}>
                            {doctor.email}
                          </a>
                        </td>
                        <td className="border-0 d-none d-md-table-cell">
                          {doctor.phone ? (
                            <a href={`tel:${doctor.phone}`} className={`text-decoration-none ${theme === "dark" ? "text-info" : ""}`}>
                              {doctor.phone}
                            </a>
                          ) : (
                            <span className={theme === "dark" ? "text-light" : "text-muted"}>N/A</span>
                          )}
                        </td>
                        <td className="border-0 d-none d-md-table-cell">
                          <Badge bg-info className="px-2">
                            {doctor.gender ?? '---'}
                          </Badge>
                        </td>
                        <td className="border-0 d-none d-md-table-cell">
                          <Badge bg={doctor.status === 'Connecté' ? 'success' : 'secondary'}>
                            {doctor.status === 'Connecté' ? 'Connecté' : 'Déconnecté'}
                          </Badge>
                        </td>
                        <td className="border-0 d-none d-md-table-cell">
                          <small className={theme === "dark" ? "text-light" : "text-muted"}>
                            {formatDate(doctor.created_at)}
                          </small>
                        </td>
                        <td className="text-center">
                          <Dropdown onToggle={(isOpen) => {
                            if (isOpen) {
                              // Remplace les icônes quand le dropdown s'ouvre
                              setTimeout(() => feather.replace(), 0);
                            }
                          }}>
                            <Dropdown.Toggle
                              variant={theme === "dark" ? "outline-light" : "outline-secondary"}
                              size="sm"
                              className="border-0"
                            >
                              <i data-feather="more-horizontal" style={{ width: '16px', height: '16px' }}></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" className={theme === "dark" ? "bg-dark border-secondary" : ""}>
                              <Dropdown.Item className={theme === "dark" ? "text-light" : ""}
                                  size="sm"
                                  variant="outline-info"
                                  title="Voir les détails"
                                  as="a"
                                  href={`/admin-structure/show/doctor/${doctor.id}`}
                                >
                                  <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                                  Voir détails
                                {/* </Button> */}
                              </Dropdown.Item>
                              <Dropdown.Item className={theme === "dark" ? "text-light" : ""} 
                                  size="sm"
                                  variant="outline-warning"
                                  title="Modifier"
                                  as="a"
                                  href={`/admin-structure/edit/doctor/${doctor.id}`}
                                >
                                  <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i> Modifier
                                {/* </Button> */}
                              </Dropdown.Item>
                              <Dropdown.Divider className={theme === "dark" ? "border-secondary" : ""}/>
                              <Dropdown.Item
                                className="text-danger"
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <i data-feather="trash-2" className="me-2"></i>
                                Supprimer
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
          </Card.Body>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card.Footer className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light border-0"}`}>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                <small className={`mb-2 mb-md-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Affichage de {indexOfFirstDoctor + 1} à {Math.min(indexOfLastDoctor, filteredDoctors.length)} sur {filteredDoctors.length} résultats
                </small>
                <Pagination className="mb-0">
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                  {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Pagination>
              </div>
            </Card.Footer>
          )}
        </Card>

        {/* Modal Ajouter Docteur */}
        <Modal scrollable show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered contentClassName={theme === "dark" ? "bg-dark text-light" : ""}>
          <Modal.Header closeButton className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Modal.Title>
              <i data-feather="user-plus" className="me-2"></i>
              Ajouter un nouveau docteur
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAddDoctor}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row>
                <Col xs={12} md={6}> {/* Added xs={12} */}
                  <Form.Group className="mb-3">
                    <Form.Label>Nom complet *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: Dr. Jean Martin"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}> {/* Added xs={12} */}
                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="docteur@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col xs={12} md={6}> {/* Added xs={12} */}
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Mot de passe sécurisé"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                      Minimum 8 caractères, majuscules, minuscules et chiffres
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}> {/* Added xs={12} */}
                  <Form.Group className="mb-3">
                    <Form.Label>Confirmer le mot de passe *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirmer le mot de passe"
                      value={formData.password_confirmation}
                      onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                      required
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Alert variant="info" className="d-flex align-items-center">
                <i data-feather="info" className="me-2"></i>
                Le docteur sera automatiquement assigné à votre structure et recevra un matricule unique.
              </Alert>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                  <>
                    <i data-feather="plus" className="me-2"></i>
                    Ajouter le docteur
                  </>
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Inviter Docteur */}
        <Modal scrollable show={showInviteModal} onHide={() => setShowInviteModal(false)} centered contentClassName={theme === "dark" ? "bg-dark text-light" : ""}>
          <Modal.Header closeButton className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Modal.Title>
              <i data-feather="mail" className="me-2"></i>
              Inviter un docteur
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleInviteDoctor}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Form.Group className="mb-3">
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Entrez l'email de l'invité"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Structure ID (Pré-rempli)</Form.Label>
                <Form.Control
                  type="text"
                  value={inviteForm.structure_id}
                  readOnly
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                />
                <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                  Cette valeur est automatiquement définie par votre structure.
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button
                variant="secondary"
                onClick={() => setShowInviteModal(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                <>
                  <i data-feather="send" className="me-2"></i>
                  Envoyer l'invitation
                </>
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Confirmer Suppression */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered contentClassName={theme === "dark" ? "bg-dark text-light" : ""}>
          <Modal.Header closeButton className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Modal.Title className="text-danger">
              <i data-feather="alert-triangle" className="me-2"></i>
              Confirmer la suppression
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedDoctor && (
              <div>
                <Alert variant="danger" className="d-flex align-items-center">
                  <i data-feather="alert-circle" className="me-2"></i>
                  Cette action est irréversible !
                </Alert>
                <p>
                  Êtes-vous sûr de vouloir supprimer le docteur <strong>{selectedDoctor.name}</strong> ?
                </p>
                <ul className={`${theme === "dark" ? "text-light" : "text-muted"} small`}>
                  <li>Matricule: {selectedDoctor.matricule}</li>
                  <li>Email: {selectedDoctor.email}</li>
                  <li>Toutes les données associées seront supprimées</li>
                </ul>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteDoctor}
              disabled={isSubmitting}
            >
                <>
                  <i data-feather="trash-2" className="me-2"></i>
                  Supprimer définitivement
                </>
            </Button>
          </Modal.Footer>
        </Modal>

        {/* CSS personnalisé */}
        <style jsx>{`
          .admin-layout {
            min-height: 100vh;
            background-color: #f8f9fa;
          }

          .table th {
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6c757d;
          }

          .table tbody tr:hover {
            background-color: rgba(0, 123, 255, 0.05);
          }

          .badge {
            font-weight: 500;
          }

          .bg-pink {
            background-color: #e91e63 !important;
          }

          .dropdown-toggle::after {
            display: none;
          }
        `}</style>
      </Container>
    </AdminStructureLayout>
  );
}