import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import fileDownload from "js-file-download";
import {
  Container, Table, Button, Form, Modal, Row, Col, Dropdown, Badge, Card, 
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";

export default function AdminStructure() {
  // États
  const [adminStr, setAdminStr] = useState([]);
  const [structures, setStructures] = useState([]);

  // Filtres
  const [search, setSearch] = useState("");
  const [structureIdFilter, setStructureIdFilter] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [flashMessage, setFlashMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Formulaire d'ajout
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    structure_id: "",
  });

  // Formulaire invitation
  const [inviteForm, setInviteForm] = useState({
    email: "",
    structure_id: "",
    role: "2", // role 2 = admin structure selon ta fonction index
  });

  // Etat thème
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

  // Fonction fetch admins avec filtres
  const fetchAdminStr = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (structureIdFilter) params.structure_id = structureIdFilter;
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/admin-systeme/view/admin-structure", { params });
      setAdminStr(res.data.adminstr || []);
      setStructures(res.data.structures || []);
    } catch (err) {
      console.error("Erreur lors du chargement des admins structure", err);
    }
  }, [search, structureIdFilter, createdAtFilter, statusFilter]);

  useEffect(() => {
    feather.replace();
    fetchAdminStr();
  }, [fetchAdminStr]);

  useEffect(() => {
    feather.replace();
  }, [adminStr]);

  // Ajout admin structure
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      await api.post("/admin-systeme/store/admin-structure", form);
      fetchAdminStr();
      setShowAddModal(false);
      setForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        structure_id: "",
      });
      setFlashMessage("Administrateur ajouté avec succès");
      setTimeout(() => setFlashMessage(""), 4000);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error(err);
      }
    }
  };

  // Invitation admin structure
  const handleInvite = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const res = await api.post("/admin-systeme/invitation/users", inviteForm);
      setFlashMessage(res.data.message || "Invitation envoyée avec succès");
      setShowInviteModal(false);
      setInviteForm({ email: "", structure_id: "", role: "2" });
      setTimeout(() => setFlashMessage(""), 4000);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error("Erreur invitation", err);
      }
    }
  };

  // Suppression
  const confirmDelete = (adminId) => {
    setAdminToDelete(adminId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/admin-systeme/destroy/admin-structure/${adminToDelete}`);
      fetchAdminStr();
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
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

      const res = await api.get(`/admin-systeme/download/liste/admin-structure/pdf?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `administrateurs_structure_${new Date().toISOString().slice(0, 10)}.pdf`;
      fileDownload(res.data, filename);
    } catch (err) {
      console.error("Erreur lors du téléchargement PDF :", err);
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

      const res = await api.get(`/admin-systeme/download/liste/admin-structure/excel?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `administrateurs_structure_${new Date().toISOString().slice(0, 10)}.xlsx`;
      fileDownload(res.data, filename);
    } catch (err) {
      console.error("Erreur lors du téléchargement Excel :", err);
    }
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
                Gestion des Administrateurs Structure
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Institut de Santé - Administration des structures sanitaires
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
                        {adminStr.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Admins
                      </small>
                    </div>
                    <div className="text-primary">
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
                      <h3 className="mb-0 text-success">
                        {adminStr.filter(admin => admin.status === "Connecté").length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Connectés
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
                        {adminStr.filter(admin => admin.status === "En attente").length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        En attente
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
                        Structures
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
                <i data-feather="shield" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Administrateurs des Structures Sanitaires
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                {/* Dropdown Export avec style médical */}
                <Dropdown>
                  <Dropdown.Toggle 
                    variant="outline-primary" 
                    className="d-flex align-items-center"
                    id="dropdown-export"
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
                          placeholder="Rechercher par nom, email, structure..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="mb-2"
                        />
                        <Form.Select
                          value={structureIdFilter}
                          onChange={e => setStructureIdFilter(e.target.value)}
                          className="mb-2"
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
                          <option value="En attente">En attente</option>
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
                  Nouvel Admin
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <div className="row g-3">
                <div className="col-md-4">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche globale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nom, email, téléphone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchAdminStr()}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="building" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Structure
                  </Form.Label>
                  <Form.Select
                    value={structureIdFilter}
                    onChange={e => setStructureIdFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes</option>
                    {structures.map(s => (
                      <option key={s.id} value={s.matricule}>{s.nom}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createdAtFilter}
                    onChange={e => setCreatedAtFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="activity" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous</option>
                    <option value="Connecté">Connecté</option>
                    <option value="Déconnecté">Déconnecté</option>
                    <option value="En attente">En attente</option>
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className="small opacity-0">Action</Form.Label>
                  <div>
                    <Button 
                      variant={theme === "dark" ? "outline-light" : "outline-primary"} 
                      className="w-100"
                      onClick={fetchAdminStr}
                    >
                      <i data-feather="search" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Filtrer
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des données */}
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
                      Administrateur
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
                  {adminStr.length ? (
                    adminStr.map((admin, index) => (
                      <tr key={admin.id} className={theme === "dark" ? "border-secondary" : ""}>
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
                                {admin.name}
                              </div>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                {admin.gender || "Non spécifié"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <div>
                            <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <i data-feather="mail" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                              {admin.email}
                            </div>
                            <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                              <i data-feather="phone" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                              {admin.code_phone} {admin.phone || "Non renseigné"}
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-lg-table-cell">
                          <div className="d-flex align-items-center">
                            <div className="bg-info bg-opacity-10 rounded-circle p-1 me-2">
                              <i data-feather="building" className="text-info" style={{ width: "14px", height: "14px" }}></i>
                            </div>
                            <span className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {admin.structure?.nom || "Non assignée"}
                            </span>
                          </div>
                        </td>
                        <td className="d-none d-lg-table-cell text-center">
                          <Badge
                            bg={
                              admin.status === "Connecté"
                                ? "success"
                                : admin.status === "Déconnecté"
                                ? "secondary"
                                : "warning"
                            }
                            className="px-3 py-2"
                          >
                            <i 
                              data-feather={
                                admin.status === "Connecté"
                                  ? "check-circle"
                                  : admin.status === "Déconnecté"
                                  ? "x-circle"
                                  : "clock"
                              }
                              className="me-1"
                              style={{ width: "12px", height: "12px" }}
                            ></i>
                            {admin.status || "Indéfini"}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              size="sm"
                              variant="outline-info"
                              title="Voir les détails"
                              as="a"
                              href={`/admin-systeme/show/admin-structure/${admin.id}`}
                            >
                              <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-warning"
                              title="Modifier"
                              as="a"
                              href={`/admin-systeme/edit/admin-structure/${admin.id}`}
                            >
                              <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              title="Supprimer"
                              onClick={() => confirmDelete(admin.id)}
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
                            <h6>Aucun administrateur trouvé</h6>
                            <p className="small mb-0">Aucun administrateur de structure ne correspond à vos critères de recherche.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Modal Ajout */}
        <Modal
            show={showAddModal}
            onHide={() => setShowAddModal(false)}
            centered
            size="lg"
            contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
            <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Ajouter un administrateur système</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
                <Row className="g-3">
                <Col md={6}>
                    <Form.Group>
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Entrez le nom complet"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        isInvalid={!!errors.name}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Entrez l'email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        isInvalid={!!errors.email}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Entrez le mot de passe"
                        required
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        isInvalid={!!errors.password}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                    <Form.Label>Confirmation</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Confirmez le mot de passe"
                        required
                        onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                        isInvalid={!!errors.password_confirmation}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                    </Form.Group>
                </Col>
                <Col md={12}>
                    <Form.Group>
                    <Form.Label>Structure</Form.Label>
                    <Form.Select
                        value={form.structure_id}
                        onChange={e => setForm({ ...form, structure_id: e.target.value })}
                        isInvalid={!!errors.structure_id}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
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
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>Annuler</Button>
                <Button type="submit" variant="success"><i data-feather="save" /> Enregistrer</Button>
            </Modal.Footer>
            </Form>
        </Modal>

        {/* Modal Invitation */}
        <Modal
            show={showInviteModal}
            onHide={() => setShowInviteModal(false)}
            centered
            contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
            <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Inviter un admin</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleInvite}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
                <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                    type="email"
                    placeholder="Entrez l'email de l'invité"
                    name="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    isInvalid={!!errors.email}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                <Form.Label>Structure</Form.Label>
                <Form.Select
                    name="structure_id"
                    value={inviteForm.structure_id}
                    onChange={(e) => setInviteForm({ ...inviteForm, structure_id: e.target.value })}
                    isInvalid={!!errors.structure_id}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                >
                    <option value="">Non assignée</option>
                    {structures.map(s => (
                    <option key={s.id} value={s.matricule}>{s.nom}</option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.structure_id}</Form.Control.Feedback>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
                <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Fermer</Button>
                <Button type="submit" variant="primary"><i data-feather="send" /> Envoyer</Button>
            </Modal.Footer>
            </Form>
        </Modal>

        {/* Modal Confirmation Suppression */}
        <Modal
            show={showDeleteModal}
            onHide={() => setShowDeleteModal(false)}
            centered
            contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
            <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Êtes-vous sûr de vouloir supprimer cet administrateur ?</p>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
                <i data-feather="trash-2" /> Supprimer
            </Button>
            </Modal.Footer>
        </Modal>

        {/* Modal de Message Flash */}
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
                className={`text-success ${theme === "dark" ? "text-light" : ""}`}
                style={{ width: "40px", height: "40px" }}
            ></i>
            <h5 className={`mt-3 ${theme === "dark" ? "text-light" : ""}`}>{flashMessage}</h5>
            </Modal.Body>
        </Modal>
        </Container>
    </AdminSystemeLayout>
    );
}
