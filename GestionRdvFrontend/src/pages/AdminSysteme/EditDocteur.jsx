import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import publicApi from "../../services/publicApi";
import feather from "feather-icons";
import {
  Container, Card, Button, Form, Modal, Row, Col, Spinner, Alert
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";

export default function EditDocteur() {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [docteur, setDocteur] = useState(null);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Messages et erreurs
  const [flashMessage, setFlashMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState({ type: "", message: "" });

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Formulaire d'édition
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

  // Preview de l'image
  const [imagePreview, setImagePreview] = useState(null);

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

  // Charger les données du docteur et les structures
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données du docteur
        const docteurResponse = await api.get(`/admin-systeme/edit/docteur/${id}`);
        
        if (docteurResponse.data.status === 'success') {
          const userData = docteurResponse.data.user;
          setDocteur(userData);
          
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

          // Si le docteur a une photo de profil
          if (userData.profil) {
            setImagePreview(`${publicApi.defaults.baseURL}/storage/profil/${userData.profil}`);
          }
        }

        // Récupérer la liste des structures
        const structuresResponse = await api.get("/admin-systeme/view/docteur");
        setStructures(structuresResponse.data.structures || []);

      } catch (err) {
        console.error("Erreur lors du chargement des données", err);
        setAlertMessage({
          type: "danger",
          message: "Erreur lors du chargement des données du docteur"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    feather.replace();
  }, [id]);

  useEffect(() => {
    feather.replace();
  }, [form, loading]);

  // Gestion du changement d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, profil: file });
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Mise à jour du docteur
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setUpdating(true);

    try {
      // Créer FormData pour gérer l'upload de fichier
      const formData = new FormData();
      
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== "") {
          if (key === 'profil' && form[key] instanceof File) {
            formData.append(key, form[key]);
          } else if (key !== 'profil') {
            formData.append(key, form[key]);
          }
        }
      });

      // Ajouter la méthode PUT pour Laravel
      formData.append('_method', 'PUT');

      const response = await api.post(`/admin-systeme/update/docteur/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'success') {
        setFlashMessage("Docteur mis à jour avec succès");
        setAlertMessage({
          type: "success",
          message: "Les informations du docteur ont été mises à jour avec succès"
        });
        
        // Actualiser les données
        const updatedUser = response.data.user;
        setDocteur(updatedUser);
        
        setTimeout(() => {
          setFlashMessage("");
          setAlertMessage({ type: "", message: "" });
        }, 4000);

        // Rediriger après 2 secondes
        setTimeout(() => {
            navigate('/admin-systeme/view/docteur');
        }, 2000);
      }

    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setAlertMessage({
          type: "danger",
          message: "Veuillez corriger les erreurs dans le formulaire"
        });
      } else if (err.response?.status === 404) {
        setAlertMessage({
          type: "danger",
          message: "Docteur introuvable"
        });
      } else {
        console.error("Erreur lors de la mise à jour:", err);
        setAlertMessage({
          type: "danger",
          message: "Une erreur est survenue lors de la mise à jour"
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    navigate('/admin-systeme/edit/docteur');
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className={`py-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
          <div className="text-center">
            <Spinner animation="border" role="status" className="text-primary">
              <span className="visually-hidden">Chargement...</span>
            </Spinner>
            <p className={`mt-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Chargement des données du docteur...
            </p>
          </div>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className={`py-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
        {/* En-tête avec navigation */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <Button
              variant={theme === "dark" ? "outline-light" : "outline-secondary"}
              className="me-3"
              onClick={() => navigate('/admin-systeme/edit/docteur')}
            >
              <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Retour
            </Button>
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="edit-3" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Modifier le Docteur
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Modification des informations de {docteur?.name}
              </p>
            </div>
          </div>

          {/* Alertes */}
          {alertMessage.message && (
            <Alert variant={alertMessage.type} className="mb-4">
              <i data-feather={alertMessage.type === "success" ? "check-circle" : "alert-circle"} className="me-2" style={{ width: "16px", height: "16px" }}></i>
              {alertMessage.message}
            </Alert>
          )}
        </div>

        {/* Formulaire principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="user-check" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Informations du Docteur
              </span>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            <Form onSubmit={handleSubmit}>
              <Row className="g-4">
                {/* Section Photo de profil */}
                <Col md={12}>
                  <Card className={`border-0 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Body className="text-center">
                      <div className="mb-3">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Aperçu"
                            className="rounded-circle border border-3 border-primary"
                            style={{ width: "120px", height: "120px", objectFit: "cover" }}
                          />
                        ) : (
                          <div className={`mx-auto rounded-circle border-3 border-dashed d-flex align-items-center justify-content-center ${theme === "dark" ? "border-light bg-dark" : "border-secondary bg-white"}`} style={{ width: "120px", height: "120px" }}>
                            <i data-feather="camera" className={theme === "dark" ? "text-light" : "text-muted"} style={{ width: "40px", height: "40px" }}></i>
                          </div>
                        )}
                      </div>
                      <Form.Group>
                        <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="image" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Photo de profil
                        </Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          isInvalid={!!errors.profil}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.profil}</Form.Control.Feedback>
                        <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                          Formats acceptés: JPG, JPEG, PNG, WEBP (Max: 2MB)
                        </Form.Text>
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Informations personnelles */}
                <Col md={12}>
                  <h5 className={`border-bottom pb-2 mb-3 ${theme === "dark" ? "text-light border-secondary" : "text-dark"}`}>
                    <i data-feather="user" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Informations Personnelles
                  </h5>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="user" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Nom complet *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Entrez le nom complet"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      isInvalid={!!errors.name}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="mail" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Adresse email *
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="exemple@email.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      isInvalid={!!errors.email}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="calendar" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Date de naissance
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={form.birthday}
                      onChange={e => setForm({ ...form, birthday: e.target.value })}
                      isInvalid={!!errors.birthday}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.birthday}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="users" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Genre
                    </Form.Label>
                    <Form.Select
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
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
                <Col md={12}>
                  <h5 className={`border-bottom pb-2 mb-3 mt-3 ${theme === "dark" ? "text-light border-secondary" : "text-dark"}`}>
                    <i data-feather="phone" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Informations de Contact
                  </h5>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="globe" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Code pays
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="+237"
                      value={form.code_phone}
                      onChange={e => setForm({ ...form, code_phone: e.target.value })}
                      isInvalid={!!errors.code_phone}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.code_phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="phone" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Numéro de téléphone
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="123456789"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      isInvalid={!!errors.phone}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {/* Structure et sécurité */}
                <Col md={12}>
                  <h5 className={`border-bottom pb-2 mb-3 mt-3 ${theme === "dark" ? "text-light border-secondary" : "text-dark"}`}>
                    <i data-feather="building" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Structure et Sécurité
                  </h5>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="building" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Structure d'affectation
                    </Form.Label>
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

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="lock" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Nouveau mot de passe
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Laisser vide pour ne pas changer"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      isInvalid={!!errors.password}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                      Minimum 8 caractères, majuscules et minuscules, chiffres requis
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="lock" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      Confirmer le mot de passe
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirmer le nouveau mot de passe"
                      value={form.password_confirmation}
                      onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                      isInvalid={!!errors.password_confirmation}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              {/* Boutons d'action */}
              <hr className={theme === "dark" ? "border-secondary" : ""} />
              <div className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <Button
                    variant={theme === "dark" ? "outline-light" : "outline-secondary"}
                    onClick={handleCancel}
                    disabled={updating}
                  >
                    <i data-feather="x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Annuler
                  </Button>
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant="success"
                    type="submit"
                    disabled={updating}
                    className="d-flex align-items-center"
                  >
                    
                      <>
                        <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Enregistrer les modifications
                      </>
        
                  </Button>
                </div>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Modal Confirmation Annulation */}
        <Modal
          show={showCancelModal}
          onHide={() => setShowCancelModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Confirmer l'annulation</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <div className="text-center">
              <i data-feather="alert-triangle" className="text-warning mb-3" style={{ width: "48px", height: "48px" }}></i>
              <p>Êtes-vous sûr de vouloir annuler ? Toutes les modifications non sauvegardées seront perdues.</p>
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Continuer l'édition
            </Button>
            <Button variant="warning" onClick={confirmCancel}>
              <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Oui, annuler
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
              className="text-success"
              style={{ width: "40px", height: "40px" }}
            ></i>
            <h5 className={`mt-3 ${theme === "dark" ? "text-light" : ""}`}>{flashMessage}</h5>
          </Modal.Body>
        </Modal>
      </Container>
    </AdminSystemeLayout>
  );
}