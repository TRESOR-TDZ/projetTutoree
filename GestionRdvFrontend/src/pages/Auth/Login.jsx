import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import feather from "feather-icons";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light"); // Initialize theme state

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    try {
      const res = await api.post("/login", form);
      const { token, user } = res.data.data;
      login(user, token);

      const role = user.role;
      if (role === 0) navigate("/patient/dashboard");
      else if (role === 1) navigate("/docteur/dashboard");
      else if (role === 2) navigate("/admin-structure/dashboard");
      else if (role === 3) navigate("/admin-systeme/dashboard");
      else navigate("/");
    } catch (err) {
      const response = err.response;
      if (response?.status === 422 && response.data?.errors) {
        setFieldErrors(response.data.errors);
      } else {
        setError(response?.data?.message || "Erreur de connexion");
      }
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    const newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme); // Update theme state
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      setTheme(savedTheme); // Set theme state on initial load
    }
  }, []);

  useEffect(() => {
    feather.replace();
  }, [theme]); // Re-render feather icons when theme changes

  return (
    <Container className="py-5">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col md={6} lg={5}>
          <Card className={`p-4 shadow-sm ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}>
            <div className="d-flex justify-content-center align-items-center mb-3">
              <h4 className={`mb-0 ${theme === "dark" ? "text-light" : ""}`}>Connexion</h4>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={toggleTheme}
                title="Changer le thème"
                className="ms-2"
              >
                <i data-feather={theme === "dark" ? "sun" : "moon"} /> {/* Change icon based on theme */}
              </Button>
            </div>

            <p className={`small text-center mb-4 ${theme === "dark" ? "text-light" : ""}`}>
              Accédez à votre espace personnel
            </p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className={theme === "dark" ? "text-light" : ""}>Email</Form.Label>
                <Form.Control
                  name="email"
                  placeholder="Adresse email"
                  value={form.email}
                  onChange={handleChange}
                  isInvalid={!!fieldErrors.email}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} // Apply dark mode styles to input
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className={theme === "dark" ? "text-light" : ""}>Mot de passe</Form.Label>
                <Form.Control
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  isInvalid={!!fieldErrors.password}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} // Apply dark mode styles to input
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.password}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3 form-check">
                <Form.Check
                  type="checkbox"
                  label="Se souvenir de moi"
                  id="remember"
                  className={theme === "dark" ? "text-light" : ""} // Apply dark mode styles to checkbox label
                />
              </Form.Group>

              <div className="d-grid">
                <Button type="submit" variant="primary">
                  <i data-feather="log-in" className="me-1" />
                  Connexion
                </Button>
              </div>

              <div className="text-center mt-3">
                <Link
                  to="/forgot-password"
                  className={`text-decoration-none small ${theme === "dark" ? "text-light" : ""}`}
                >
                  <i data-feather="help-circle" className="me-1" />
                  Mot de passe oublié ?
                </Link>
              </div>

              <div className="text-center mt-4">
                <small className={theme === "dark" ? "text-light" : ""}>
                  Vous n’avez pas encore de compte ?{" "}
                  <Link
                    to="/register"
                    className={`fw-semibold text-decoration-none ${theme === "dark" ? "text-light" : ""}`}
                  >
                    Créez-en un
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

export default Login;