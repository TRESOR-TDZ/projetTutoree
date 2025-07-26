import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Table, Button, Form, Modal, Row, Col, Badge, Card,
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";

export default function AdminInvitation() {
  // États
  const [invitations, setInvitations] = useState([]);
  const [structures, setStructures] = useState([]);
  const [stats, setStats] = useState({});

  // Filtres
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [structureIdFilter, setStructureIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // New state for status filter

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState(null);
  const [flashMessage, setFlashMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Formulaire d'invitation
  const [form, setForm] = useState({
    email: "",
    role: "",
    structure_id: "",
  });

  // Etat thème
  const [theme, setTheme] = useState("light");

  // Rôles disponibles
  const roles = {
    0: "Patient",
    1: "Docteur",
    2: "Administrateur Structure",
    3: "Administrateur Système"
  };

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

  // Fonction fetch invitations avec filtres
  const fetchInvitations = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (structureIdFilter) params.structure_id = structureIdFilter;
      if (statusFilter !== "") params.status = statusFilter; // Add status filter to params

      const res = await api.get("/admin-systeme/view/invitations", { params });
      setInvitations(res.data.invitations || []);
      setStructures(res.data.structures || []);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error("Erreur lors du chargement des invitations", err);
    }
  }, [search, roleFilter, structureIdFilter, statusFilter]); // Add statusFilter to dependency array

  useEffect(() => {
    feather.replace();
    fetchInvitations();
  }, [fetchInvitations]);

  useEffect(() => {
    feather.replace();
  }, [invitations]);

  // Envoi invitation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const res = await api.post("/admin-systeme/invitation/users", form);
      fetchInvitations();
      setShowAddModal(false);
      setForm({
        email: "",
        role: "",
        structure_id: "",
      });
      setFlashMessage(res.data.message || "Invitation envoyée avec succès");
      setTimeout(() => setFlashMessage(""), 4000);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error(err);
      }
    }
  };

  // Suppression
  const confirmDelete = (invitationId) => {
    setInvitationToDelete(invitationId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/admin-systeme/destroy/invitations/${invitationToDelete}`);
      fetchInvitations();
      setShowDeleteModal(false);
      setFlashMessage("Invitation supprimée avec succès");
      setTimeout(() => setFlashMessage(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Fonction pour obtenir le badge du rôle
  const getRoleBadge = (role) => {
    const roleConfig = {
      0: { variant: "info", icon: "user", label: "Patient" },
      1: { variant: "success", icon: "stethoscope", label: "Docteur" },
      2: { variant: "warning", icon: "shield", label: "Admin Structure" },
      3: { variant: "danger", icon: "settings", label: "Admin Système" }
    };
    return roleConfig[role] || { variant: "secondary", icon: "user", label: "Inconnu" };
  };

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête avec titre et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="mail" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Invitations
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Institut de Santé - Système d'invitations utilisateurs
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
                        {stats.total || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Invitations
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="mail" style={{ width: "24px", height: "24px" }}></i>
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
                        {stats.doctor || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Docteurs
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="stethoscope" style={{ width: "24px", height: "24px" }}></i>
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
                        {stats.admin_structure || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Admin Structure
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="shield" style={{ width: "24px", height: "24px" }}></i>
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
                        {stats.patient || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Patients
                      </small>
                    </div>
                    <div className="text-info">
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
                <i data-feather="send" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Invitations Système
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowAddModal(true)}>
                  <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Nouvelle Invitation
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
                    Recherche par email
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Email ou nom de structure..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchInvitations()}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="user-check" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Rôle
                  </Form.Label>
                  <Form.Select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les rôles</option>
                    {Object.entries(roles).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="building" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Structure
                  </Form.Label>
                  <Form.Select
                    value={structureIdFilter}
                    onChange={e => setStructureIdFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes les structures</option>
                    {structures.map(s => (
                      <option key={s.id} value={s.matricule}>{s.nom}</option>
                    ))}
                  </Form.Select>
                </Col>
                {/* New Status Filter */}
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="info" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="Acceptée">Acceptée</option>
                    <option value="">En attente</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small opacity-0">Action</Form.Label>
                  <div>
                    <Button
                      variant={theme === "dark" ? "outline-light" : "outline-primary"}
                      className="w-100"
                      onClick={fetchInvitations}
                    >
                      <i data-feather="search" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Filtrer
                    </Button>
                  </div>
                </Col>
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
                      <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Email
                    </th>
                    <th className="d-none d-md-table-cell">
                      <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Rôle
                    </th>
                    <th className="d-none d-md-table-cell">
                      <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Statut
                    </th>
                    <th className="d-none d-lg-table-cell">
                      <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Structure
                    </th>
                    <th className="d-none d-lg-table-cell text-center">
                      <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Date d'envoi
                    </th>
                    <th className="text-center">
                      <i data-feather="settings" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.length ? (
                    invitations.map((invitation, index) => {
                      const roleConfig = getRoleBadge(invitation.role);
                      const isAccepted = invitation.status !== null;
                      return (
                        <tr key={invitation.id} className={theme === "dark" ? "border-secondary" : ""}>
                          <td className="text-center">
                            <Badge bg="light" text="dark" className="rounded-circle p-2">
                              {index + 1}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                <i data-feather="mail" className="text-primary" style={{ width: "16px", height: "16px" }}></i>
                              </div>
                              <div>
                                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {invitation.email}
                                </div>
                                <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                  {invitation.matricule}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <Badge
                              bg={roleConfig.variant}
                              className="px-3 py-2"
                            >
                              <i
                                data-feather={roleConfig.icon}
                                className="me-1"
                                style={{ width: "12px", height: "12px" }}
                              ></i>
                              {roleConfig.label}
                            </Badge>
                          </td>
                          <td className="d-none d-md-table-cell">
                            {isAccepted ? (
                              <Badge bg="success" className="px-3 py-2">
                                <i data-feather="check-circle" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                Acceptée
                              </Badge>
                            ) : (
                              <Badge bg="secondary" className="px-3 py-2">
                                <i data-feather="clock" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                En attente
                              </Badge>
                            )}
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <div className="d-flex align-items-center">
                              <div className="bg-info bg-opacity-10 rounded-circle p-1 me-2">
                                <i data-feather="building" className="text-info" style={{ width: "14px", height: "14px" }}></i>
                              </div>
                              <span className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {invitation.structure?.nom || "Non assignée"}
                              </span>
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell text-center">
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>
                              {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                            </small>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                size="sm"
                                variant="outline-danger"
                                title="Supprimer"
                                onClick={() => confirmDelete(invitation.id)}
                              >
                                <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                          <i data-feather="mail" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                          <div>
                            <h6>Aucune invitation trouvée</h6>
                            <p className="small mb-0">Aucune invitation ne correspond à vos critères de recherche.</p>
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
            <Modal.Title>
              <i data-feather="mail" className="me-2" style={{ width: "20px", height: "20px" }}></i>
              Envoyer une invitation
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>
                      <i data-feather="mail" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Adresse email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Entrez l'adresse email"
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
                    <Form.Label>
                      <i data-feather="user-check" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Rôle
                    </Form.Label>
                    <Form.Select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      isInvalid={!!errors.role}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    >
                      <option value="">Choisir un rôle</option>
                      {Object.entries(roles).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.role}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      <i data-feather="building" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Structure
                    </Form.Label>
                    <Form.Select
                      value={form.structure_id}
                      onChange={e => setForm({ ...form, structure_id: e.target.value })}
                      isInvalid={!!errors.structure_id}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    >
                      <option value="">Aucune structure</option>
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
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success">
                <i data-feather="send" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Envoyer l'invitation
              </Button>
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
            <Modal.Title>
              <i data-feather="alert-triangle" className="me-2 text-warning" style={{ width: "20px", height: "20px" }}></i>
              Confirmation de suppression
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Êtes-vous sûr de vouloir supprimer cette invitation ?</p>
            <p className="small text-muted">Cette action est irréversible.</p>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
              <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Supprimer
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