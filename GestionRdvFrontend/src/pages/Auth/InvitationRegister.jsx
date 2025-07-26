import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Container, Row, Col, Form, Button, Card, Alert,
} from "react-bootstrap";

const InvitationRegister = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");
  const email = new URLSearchParams(location.search).get("email");

  const [form, setForm] = useState({
    name: "",
    code_phone: "+237",
    phone: "",
    birthday: "",
    gender: "",
    password: "",
    password_confirmation: "",
    email: email ,
    token: token ,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    try {
      await api.post(`/register-invitation`, form);
      setMessage("Inscription réussie !");
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

  return (
    <Container className="py-5">
      <Row className="justify-content-center align-items-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="mb-0">Inscription via invitation</h3>
              <Button size="sm" variant="outline-secondary" onClick={toggleTheme}>
                <i data-feather="moon" />
              </Button>
            </div>

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
                  value={form.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>

              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Code pays</Form.Label>
                    <Form.Control
                      name="code_phone"
                      value={form.code_phone}
                      onChange={handleChange}
                      isInvalid={!!errors.code_phone}
                    />
                    <Form.Control.Feedback type="invalid">{errors.code_phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      name="phone"
                      type="number"
                      value={form.phone}
                      onChange={handleChange}
                      isInvalid={!!errors.phone}
                    />
                    <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Date de naissance</Form.Label>
                    <Form.Control
                      name="birthday"
                      type="date"
                      value={form.birthday}
                      onChange={handleChange}
                      isInvalid={!!errors.birthday}
                    />
                    <Form.Control.Feedback type="invalid">{errors.birthday}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Genre</Form.Label>
                    <Form.Select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      isInvalid={!!errors.gender}
                    >
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Autre">Autre</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.gender}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
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
                      value={form.password_confirmation}
                      onChange={handleChange}
                      isInvalid={!!errors.password_confirmation}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Button type="submit" variant="primary" className="w-100 mt-3">
                S'inscrire
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default InvitationRegister;
