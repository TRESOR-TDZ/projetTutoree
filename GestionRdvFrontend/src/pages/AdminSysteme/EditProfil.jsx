import React, { useEffect, useState, useRef } from "react";
import {  useNavigate } from "react-router-dom";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Row, Col, Form, Button, Spinner, Alert
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import publicApi from "../../services/publicApi";

export default function ProfileEdit() {
  // États
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthday: '',
    gender: '',
    code_phone: '',
    phone: '',
    password: '',
    password_confirmation: '',
    profil: null
  });
  const [errors, setErrors] = useState({});
  const [profilePreview, setProfilePreview] = useState(null);

  // État thème
  const [theme, setTheme] = useState("light");
  
  // Ref pour éviter les conflits avec feather
  const featherInitialized = useRef(false);

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

  // Récupérer les informations de l'utilisateur
  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const res = await api.get("/me");
      setUser(res.data);
      
      // Pré-remplir le formulaire
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
        birthday: res.data.birthday ? res.data.birthday.split('T')[0] : '',
        gender: res.data.gender || '',
        code_phone: res.data.code_phone || '',
        phone: res.data.phone || '',
        password: '',
        password_confirmation: '',
        profil: null
      });
    } catch (err) {
      console.error("Erreur lors du chargement du profil", err);
      setFlashMessage({ type: "danger", message: "Échec du chargement du profil." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Initialiser feather icons de manière sécurisée
  useEffect(() => {
    const initFeather = () => {
      try {
        // Attendre que le DOM soit stable
        setTimeout(() => {
          feather.replace();
          featherInitialized.current = true;
        }, 100);
      } catch (error) {
        console.warn("Erreur lors de l'initialisation de feather:", error);
      }
    };

    if (!loading && user) {
      initFeather();
    }
  }, [user, loading, flashMessage]);

  // Gestion des changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Supprimer l'erreur pour ce champ s'il y en a une
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Gestion du changement de l'image de profil
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profil: file
      }));

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFlashMessage(null);

    try {
      const formDataToSend = new FormData();
      
      // Ajouter tous les champs au FormData
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          if (key === 'profil' && formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          } else if (key !== 'profil') {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      // Ajouter la méthode PUT (simulation pour FormData)
      formDataToSend.append('_method', 'PUT');

      const res = await api.post("/me/update", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        setFlashMessage({ 
          type: "success", 
          message: res.data.message || "Profil mis à jour avec succès!" 
        });
        
        // Actualiser les données utilisateur
        setUser(res.data.data.user);
        
        // Réinitialiser les champs de mot de passe
        setFormData(prev => ({
          ...prev,
          password: '',
          password_confirmation: ''
        }));
        
        // Réinitialiser la prévisualisation
        setProfilePreview(null);

        // Réinitialiser feather icons après mise à jour
        setTimeout(() => {
          try {
            feather.replace();
          } catch (error) {
            console.warn("Erreur lors de la réinitialisation de feather:", error);
          }
        }, 100);

        navigate("/admin-systeme/view/profil");
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour", err);
      
      if (err.response?.status === 422) {
        // Erreurs de validation
        setErrors(err.response.data.errors || {});
        setFlashMessage({ 
          type: "danger", 
          message: err.response.data.message || "Erreurs de validation." 
        });
      } else {
        setFlashMessage({ 
          type: "danger", 
          message: "Erreur lors de la mise à jour du profil." 
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Obtenir l'URL de l'image de profil
  const getCurrentProfileImageUrl = () => {
    if (profilePreview) {
      return profilePreview;
    }
    if (user?.profil) {
      return `${publicApi.defaults.baseURL}/storage/profil/${user.profil}`;
    }
    return `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`;
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Chargement du profil...</p>
          </div>
        </Container>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête avec titre */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="edit" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Modifier mon Profil
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Mettez à jour vos informations personnelles et de contact.
              </p>
            </div>
          </div>
        </div>

        {/* Messages flash */}
        {flashMessage && (
          <Alert variant={flashMessage.type} className="mb-4">
            <div className="d-flex align-items-center">
              <i 
                data-feather={flashMessage.type === 'success' ? 'check-circle' : 'alert-circle'} 
                className="me-2" 
                style={{ width: "16px", height: "16px" }}
              ></i>
              {flashMessage.message}
            </div>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Section Image de profil */}
            <Col md={4} className="mb-4">
              <Card className={`shadow-sm border-0 h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <div className="d-flex align-items-center">
                    <i data-feather="image" className="text-primary me-2" style={{ width: "18px", height: "18px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Photo de profil
                    </span>
                  </div>
                </Card.Header>
                <Card.Body className={`text-center ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <div className="mb-4">
                    <Card.Img
                      src={getCurrentProfileImageUrl()}
                      alt="Photo de profil"
                      className="rounded-circle shadow"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        border: theme === "dark" ? "4px solid #495057" : "4px solid #e9ecef"
                      }}
                    />
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                    />
                    <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                      Formats acceptés: JPG, JPEG, PNG, WEBP (max. 2MB)
                    </Form.Text>
                  </Form.Group>
                  {errors.profil && (
                    <div className="text-danger small mt-1">
                      {errors.profil.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Section Formulaire */}
            <Col md={8}>
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <div className="d-flex align-items-center">
                    <i data-feather="user" className="text-primary me-2" style={{ width: "18px", height: "18px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Informations Personnelles
                    </span>
                  </div>
                </Card.Header>

                <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
                  <Row>
                    {/* Nom */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : "text-dark"}>
                          <i data-feather="user" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Nom complet
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                          placeholder="Votre nom complet"
                        />
                        {errors.name && (
                          <div className="text-danger small mt-1">
                            {errors.name.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Email */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : "text-dark"}>
                          <i data-feather="mail" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Adresse email
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                          placeholder="votre@email.com"
                        />
                        {errors.email && (
                          <div className="text-danger small mt-1">
                            {errors.email.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Date de naissance */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : "text-dark"}>
                          <i data-feather="calendar" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Date de naissance
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="birthday"
                          value={formData.birthday}
                          onChange={handleInputChange}
                          className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                        />
                        {errors.birthday && (
                          <div className="text-danger small mt-1">
                            {errors.birthday.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Genre */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : "text-dark"}>
                          <i data-feather="users" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Genre
                        </Form.Label>
                        <Form.Select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                        >
                          <option value="">Sélectionner</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                          <option value="Autre">Autre</option>
                        </Form.Select>
                        {errors.gender && (
                          <div className="text-danger small mt-1">
                            {errors.gender.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Code téléphone */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : "text-dark"}>
                          <i data-feather="globe" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Code pays
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="code_phone"
                          value={formData.code_phone}
                          onChange={handleInputChange}
                          className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                          placeholder="+237"
                        />
                        {errors.code_phone && (
                          <div className="text-danger small mt-1">
                            {errors.code_phone.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Téléphone */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : "text-dark"}>
                          <i data-feather="phone" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Numéro de téléphone
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                          placeholder="690123456"
                        />
                        {errors.phone && (
                          <div className="text-danger small mt-1">
                            {errors.phone.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Section mot de passe */}
                  <hr className={theme === "dark" ? "border-secondary" : ""} />
                  <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="lock" className="me-2 text-warning" style={{ width: "16px", height: "16px" }}></i>
                    Changer le mot de passe (optionnel)
                  </h6>

                  <Row>
                    {/* Nouveau mot de passe */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : "text-dark"}>
                          Nouveau mot de passe
                        </Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                          placeholder="Laissez vide pour ne pas modifier"
                        />
                        {errors.password && (
                          <div className="text-danger small mt-1">
                            {errors.password.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Confirmation mot de passe */}
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className={theme === "dark" ? "text-light" : "text-dark"}>
                          Confirmer le mot de passe
                        </Form.Label>
                        <Form.Control
                          type="password"
                          name="password_confirmation"
                          value={formData.password_confirmation}
                          onChange={handleInputChange}
                          className={theme === "dark" ? "bg-secondary text-light border-secondary" : ""}
                          placeholder="Confirmez votre nouveau mot de passe"
                        />
                        {errors.password_confirmation && (
                          <div className="text-danger small mt-1">
                            {errors.password_confirmation.map((error, index) => (
                              <div key={index}>{error}</div>
                            ))}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Boutons d'action */}
                  <hr className={theme === "dark" ? "border-secondary" : ""} />
                  <div className="d-flex justify-content-between align-items-center">
                    <Button 
                      variant="outline-secondary" 
                      as="a" 
                      href="/admin-systeme/view/profil"
                      className="d-flex align-items-center"
                    >
                      <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Retour au profil
                    </Button>
                    
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={saving}
                      className="d-flex align-items-center"
                    >
                      {/* {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Mise à jour...
                        </>
                      ) : ( */}
                        <>
                          <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Sauvegarder les modifications
                        </>
                      {/* )} */}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </AdminSystemeLayout>
  );
}