import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import {
  Container, Row, Col, Form, Button, Card, Alert,
} from "react-bootstrap";
import feather from "feather-icons";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    try {
      const res = await api.post("/register", form);
      setMessage(res.data.message || "Inscription réussie !");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setMessage(err.response?.data?.message || "Une erreur s'est produite");
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    const newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  useEffect(() => {
      feather.replace();
  }, []);

  return (
    <Container className="py-5">
      <Row className="justify-content-center align-items-center">
        <Col md={8} lg={6}>
          <Card className="p-4 shadow-sm">
            <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
              <h3 className="mb-0">Créer un compte</h3>
              <Button size="sm" variant="outline-secondary" onClick={toggleTheme} title="Changer de thème">
                <i data-feather="sun" />
              </Button>
            </div>

            <p className="text-center mb-4">
              Inscrivez-vous pour accéder à votre espace médical personnel
            </p>

            {message && (
              <Alert variant={Object.keys(errors).length ? "danger" : "success"}>
                {message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nom complet</Form.Label>
                <Form.Control
                  name="name"
                  placeholder="Nom et prénom"
                  value={form.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  name="email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={form.email}
                  onChange={handleChange}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Confirmation</Form.Label>
                    <Form.Control
                      type="password"
                      name="password_confirmation"
                      placeholder="••••••••"
                      value={form.password_confirmation}
                      onChange={handleChange}
                      isInvalid={!!errors.password_confirmation}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-grid mt-3 mb-2">
                <Button type="submit" variant="primary">S'inscrire</Button>
              </div>

              <div className="text-center mt-2">
                <small>
                  Déjà un compte ?{" "}
                  <Link to="/login" className="fw-semibold text-decoration-none">
                    Connectez-vous ici
                  </Link>
                </small>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
