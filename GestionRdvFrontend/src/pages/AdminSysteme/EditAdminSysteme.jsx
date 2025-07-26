import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Button, Form, Row, Col, Modal, Alert, Spinner
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import publicApi from "../../services/publicApi";

export default function EditAdminSysteme() {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [user, setUser] = useState(null);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flashMessage, setFlashMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Formulaire
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

  // Chargement des données utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données de l'utilisateur
        const userRes = await api.get(`/admin-systeme/edit/admin-systeme/${id}`);
        const userData = userRes.data.user;
        setUser(userData);

        // Récupérer les structures disponibles
        const structuresRes = await api.get("/admin-systeme/view/admin-systeme");
        setStructures(structuresRes.data.structures || []);

        // Pré-remplir le formulaire
        setForm({
          name: userData.name || "",
          email: userData.email || "",
          birthday: userData.birthday || "",
          gender: userData.gender || "",
          code_phone: userData.code_phone || "",
          phone: userData.phone || "",
          structure_id: userData.structure_id || "",
          password: "",
          password_confirmation: "",
          profil: null
        });

      } catch (err) {
        console.error("Erreur lors du chargement des données", err);
        if (err.response?.status === 404) {
          setFlashMessage("Utilisateur introuvable");
          setTimeout(() => navigate("/admin-systeme"), 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, navigate]);

  useEffect(() => {
    feather.replace();
  }, [loading, user]);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "profil") {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      
      // Ajouter tous les champs au FormData
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== "") {
          if (key === "profil" && form[key] instanceof File) {
            formData.append(key, form[key]);
          } else if (key !== "profil") {
            formData.append(key, form[key]);
          }
        }
      });

      // Méthode PUT simulée pour Laravel
      formData.append("_method", "PUT");

      await api.post(`/admin-systeme/update/admin-systeme/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFlashMessage("Administrateur mis à jour avec succès");
      setTimeout(() => {
        navigate("/admin-systeme/view/admin-systeme");
      }, 2000);

    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error("Erreur lors de la mise à jour", err);
        setFlashMessage("Erreur lors de la mise à jour");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Suppression
  const handleDelete = async () => {
    try {
      await api.delete(`/admin-systeme/destroy/admin-systeme/${id}`);
      setFlashMessage("Administrateur supprimé avec succès");
      setTimeout(() => {
        navigate("/admin-systeme/view/admin-systeme");
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de la suppression", err);
      setFlashMessage("Erreur lors de la suppression");
    }
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4 text-center">
          <Spinner animation="border" variant="primary" />
          <div className={`mt-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
            Chargement des données...
          </div>
        </Container>
      </AdminSystemeLayout>
    );
  }

  if (!user) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4 text-center">
          <Alert variant="warning">
            <i data-feather="alert-triangle" className="me-2"></i>
            Utilisateur introuvable
          </Alert>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête avec navigation */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <Button
                variant="outline-secondary"
                className="me-3"
                onClick={() => navigate("/admin-systeme/view/admin-systeme")}
              >
                <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Retour
              </Button>
              
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
                <i data-feather="edit" className="text-warning" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Modifier l'Administrateur Système
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Modification des informations de {user.name}
                </p>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button
                variant="outline-danger"
                className="d-flex align-items-center"
                onClick={() => setShowDeleteModal(true)}
              >
                <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Supprimer
              </Button>
            </div>
          </div>

          {/* Carte informations actuelles */}
          <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-light"}`}>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                  <i data-feather="shield" className="text-info" style={{ width: "24px", height: "24px" }}></i>
                </div>
                <div className="flex-grow-1">
                  <h5 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {user.name}
                  </h5>
                  <div className="d-flex flex-wrap gap-4">
                    <span className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <i data-feather="mail" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                      {user.email}
                    </span>
                    <span className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <i data-feather="building" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                      {user.structure?.nom || "Non assignée"}
                    </span>
                    <span className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <i data-feather="calendar" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                      Créé le {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {user.profil && (
                  <div className="ms-3">
                    <img
                      src={
                        user.profil
                        ? `${publicApi.defaults.baseURL}/storage/profil/${user.profil}`
                        : `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`
                      }
                      alt="Profil"
                      className="rounded-circle border"
                      style={{ width: "60px", height: "60px", objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Formulaire de modification */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="edit-3" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Informations à modifier
              </span>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            <Form onSubmit={handleSubmit}>
              <Row className="g-4">
                {/* Photo de profil */}
                <Col md={12}>
                  <div className="text-center mb-4">
                    <div className="mb-3">
                      {user.profil ? (
                        <img
                          src={
                            user.profil
                            ? `${publicApi.defaults.baseURL}/storage/profil/${user.profil}`
                            : `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`
                          }
                          alt="Profil actuel"
                          className="rounded-circle border shadow"
                          style={{ width: "120px", height: "120px", objectFit: "cover" }}
                        />
                      ) : (
                        <div className="bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center border"
                             style={{ width: "120px", height: "120px", margin: "0 auto" }}>
                          <i data-feather="user" style={{ width: "40px", height: "40px" }}></i>
                        </div>
                      )}
                    </div>
                    <Form.Group>
                      <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="camera" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Nouvelle photo de profil
                      </Form.Label>
                      <Form.Control
                        type="file"
                        name="profil"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleInputChange}
                        isInvalid={!!errors.profil}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">{errors.profil}</Form.Control.Feedback>
                      <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                        Formats acceptés: JPG, JPEG, PNG, WEBP (max: 2MB)
                      </Form.Text>
                    </Form.Group>
                  </div>
                </Col>

                {/* Informations personnelles */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Nom complet
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
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Adresse email
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
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
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
                    <Form.Control.Feedback type="invalid">{errors.birthday}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
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
                      <option value="">Sélectionner le genre</option>
                      <option value="Masculin">Masculin</option>
                      <option value="Féminin">Féminin</option>
                      <option value="Autre">Autre</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.gender}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {/* Contact */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="flag" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Code pays
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="code_phone"
                      placeholder="+237"
                      value={form.code_phone}
                      onChange={handleInputChange}
                      isInvalid={!!errors.code_phone}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.code_phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="phone" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Numéro de téléphone
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      placeholder="Entrez le numéro"
                      value={form.phone}
                      onChange={handleInputChange}
                      isInvalid={!!errors.phone}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {/* Structure */}
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="building" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Structure d'affectation
                    </Form.Label>
                    <Form.Select
                      name="structure_id"
                      value={form.structure_id}
                      onChange={handleInputChange}
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

                {/* Sécurité */}
                <Col md={12}>
                  <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="lock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Modification du mot de passe (optionnel)
                    </h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            Nouveau mot de passe
                          </Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            placeholder="Laisser vide pour ne pas modifier"
                            value={form.password}
                            onChange={handleInputChange}
                            isInvalid={!!errors.password}
                            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                          />
                          <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            Confirmer le mot de passe
                          </Form.Label>
                          <Form.Control
                            type="password"
                            name="password_confirmation"
                            placeholder="Confirmer le nouveau mot de passe"
                            value={form.password_confirmation}
                            onChange={handleInputChange}
                            isInvalid={!!errors.password_confirmation}
                            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                          />
                          <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                      <i data-feather="info" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                      Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres
                    </Form.Text>
                  </div>
                </Col>
              </Row>

              {/* Boutons d'action */}
              <div className="d-flex justify-content-between mt-4 pt-4 border-top">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate("/admin-systeme/view/admin-systeme")}
                  disabled={submitting}
                >
                  <i data-feather="x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Annuler
                </Button>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="success"
                    disabled={submitting}
                    className="d-flex align-items-center"
                  >
                    <>
                        <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Sauvegarder les modifications
                    </>
                  </Button>
                </div>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Modal Confirmation Suppression */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>
              <i data-feather="alert-triangle" className="text-danger me-2" style={{ width: "20px", height: "20px" }}></i>
              Confirmation de suppression
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <div className="text-center">
              <div className="bg-danger bg-opacity-10 rounded-circle p-3 mb-3 d-inline-flex">
                <i data-feather="trash-2" className="text-danger" style={{ width: "32px", height: "32px" }}></i>
              </div>
              <h5>Supprimer l'administrateur ?</h5>
              <p className={theme === "dark" ? "text-light" : "text-muted"}>
                Êtes-vous sûr de vouloir supprimer définitivement <strong>{user.name}</strong> ?
                Cette action est irréversible.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              <i data-feather="x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Supprimer définitivement
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
              data-feather={flashMessage.includes("Erreur") ? "alert-circle" : "check-circle"}
              className={`${flashMessage.includes("Erreur") ? "text-danger" : "text-success"} ${theme === "dark" ? "text-light" : ""}`}
              style={{ width: "40px", height: "40px" }}
            ></i>
            <h5 className={`mt-3 ${theme === "dark" ? "text-light" : ""}`}>{flashMessage}</h5>
          </Modal.Body>
        </Modal>
      </Container>
    </AdminSystemeLayout>
  );
}