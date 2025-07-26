import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Button,
  Row,
  Col,
  Card,
  Form,
  Alert,
  Spinner,
  Badge,
  InputGroup,
  Image
} from "react-bootstrap";
import feather from "feather-icons";
import api from "../../services/api";
import AdminStructureLayout from "../../layouts/AdminSysteme/Layout";

export default function EditionDocteur() {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [previewImage, setPreviewImage] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthday: "",
    gender: "",
    code_phone: "",
    phone: "",
    password: "",
    password_confirmation: "",
    profil: null
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Theme state
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

  // Load doctor data
  const loadDoctor = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin-structure/edit/docteur/${id}`);
      if (response.data.status === 'success') {
        const doctorData = response.data.user;
        setDoctor(doctorData);
        setFormData({
          name: doctorData.name || "",
          email: doctorData.email || "",
          birthday: doctorData.birthday || "",
          gender: doctorData.gender || "",
          code_phone: doctorData.code_phone || "",
          phone: doctorData.phone || "",
          password: "",
          password_confirmation: "",
          profil: null
        });
        
        // Set preview image if exists
        if (doctorData.profil) {
          setPreviewImage(`/storage/profil/${doctorData.profil}`);
        }
      } else {
        showAlert("danger", response.data.message || "Erreur lors du chargement du docteur.");
        setTimeout(() => navigate("/admin-structure/docteurs"), 2000);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du docteur:", error);
      showAlert("danger", "Erreur réseau lors du chargement des données.");
      setTimeout(() => navigate("/admin-structure/docteurs"), 2000);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    feather.replace();
    loadDoctor();
  }, [loadDoctor]);

  useEffect(() => {
    feather.replace();
  }, [formData]);

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!validTypes.includes(file.type)) {
        showAlert("danger", "Format de fichier non supporté. Utilisez JPG, PNG ou WEBP.");
        return;
      }

      if (file.size > maxSize) {
        showAlert("danger", "La taille du fichier ne doit pas dépasser 2MB.");
        return;
      }

      setFormData(prev => ({ ...prev, profil: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== "") {
          if (key === 'profil' && formData[key] instanceof File) {
            submitData.append(key, formData[key]);
          } else if (key !== 'profil') {
            submitData.append(key, formData[key]);
          }
        }
      });

      // Ajouter la méthode PUT pour Laravel
      submitData.append('_method', 'PUT');

      const response = await api.post(`/admin-structure/update/docteur/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'success') {
        showAlert("success", response.data.message || "Docteur mis à jour avec succès.");
        setTimeout(() => navigate("/admin-structure/view/docteur"), 2000);
      } else {
        if (response.data.errors) {
          setErrors(response.data.errors);
          const errorMessages = Object.values(response.data.errors).flat().join(" ");
          showAlert("danger", `Erreurs de validation: ${errorMessages}`);
        } else {
          showAlert("danger", response.data.message || "Erreur lors de la mise à jour.");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      showAlert("danger", "Erreur réseau lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <AdminStructureLayout>
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className={`mt-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Chargement des données du docteur...
            </p>
          </div>
        </Container>
      </AdminStructureLayout>
    );
  }

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
                <div className="d-flex align-items-center mb-2">
                  <Button
                    variant={theme === "dark" ? "outline-light" : "outline-secondary"}
                    size="sm"
                    onClick={() => navigate("/admin-structure/docteurs")}
                    className="me-3"
                  >
                    <i data-feather="arrow-left" className="me-1"></i>
                    Retour
                  </Button>
                  <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="edit" className="me-2"></i>
                    Modifier le Docteur
                  </h1>
                </div>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Mettre à jour les informations du Dr. {doctor?.name}
                </p>
              </div>
              <div className="d-flex gap-2">
                <Badge bg="info" className="px-3 py-2">
                  ID: {doctor?.id}
                </Badge>
                <Badge bg="secondary" className="px-3 py-2">
                  Matricule: {doctor?.matricule || 'N/A'}
                </Badge>
              </div>
            </div>
          </Col>
        </Row>

        <Form onSubmit={handleSubmit}>
          <Row className="g-4">
            {/* Informations personnelles */}
            <Col xs={12} lg={8}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-light"}`}>
                  <h5 className="mb-0">
                    <i data-feather="user" className="me-2"></i>
                    Informations personnelles
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Nom complet *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Ex: Dr. Jean Martin"
                          value={formData.name}
                          onChange={handleInputChange}
                          isInvalid={!!errors.name}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                          required
                        />
                        {errors.name && (
                          <Form.Control.Feedback type="invalid">
                            {errors.name[0]}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Email *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="docteur@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          isInvalid={!!errors.email}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                          required
                        />
                        {errors.email && (
                          <Form.Control.Feedback type="invalid">
                            {errors.email[0]}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Date de naissance</Form.Label>
                        <Form.Control
                          type="date"
                          name="birthday"
                          value={formData.birthday}
                          onChange={handleInputChange}
                          isInvalid={!!errors.birthday}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        {errors.birthday && (
                          <Form.Control.Feedback type="invalid">
                            {errors.birthday[0]}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Genre</Form.Label>
                        <Form.Select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          isInvalid={!!errors.gender}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        >
                          <option value="">Sélectionner le genre</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                          <option value="Autre">Autre</option>
                        </Form.Select>
                        {errors.gender && (
                          <Form.Control.Feedback type="invalid">
                            {errors.gender[0]}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={4}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Code pays</Form.Label>
                        <Form.Control
                          type="text"
                          name="code_phone"
                          placeholder="+237"
                          value={formData.code_phone}
                          onChange={handleInputChange}
                          isInvalid={!!errors.code_phone}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        {errors.code_phone && (
                          <Form.Control.Feedback type="invalid">
                            {errors.code_phone[0]}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={8}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Numéro de téléphone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          placeholder="123456789"
                          value={formData.phone}
                          onChange={handleInputChange}
                          isInvalid={!!errors.phone}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        {errors.phone && (
                          <Form.Control.Feedback type="invalid">
                            {errors.phone[0]}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Photo de profil et informations */}
            <Col xs={12} lg={4}>
              <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-light"}`}>
                  <h5 className="mb-0">
                    <i data-feather="camera" className="me-2"></i>
                    Photo de profil
                  </h5>
                </Card.Header>
                <Card.Body className="text-center p-4">
                  <div className="mb-3">
                    {previewImage ? (
                      <Image
                        src={previewImage}
                        alt="Aperçu"
                        width={120}
                        height={120}
                        className="rounded-circle border shadow-sm"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={`rounded-circle border ${theme === "dark" ? "bg-secondary border-secondary" : "bg-light"} d-flex align-items-center justify-content-center`} 
                           style={{ width: '120px', height: '120px', margin: '0 auto' }}>
                        <i data-feather="user" style={{ width: '48px', height: '48px' }} className={theme === "dark" ? "text-light" : "text-muted"}></i>
                      </div>
                    )}
                  </div>
                  
                  <Form.Group>
                    <Form.Control
                      type="file"
                      name="profil"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      isInvalid={!!errors.profil}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    {errors.profil && (
                      <Form.Control.Feedback type="invalid">
                        {errors.profil[0]}
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                      JPG, PNG, WEBP. Max 2MB
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Informations du compte */}
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-light"}`}>
                  <h5 className="mb-0">
                    <i data-feather="info" className="me-2"></i>
                    Informations du compte
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>Créé le:</span>
                    <strong>{formatDate(doctor?.created_at)}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>Modifié le:</span>
                    <strong>{formatDate(doctor?.updated_at)}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>Statut:</span>
                    <Badge bg={doctor?.status === 'Connecté' ? 'success' : 'secondary'}>
                      {doctor?.status || 'Déconnecté'}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Sécurité */}
            <Col xs={12}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-light"}`}>
                  <h5 className="mb-0">
                    <i data-feather="shield" className="me-2"></i>
                    Sécurité (Optionnel)
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Alert variant="info" className="mb-3">
                    <i data-feather="info" className="me-2"></i>
                    Laissez vide si vous ne souhaitez pas changer le mot de passe
                  </Alert>
                  
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Nouveau mot de passe</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="password"
                            name="password"
                            placeholder="Nouveau mot de passe"
                            value={formData.password}
                            onChange={handleInputChange}
                            isInvalid={!!errors.password}
                            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                          />
                          <InputGroup.Text className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
                            <i data-feather="eye" style={{ width: '16px', height: '16px' }}></i>
                          </InputGroup.Text>
                        </InputGroup>
                        {errors.password && (
                          <Form.Control.Feedback type="invalid">
                            {errors.password[0]}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Confirmer le mot de passe</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="password"
                            name="password_confirmation"
                            placeholder="Confirmer le mot de passe"
                            value={formData.password_confirmation}
                            onChange={handleInputChange}
                            isInvalid={!!errors.password_confirmation}
                            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                          />
                          <InputGroup.Text className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
                            <i data-feather="eye" style={{ width: '16px', height: '16px' }}></i>
                          </InputGroup.Text>
                        </InputGroup>
                        {errors.password_confirmation && (
                          <Form.Control.Feedback type="invalid">
                            {errors.password_confirmation[0]}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                    Le mot de passe doit contenir au moins 8 caractères, des majuscules, minuscules et chiffres
                  </Form.Text>
                </Card.Body>
              </Card>
            </Col>

            {/* Actions */}
            <Col xs={12}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="p-4">
                  <div className="d-flex flex-column flex-md-row gap-3 justify-content-between">
                    <div className="d-flex gap-2 flex-wrap">
                      <Button
                        variant="secondary"
                        onClick={() => navigate("/admin-structure/docteurs")}
                        disabled={isSubmitting}
                      >
                        <i data-feather="x" className="me-2"></i>
                        Annuler
                      </Button>
                      
                      <Button
                        variant="outline-primary"
                        onClick={loadDoctor}
                        disabled={isSubmitting}
                      >
                        <i data-feather="refresh-cw" className="me-2"></i>
                        Réinitialiser
                      </Button>
                    </div>

                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSubmitting}
                      className="d-flex align-items-center justify-content-center"
                      style={{ minWidth: '150px' }}
                    >
                      <>
                        <i data-feather="save" className="me-2"></i>
                        Sauvegarder
                    </>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>

        {/* CSS personnalisé */}
        <style jsx>{`
          .form-control:focus {
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
          }

          .card {
            transition: all 0.3s ease;
          }

          .card:hover {
            transform: translateY(-2px);
          }

          .badge {
            font-weight: 500;
          }

          .btn {
            transition: all 0.3s ease;
          }

          .table th {
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6c757d;
          }
        `}</style>
      </Container>
    </AdminStructureLayout>
  );
}