import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Button, Form, Row, Col, Modal, Spinner, Alert, Image
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import publicApi from "../../services/publicApi";

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États
  const [patient, setPatient] = useState(null);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Formulaire d'édition - adapté aux nouvelles données backend
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    code_phone: "+237",
    gender: "",
    birthday: "", // Changé de date_naissance à birthday
    structure_id: "",
    password: "",
    password_confirmation: "",
    profil: null // Nouveau champ pour l'image de profil
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

  // Charger les données du patient et les structures
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer le patient - adaptation à la nouvelle structure de réponse
        const patientRes = await api.get(`/admin-systeme/edit/patient/${id}`);
        const patientData = patientRes.data.user; // Changé de patient à user
        
        setPatient(patientData);
        setForm({
          name: patientData.name || "",
          email: patientData.email || "",
          phone: patientData.phone || "",
          code_phone: patientData.code_phone || "+237",
          gender: patientData.gender || "",
          birthday: patientData.birthday || "", // Adapté au nouveau nom de champ
          structure_id: patientData.structure_id || "",
          password: "",
          password_confirmation: "",
          profil: null
        });

        // Définir l'aperçu de l'image existante si elle existe
        if (patientData.profil) {
          setImagePreview(patientData.profil);
        }

        // Récupérer les structures (si nécessaire pour le formulaire)
        try {
          const structuresRes = await api.get("/admin-systeme/view/patient");
          setStructures(structuresRes.data.structures || []);
        } catch (structError) {
          // Les structures sont optionnelles, on continue même en cas d'erreur
          console.warn("Erreur lors du chargement des structures:", structError);
          setStructures([]);
        }
        
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        let errorMessage = "Erreur lors du chargement des données du patient.";
        
        if (err.response?.status === 404) {
          errorMessage = "Patient introuvable.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        setFlashMessage({ 
          type: "danger", 
          message: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Pour s'assurer que les icônes feather sont remplacées
  useEffect(() => {
    feather.replace();
  }, [patient, flashMessage, loading]);

  // Gestionnaire de changement pour le formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // Gestionnaire pour les fichiers image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profil: ['Veuillez sélectionner un fichier image valide.'] }));
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profil: ['La taille de l\'image ne doit pas dépasser 2MB.'] }));
        return;
      }

      // Supprimer les erreurs précédentes
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profil;
        return newErrors;
      });

      setForm(prevForm => ({ ...prevForm, profil: file }));

      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer l'image sélectionnée
  const removeImage = () => {
    setForm(prevForm => ({ ...prevForm, profil: null }));
    setImagePreview(patient?.profil || null);
    document.getElementById('profil-input').value = '';
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    setErrors({});
    setSubmitting(true);
    setShowConfirmModal(false);
    
    try {
      // Préparer les données selon la nouvelle validation backend
      const formData = new FormData();
      
      // Ajouter tous les champs du formulaire
      Object.keys(form).forEach(key => {
        if (key === 'profil') {
          // Ajouter le fichier image seulement s'il y en a un nouveau
          if (form[key] instanceof File) {
            formData.append('profil', form[key]);
          }
        } else if (key === 'password' || key === 'password_confirmation') {
          // N'ajouter les mots de passe que s'ils sont renseignés
          if (form[key]) {
            formData.append(key, form[key]);
          }
        } else {
          formData.append(key, form[key]);
        }
      });

      formData.append('_method', 'PUT');

      const response = await api.post(`/admin-systeme/update/patient/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setFlashMessage({ 
        type: "success", 
        message: response.data.message || "Patient modifié avec succès !" 
      });
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/admin-systeme/view/patient');
      }, 2000);
      
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setFlashMessage({ 
          type: "danger", 
          message: err.response.data.message || "Erreur de validation des données." 
        });
      } else if (err.response?.status === 404) {
        setFlashMessage({ 
          type: "danger", 
          message: "Patient introuvable." 
        });
      } else {
        console.error("Erreur lors de la modification du patient:", err);
        setFlashMessage({ 
          type: "danger", 
          message: err.response?.data?.message || "Erreur lors de la modification du patient." 
        });
      }
    } finally {
      setSubmitting(false);
      setTimeout(() => setFlashMessage(null), 4000);
    }
  };

  // Props communes pour la gestion du thème
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

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Chargement des données du patient...</p>
          </div>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
                <i data-feather="edit" className="text-warning" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Modifier le Patient
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Modification des informations du patient : <strong>{patient?.name}</strong>
                </p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/admin-systeme/view/patient')}
                className="d-flex align-items-center"
              >
                <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Retour à la liste
              </Button>
              <Button 
                variant="outline-info" 
                as="a"
                href={`/admin-systeme/show/patient/${id}`}
                className="d-flex align-items-center"
              >
                <i data-feather="eye" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Voir les détails
              </Button>
            </div>
          </div>
        </div>

        {/* Message Flash */}
        {flashMessage && (
          <Alert 
            variant={flashMessage.type} 
            dismissible 
            onClose={() => setFlashMessage(null)}
            className="mb-4"
          >
            <div className="d-flex align-items-center">
              <i 
                data-feather={flashMessage.type === "success" ? "check-circle" : "alert-triangle"}
                className="me-2"
                style={{ width: "18px", height: "18px" }}
              ></i>
              {flashMessage.message}
            </div>
          </Alert>
        )}

        {/* Formulaire principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="user" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Informations du Patient
              </span>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            <Form onSubmit={handleSubmit}>
              <Row className="g-4">
                {/* Photo de profil */}
                <Col xs={12}>
                  <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="camera" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Photo de profil
                  </h5>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className={theme === "dark" ? "text-light" : ""}>
                      Image de profil
                    </Form.Label>
                    <div className="d-flex align-items-center gap-4">
                      <div className="text-center">
                        
                          <div className="position-relative">
                            <Card.Img
                              src={
                                    patient?.profil
                                    ? `${publicApi.defaults.baseURL}/storage/profil/${patient?.profil}`
                                    : `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`
                                }
                              rounded
                              style={{ 
                                width: "120px", 
                                height: "120px", 
                                objectFit: "cover",
                                border: `3px solid ${theme === "dark" ? "#6c757d" : "#dee2e6"}`
                              }}
                            />
                          </div>
                        
                      </div>

                      <div className="text-center">
                        
                          <div className="position-relative">
                            <Image
                              src={imagePreview}
                              rounded
                              style={{ 
                                width: "120px", 
                                height: "120px", 
                                objectFit: "cover",
                                border: `3px solid ${theme === "dark" ? "#6c757d" : "#dee2e6"}`
                              }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 rounded-circle"
                              style={{ width: "30px", height: "30px", padding: "0" }}
                              onClick={removeImage}
                            >
                              <i data-feather="x" style={{ width: "14px", height: "14px" }}></i>
                            </Button>
                          </div>
                        
                      </div>
                      <div className="flex-grow-1">
                        <Form.Control
                          type="file"
                          id="profil-input"
                          accept="image/*"
                          onChange={handleImageChange}
                          isInvalid={!!errors.profil}
                          {...commonFormControlProps}
                        />
                        <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                          Formats acceptés : JPG, PNG, GIF. Taille maximale : 2MB
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {errors.profil && errors.profil[0]}
                        </Form.Control.Feedback>
                      </div>
                    </div>
                  </Form.Group>
                </Col>

                {/* Informations personnelles */}
                <Col xs={12}>
                  <hr className={theme === "dark" ? "border-secondary" : ""} />
                  <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="user" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Informations personnelles
                  </h5>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={theme === "dark" ? "text-light" : ""}>
                      Nom complet <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="Nom complet du patient"
                      required
                      value={form.name}
                      onChange={handleFormChange}
                      isInvalid={!!errors.name}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name && errors.name[0]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={theme === "dark" ? "text-light" : ""}>
                      Email <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Adresse email"
                      required
                      value={form.email}
                      onChange={handleFormChange}
                      isInvalid={!!errors.email}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email && errors.email[0]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={theme === "dark" ? "text-light" : ""}>Genre</Form.Label>
                    <Form.Select
                      name="gender"
                      value={form.gender}
                      onChange={handleFormChange}
                      isInvalid={!!errors.gender}
                      {...commonFormControlProps}
                    >
                      <option value="">Sélectionner le genre</option>
                      <option value="Masculin">Masculin</option>
                      <option value="Féminin">Féminin</option>
                      <option value="Autre">Autre</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.gender && errors.gender[0]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={theme === "dark" ? "text-light" : ""}>
                      Date de naissance
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="birthday"
                      value={form.birthday}
                      onChange={handleFormChange}
                      isInvalid={!!errors.birthday}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.birthday && errors.birthday[0]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={theme === "dark" ? "text-light" : ""}>Téléphone</Form.Label>
                    <div className="d-flex">
                      <Form.Select
                        name="code_phone"
                        value={form.code_phone}
                        onChange={handleFormChange}
                        style={{ maxWidth: "100px" }}
                        {...commonFormControlProps}
                      >
                        <option value="+237">+237</option>
                        <option value="+33">+33</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                      </Form.Select>
                      <Form.Control
                        type="tel"
                        name="phone"
                        placeholder="Numéro de téléphone"
                        value={form.phone}
                        onChange={handleFormChange}
                        isInvalid={!!errors.phone}
                        className={`ms-2 ${commonFormControlProps.className}`}
                      />
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {errors.phone && errors.phone[0]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {/* Informations médicales */}
                {structures.length > 0 && (
                  <>
                    <Col xs={12}>
                      <hr className={theme === "dark" ? "border-secondary" : ""} />
                      <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="building" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Affectation médicale
                      </h5>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : ""}>
                          Structure de santé
                        </Form.Label>
                        <Form.Select
                          name="structure_id"
                          value={form.structure_id}
                          onChange={handleFormChange}
                          isInvalid={!!errors.structure_id}
                          {...commonFormControlProps}
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
                  </>
                )}

                {/* Sécurité */}
                <Col xs={12}>
                  <hr className={theme === "dark" ? "border-secondary" : ""} />
                  <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="lock" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Sécurité (optionnel)
                  </h5>
                  <p className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Laissez vide pour conserver le mot de passe actuel. 
                    Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres.
                  </p>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={theme === "dark" ? "text-light" : ""}>
                      Nouveau mot de passe
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Nouveau mot de passe"
                      value={form.password}
                      onChange={handleFormChange}
                      isInvalid={!!errors.password}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password && errors.password[0]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className={theme === "dark" ? "text-light" : ""}>
                      Confirmation du mot de passe
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password_confirmation"
                      placeholder="Confirmer le nouveau mot de passe"
                      value={form.password_confirmation}
                      onChange={handleFormChange}
                      isInvalid={!!errors.password_confirmation}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password_confirmation && errors.password_confirmation[0]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {/* Boutons d'action */}
                <Col xs={12}>
                  <hr className={theme === "dark" ? "border-secondary" : ""} />
                  <div className="d-flex justify-content-end gap-3">
                    <Button 
                      type="button"
                      variant="outline-secondary"
                      onClick={() => navigate('/admin-systeme/patient')}
                      className="d-flex align-items-center"
                    >
                      <i data-feather="x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      variant="warning"
                      disabled={submitting}
                      className="d-flex align-items-center"
                    >
                      <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      {submitting ? "Mise à jour..." : "Mettre à jour"}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Modal de confirmation */}
        <Modal {...commonModalProps} show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>Confirmer les modifications</Modal.Title>
          </Modal.Header>
          <Modal.Body className={commonModalProps.contentClassName}>
            <div className="text-center">
              <i 
                data-feather="edit" 
                className="text-warning mb-3" 
                style={{ width: "48px", height: "48px" }}
              ></i>
              <h5 className={theme === "dark" ? "text-light" : "text-dark"}>
                Êtes-vous sûr de vouloir modifier ce patient ?
              </h5>
              <p className={theme === "dark" ? "text-light" : "text-muted"}>
                Les informations du patient <strong>{patient?.name}</strong> seront mises à jour.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className={commonModalHeaderProps.className}>
            <Button 
              variant="secondary" 
              onClick={() => setShowConfirmModal(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="warning" 
              onClick={handleConfirmUpdate}
              disabled={submitting}
            >
              <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              {submitting ? "Mise à jour..." : "Confirmer"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AdminSystemeLayout>
  );
}