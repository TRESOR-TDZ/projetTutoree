import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Form, Button, Row, Col, Card, Alert, Modal, Badge, Spinner
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";

export default function EditAdminStructure() {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [admin, setAdmin] = useState(null);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [flashMessage, setFlashMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // État du thème
  const [theme, setTheme] = useState("light");

  // Formulaire de mise à jour
  const [form, setForm] = useState({
    name: "",
    email: "",
    birthday: "",
    gender: "",
    code_phone: "",
    phone: "",
    structure_id: "",
    password: "",
    password_confirmation: "",
    profil: null
  });

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
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupération des données de l'administrateur
        const adminResponse = await api.get(`/admin-systeme/edit/admin-structure/${id}`);
        const adminData = adminResponse.data.user;
        
        setAdmin(adminData);
        setForm({
          name: adminData.name || "",
          email: adminData.email || "",
          birthday: adminData.birthday || "",
          gender: adminData.gender || "",
          code_phone: adminData.code_phone || "",
          phone: adminData.phone || "",
          structure_id: adminData.structure_id || "",
          password: "",
          password_confirmation: "",
          profil: null
        });

        // Récupération des structures (si nécessaire, sinon utiliser une route dédiée)
        const structuresResponse = await api.get('/admin-systeme/view/admin-systeme');
        setStructures(structuresResponse.data.structures || []);

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

    fetchData();
  }, [id]);

  useEffect(() => {
    feather.replace();
  }, [admin, loading]);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "profil" && files) {
      setForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const formData = new FormData();
      
      // Ajout des champs au FormData
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== "") {
          if (key === "profil" && form[key] instanceof File) {
            formData.append(key, form[key]);
          } else if (key !== "profil") {
            formData.append(key, form[key]);
          }
        }
      });

      // Simulation de la méthode PUT avec _method
      formData.append('_method', 'PUT');

      const response = await api.post(`/admin-systeme/update/admin-structure/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFlashMessage(response.data.message || "Administrateur mis à jour avec succès");
      setShowSuccessModal(true);
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/admin-systeme/view/admin-structure');
      }, 2000);

    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error("Erreur lors de la mise à jour", err);
        setFlashMessage("Erreur lors de la mise à jour");
      }
    } finally {
      setSaving(false);
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
            Administrateur introuvable
          </Alert>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
              <i data-feather="edit" className="text-warning" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Modifier l'Administrateur de Structure
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Institut de Santé - Mise à jour des informations administrateur
              </p>
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
                Modifier
              </li>
            </ol>
          </nav>
        </div>

        {/* Informations actuelles */}
        <Row className="mb-4">
          <Col lg={4}>
            <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Informations Actuelles
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-flex">
                    <i data-feather="user-check" className="text-primary" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                </div>
                
                <div className={`text-center mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <h5 className="mb-1">{admin.name}</h5>
                  <Badge bg="primary" className="px-3 py-2">
                    <i data-feather="shield" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                    Admin Structure
                  </Badge>
                </div>

                <div className="small">
                  <div className={`mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="mail" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                    {admin.email}
                  </div>
                  <div className={`mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="phone" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                    {admin.code_phone} {admin.phone || "Non renseigné"}
                  </div>
                  <div className={`mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="calendar" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                    {admin.birthday ? new Date(admin.birthday).toLocaleDateString() : "Non renseigné"}
                  </div>
                  <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="building" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                    {admin.structure?.nom || "Non assigné"}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            {/* Formulaire de mise à jour */}
            <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="edit-3" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Formulaire de Modification
                </h6>
              </Card.Header>
              
              <Form onSubmit={handleSubmit}>
                <Card.Body>
                  {flashMessage && !showSuccessModal && (
                    <Alert variant="danger" className="mb-4">
                      <i data-feather="alert-circle" className="me-2"></i>
                      {flashMessage}
                    </Alert>
                  )}

                  <Row className="g-3">
                    {/* Photo de profil */}
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="image" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Photo de profil
                        </Form.Label>
                        <Form.Control
                          type="file"
                          name="profil"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleInputChange}
                          isInvalid={!!errors.profil}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                          Formats acceptés: JPG, JPEG, PNG, WEBP (Max: 2MB)
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {errors.profil && errors.profil[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Nom complet */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Nom complet *
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Entrez le nom complet"
                          value={form.name}
                          onChange={handleInputChange}
                          isInvalid={!!errors.name}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name && errors.name[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Email */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Adresse email *
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="Entrez l'adresse email"
                          value={form.email}
                          onChange={handleInputChange}
                          isInvalid={!!errors.email}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.email && errors.email[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Date de naissance */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Date de naissance
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="birthday"
                          value={form.birthday}
                          onChange={handleInputChange}
                          isInvalid={!!errors.birthday}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.birthday && errors.birthday[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Genre */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Genre
                        </Form.Label>
                        <Form.Select
                          name="gender"
                          value={form.gender}
                          onChange={handleInputChange}
                          isInvalid={!!errors.gender}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        >
                          <option value="">Sélectionnez le genre</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                          <option value="Autre">Autre</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.gender && errors.gender[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Code téléphone */}
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="hash" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Code pays
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="code_phone"
                          placeholder="Ex: +237"
                          value={form.code_phone}
                          onChange={handleInputChange}
                          isInvalid={!!errors.code_phone}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.code_phone && errors.code_phone[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Téléphone */}
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="phone" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Numéro de téléphone
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          placeholder="Entrez le numéro de téléphone"
                          value={form.phone}
                          onChange={handleInputChange}
                          isInvalid={!!errors.phone}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.phone && errors.phone[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Structure */}
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Structure assignée
                        </Form.Label>
                        <Form.Select
                          name="structure_id"
                          value={form.structure_id}
                          onChange={handleInputChange}
                          isInvalid={!!errors.structure_id}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        >
                          <option value="">Aucune structure assignée</option>
                          {structures.map(structure => (
                            <option key={structure.id} value={structure.matricule}>
                              {structure.nom}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.structure_id && errors.structure_id[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Nouveau mot de passe */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="lock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Nouveau mot de passe
                        </Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          placeholder="Laissez vide pour ne pas changer"
                          value={form.password}
                          onChange={handleInputChange}
                          isInvalid={!!errors.password}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                          Minimum 8 caractères avec majuscules, minuscules et chiffres
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {errors.password && errors.password[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* Confirmation mot de passe */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          <i data-feather="lock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Confirmer le mot de passe
                        </Form.Label>
                        <Form.Control
                          type="password"
                          name="password_confirmation"
                          placeholder="Confirmez le nouveau mot de passe"
                          value={form.password_confirmation}
                          onChange={handleInputChange}
                          isInvalid={!!errors.password_confirmation}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.password_confirmation && errors.password_confirmation[0]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>

                <Card.Footer className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/admin-systeme/view/admin-structure')}
                      className="d-flex align-items-center"
                    >
                      <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Retour à la liste
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="warning"
                      disabled={saving}
                      className="d-flex align-items-center"
                    >
                      <>
                          <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Mettre à jour
                        </>
                    </Button>
                  </div>
                </Card.Footer>
              </Form>
            </Card>
          </Col>
        </Row>

        {/* Modal de succès */}
        <Modal
          show={showSuccessModal}
          centered
          backdrop="static"
          keyboard={false}
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Body className="text-center py-5">
            <div className="mb-4">
              <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-flex">
                <i
                  data-feather="check-circle"
                  className="text-success"
                  style={{ width: "48px", height: "48px" }}
                ></i>
              </div>
            </div>
            <h4 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
              Mise à jour réussie !
            </h4>
            <p className={theme === "dark" ? "text-light" : "text-muted"}>
              {flashMessage}
            </p>
            <div className="mt-4">
              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                Redirection automatique vers la liste...
              </small>
            </div>
          </Modal.Body>
        </Modal>
      </Container>
    </AdminSystemeLayout>
  );
}