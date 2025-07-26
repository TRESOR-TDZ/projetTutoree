import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import fileDownload from "js-file-download";
import {
  Container, Table, Button, Form, Modal, Row, Col, Dropdown, Badge, Card
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";

export default function Patient() {
  // États
  const [patients, setPatients] = useState([]);
  const [structures, setStructures] = useState([]); // Pour le filtre de structure et l'affectation
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);


  // Filtres
  const [search, setSearch] = useState("");
  const [structureIdFilter, setStructureIdFilter] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState(""); // Nouveau filtre pour le genre


  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null); // Changé pour stocker un objet { type, message }
  const [errors, setErrors] = useState({});

  // Formulaire d'ajout de patient
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    structure_id: "", // Ajouté pour pouvoir assigner le patient à une structure
  });

  // Formulaire invitation (pour inviter un patient à rejoindre la plateforme)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    structure_id: "",
    role: "3", // role 3 = patient
  });

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

  // Fonction pour récupérer les patients et les structures avec filtres
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (structureIdFilter) params.structure_id = structureIdFilter;
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter; // Ajout du filtre genre

      const res = await api.get("/admin-systeme/view/patient", { params });
      setPatients(res.data.patients || []);
      setStructures(res.data.structures || []); // Assurez-vous que les structures sont bien récupérées
    } catch (err) {
      console.error("Erreur lors du chargement des patients", err);
      setFlashMessage({ type: "danger", message: "Échec du chargement des patients." });
    } finally {
      setLoading(false);
    }
  }, [search, structureIdFilter, createdAtFilter, statusFilter, genderFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Pour s'assurer que les icônes feather sont remplacées après les mises à jour du DOM
  useEffect(() => {
    feather.replace();
  }, [patients, showAddModal, showInviteModal, showDeleteModal, flashMessage, loading]);

  // Gestionnaire de changement pour les formulaires
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleInviteFormChange = (e) => {
    const { name, value } = e.target;
    setInviteForm((prevInviteForm) => ({ ...prevInviteForm, [name]: value }));
  };

  // Ajout d'un patient
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await api.post("/admin-systeme/store/patient", form);
      fetchPatients();
      setShowAddModal(false);
      setForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        structure_id: "",
      });
      setFlashMessage({ type: "success", message: "Patient ajouté avec succès !" });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error("Erreur lors de l'ajout du patient:", err);
        setFlashMessage({ type: "danger", message: "Erreur lors de l'ajout du patient." });
      }
    } finally {
      setSubmitting(false);
      setTimeout(() => setFlashMessage(null), 4000);
    }
  };

  // Invitation d'un patient
  const handleInvite = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const res = await api.post("/admin-systeme/invitation/users", inviteForm);
      setFlashMessage({ type: "success", message: res.data.message || "Invitation envoyée avec succès !" });
      setShowInviteModal(false);
      setInviteForm({ email: "", structure_id: "", role: "3" });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error("Erreur invitation", err);
        setFlashMessage({ type: "danger", message: "Erreur lors de l'envoi de l'invitation." });
      }
    } finally {
      setSubmitting(false);
      setTimeout(() => setFlashMessage(null), 4000);
    }
  };

  // Confirmation de suppression
  const confirmDelete = (patientId) => {
    setPatientToDelete(patientId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/admin-systeme/destroy/patient/${patientToDelete}`);
      fetchPatients();
      setShowDeleteModal(false);
      setFlashMessage({ type: "success", message: "Patient supprimé avec succès !" });
    } catch (err) {
      console.error("Erreur lors de la suppression du patient:", err);
      setFlashMessage({ type: "danger", message: "Erreur lors de la suppression du patient." });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFlashMessage(null), 4000);
    }
  };

  // Télécharger PDF avec filtres (envoie via query params)
  const handleDownloadPdf = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (structureIdFilter) params.append('structure_id', structureIdFilter);
      if (createdAtFilter) params.append('created_at', createdAtFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (genderFilter) params.append('gender', genderFilter);

      const res = await api.get(`/admin-systeme/download/liste/patient/pdf?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `patients_${new Date().toISOString().slice(0, 10)}.pdf`;
      fileDownload(res.data, filename);
      setFlashMessage({ type: "success", message: "Téléchargement PDF réussi !" });
    } catch (err) {
      console.error("Erreur lors du téléchargement PDF :", err);
      setFlashMessage({ type: "danger", message: "Échec du téléchargement PDF." });
    } finally {
      setTimeout(() => setFlashMessage(null), 4000);
    }
  };

  // Télécharger Excel avec filtres (envoie via query params)
  const handleDownloadExcel = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (structureIdFilter) params.append('structure_id', structureIdFilter);
      if (createdAtFilter) params.append('created_at', createdAtFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (genderFilter) params.append('gender', genderFilter);


      const res = await api.get(`/admin-systeme/download/liste/patient/excel?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `patients_${new Date().toISOString().slice(0, 10)}.xlsx`;
      fileDownload(res.data, filename);
      setFlashMessage({ type: "success", message: "Téléchargement Excel réussi !" });
    } catch (err) {
      console.error("Erreur lors du téléchargement Excel :", err);
      setFlashMessage({ type: "danger", message: "Échec du téléchargement Excel." });
    } finally {
      setTimeout(() => setFlashMessage(null), 4000);
    }
  };

  // Props communes pour les Modals et Form Controls pour la gestion du thème
  const commonModalProps = {
    centered: true,
    contentClassName: theme === "dark" ? "bg-dark text-light" : "",
  };

  const commonModalHeaderProps = {
    className: theme === "dark" ? "bg-dark text-light border-secondary" : "",
    closeButton: true,
  };

  const commonFormControlProps = {
    className: theme === "dark" ? "bg-dark text-light border-secondary" : "",
  };


  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête avec titre et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="users" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Patients
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Vue d'ensemble et administration des patients de la plateforme.
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
                        {patients.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Patients
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
                        {patients.filter(patient => patient.status === "Connecté").length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Patients Actifs
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="activity" style={{ width: "24px", height: "24px" }}></i>
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
                        {patients.filter(patient => patient.status === "En attente").length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Invitations en attente
                      </small>
                    </div>
                    <div className="text-warning">
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
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {structures.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Structures Associées
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="building" style={{ width: "24px", height: "24px" }}></i>
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
                <i data-feather="users" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Liste des Patients
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                {/* Dropdown Export avec style médical */}
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-primary"
                    className="d-flex align-items-center"
                    id="dropdown-export-patients"
                  >
                    <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Exporter les données
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow-lg border-0" style={{ minWidth: "350px" }}>
                    <div className="p-3">
                      <h6 className="text-primary mb-3">
                        <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Rapport PDF
                      </h6>
                      <Form onSubmit={handleDownloadPdf} className="mb-4">
                        <Form.Control
                          type="text"
                          placeholder="Rechercher par nom, email, téléphone..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className={`mb-2 ${commonFormControlProps.className}`}
                        />
                        <Form.Select
                          value={structureIdFilter}
                          onChange={e => setStructureIdFilter(e.target.value)}
                          className={`mb-2 ${commonFormControlProps.className}`}
                        >
                          <option value="">Toutes les structures</option>
                          {structures.map(s => (
                            <option key={s.id} value={s.matricule}>{s.nom}</option>
                          ))}
                        </Form.Select>
                        <Form.Control
                          type="date"
                          value={createdAtFilter}
                          onChange={e => setCreatedAtFilter(e.target.value)}
                          className={`mb-2 ${commonFormControlProps.className}`}
                        />
                        <Form.Select
                          value={statusFilter}
                          onChange={e => setStatusFilter(e.target.value)}
                          className={`mb-2 ${commonFormControlProps.className}`}
                        >
                          <option value="">Tous les statuts</option>
                          <option value="Connecté">Connecté</option>
                          <option value="Déconnecté">Déconnecté</option>
                          <option value="En attente">En attente</option>
                        </Form.Select>
                        <Form.Select
                          value={genderFilter}
                          onChange={e => setGenderFilter(e.target.value)}
                          className={`mb-3 ${commonFormControlProps.className}`}
                        >
                          <option value="">Tous les genres</option>
                          <option value="Homme">Homme</option>
                          <option value="Femme">Femme</option>
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

                <Button variant="info" className="d-flex align-items-center" onClick={() => setShowInviteModal(true)}>
                  <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Inviter
                </Button>

                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowAddModal(true)}>
                  <i data-feather="user-plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Nouveau Patient
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <div className="row g-3">
                <Col md={4}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche globale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nom, email, téléphone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchPatients()}
                    {...commonFormControlProps}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="building" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Structure
                  </Form.Label>
                  <Form.Select
                    value={structureIdFilter}
                    onChange={e => setStructureIdFilter(e.target.value)}
                    {...commonFormControlProps}
                  >
                    <option value="">Toutes</option>
                    {structures.map(s => (
                      <option key={s.id} value={s.matricule}>{s.nom}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date d'ajout
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createdAtFilter}
                    onChange={e => setCreatedAtFilter(e.target.value)}
                    {...commonFormControlProps}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="activity" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    {...commonFormControlProps}
                  >
                    <option value="">Tous</option>
                    <option value="Connecté">Connecté</option>
                    <option value="Déconnecté">Déconnecté</option>
                    <option value="En attente">En attente</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="tag" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Genre
                  </Form.Label>
                  <Form.Select
                    value={genderFilter}
                    onChange={e => setGenderFilter(e.target.value)}
                    {...commonFormControlProps}
                  >
                    <option value="">Tous</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </Form.Select>
                </Col>
                <Col xs={12}> {/* Utilise toute la largeur pour le bouton de filtre */}
                  <Button
                    variant={theme === "dark" ? "outline-light" : "outline-primary"}
                    className="w-100"
                    onClick={fetchPatients}
                  >
                    <i data-feather="filter" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                    Appliquer les filtres
                  </Button>
                </Col>
              </div>
            </div>

            {/* Affichage du message de chargement */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2 text-muted">Chargement des patients...</p>
              </div>
            ) : (
              /* Tableau des données */
              <div className="table-responsive">
                <Table
                  hover
                  className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}
                  style={{ borderRadius: "8px", overflow: "hidden" }}
                >
                  <thead className="table-primary">
                    <tr>
                      <th className="text-center" style={{ width: "50px" }}>#</th>
                      <th>
                        <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Patient
                      </th>
                      <th className="d-none d-md-table-cell">
                        <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Contact
                      </th>
                      <th className="d-none d-lg-table-cell">
                        <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Structure
                      </th>
                      <th className="d-none d-lg-table-cell text-center">
                        <i data-feather="activity" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Statut
                      </th>
                      <th className="text-center">
                        <i data-feather="settings" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length > 0 ? (
                      patients.map((patient, index) => (
                        <tr key={patient.id} className={theme === "dark" ? "border-secondary" : ""}>
                          <td className="text-center">
                            <Badge bg="light" text="dark" className="rounded-circle p-2">
                              {index + 1}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                <i data-feather="user" className="text-primary" style={{ width: "16px", height: "16px" }}></i>
                              </div>
                              <div>
                                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {patient.name}
                                </div>
                                <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                  {patient.gender || "Non spécifié"}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <div>
                              <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                <i data-feather="mail" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {patient.email}
                              </div>
                              <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                <i data-feather="phone" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {patient.code_phone} {patient.phone || "Non renseigné"}
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <div className="d-flex align-items-center">
                              <div className="bg-info bg-opacity-10 rounded-circle p-1 me-2">
                                <i data-feather="building" className="text-info" style={{ width: "14px", height: "14px" }}></i>
                              </div>
                              <span className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {patient.structure?.nom || "Non assignée"}
                              </span>
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell text-center">
                            <Badge
                              bg={
                                patient.status === "Connecté"
                                  ? "success"
                                  : patient.status === "Déconnecté"
                                  ? "secondary"
                                  : "warning"
                              }
                              className="px-3 py-2"
                            >
                              <i
                                data-feather={
                                  patient.status === "Connecté"
                                    ? "check-circle"
                                    : patient.status === "Déconnecté"
                                    ? "x-circle"
                                    : "clock"
                                }
                                className="me-1"
                                style={{ width: "12px", height: "12px" }}
                              ></i>
                              {patient.status || "Indéfini"}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                size="sm"
                                variant="outline-info"
                                title="Voir les détails"
                                as="a"
                                href={`/admin-systeme/show/patient/${patient.id}`}
                              >
                                <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-warning"
                                title="Modifier"
                                as="a"
                                href={`/admin-systeme/edit/patient/${patient.id}`}
                              >
                                <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                title="Supprimer"
                                onClick={() => confirmDelete(patient.id)}
                              >
                                <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                            <i data-feather="users" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                            <div>
                              <h6>Aucun patient trouvé</h6>
                              <p className="small mb-0">Aucun patient ne correspond à vos critères de recherche.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Modal Ajout */}
        <Modal {...commonModalProps} show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>Ajouter un nouveau patient</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={commonModalProps.contentClassName}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nom complet</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="Entrez le nom complet du patient"
                      required
                      value={form.name}
                      onChange={handleFormChange}
                      isInvalid={!!errors.name}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Entrez l'adresse email"
                      required
                      value={form.email}
                      onChange={handleFormChange}
                      isInvalid={!!errors.email}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Entrez le mot de passe"
                      required
                      onChange={handleFormChange}
                      isInvalid={!!errors.password}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Confirmation du mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="password_confirmation"
                      placeholder="Confirmez le mot de passe"
                      required
                      onChange={handleFormChange}
                      isInvalid={!!errors.password_confirmation}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Structure de santé (Optionnel)</Form.Label>
                    <Form.Select
                      name="structure_id"
                      value={form.structure_id}
                      onChange={handleFormChange}
                      isInvalid={!!errors.structure_id}
                      {...commonFormControlProps}
                    >
                      <option value="">Non assignée</option>
                      {structures.map(structure => (
                        <option key={structure.id} value={structure.matricule}>
                          {structure.nom}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.structure_id}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className={commonModalHeaderProps.className}>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Annuler</Button>
              <Button type="submit" variant="success" disabled={submitting}>
                <i data-feather="save" className="me-1" /> {submitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Invitation */}
        <Modal {...commonModalProps} show={showInviteModal} onHide={() => setShowInviteModal(false)}>
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>Inviter un nouveau patient</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleInvite}>
            <Modal.Body className={commonModalProps.contentClassName}>
              <Form.Group className="mb-3">
                <Form.Label>Email du patient</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Entrez l'email du patient à inviter"
                  required
                  value={inviteForm.email}
                  onChange={handleInviteFormChange}
                  isInvalid={!!errors.email}
                  {...commonFormControlProps}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label>Structure de santé (Optionnel)</Form.Label>
                <Form.Select
                  name="structure_id"
                  value={inviteForm.structure_id}
                  onChange={handleInviteFormChange}
                  isInvalid={!!errors.structure_id}
                  {...commonFormControlProps}
                >
                  <option value="">Non assignée</option>
                  {structures.map(s => (
                    <option key={s.id} value={s.matricule}>{s.nom}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.structure_id}</Form.Control.Feedback>
              </Form.Group>
              <Form.Control type="hidden" name="role" value={inviteForm.role} />
            </Modal.Body>
            <Modal.Footer className={commonModalHeaderProps.className}>
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Fermer</Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                <i data-feather="send" className="me-1" /> {submitting ? "Envoi..." : "Envoyer l'invitation"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Confirmation Suppression */}
        <Modal {...commonModalProps} show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>Confirmation de suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body className={commonModalProps.contentClassName}>
            <p>Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.</p>
          </Modal.Body>
          <Modal.Footer className={commonModalHeaderProps.className}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDeleteConfirmed} disabled={submitting}>
              <i data-feather="trash-2" className="me-1" /> {submitting ? "Suppression..." : "Supprimer"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de Message Flash */}
        <Modal
          show={!!flashMessage}
          onHide={() => setFlashMessage(null)}
          backdrop="static"
          keyboard={false}
          {...commonModalProps}
        >
          <Modal.Body className={`text-center ${commonModalProps.contentClassName}`}>
            <i
              data-feather={flashMessage?.type === "success" ? "check-circle" : "alert-triangle"}
              className={`${flashMessage?.type === "success" ? "text-success" : "text-danger"} ${theme === "dark" ? "text-light" : ""}`}
              style={{ width: "40px", height: "40px" }}
            ></i>
            <h5 className={`mt-3 ${theme === "dark" ? "text-light" : ""}`}>{flashMessage?.message}</h5>
          </Modal.Body>
        </Modal>
      </Container>
    </AdminSystemeLayout>
  );
}