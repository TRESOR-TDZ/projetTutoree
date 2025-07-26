import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
  Alert,
  Image,
} from "react-bootstrap";
import feather from "feather-icons";
import api from "../../services/api";
import AdminStructureLayout from "../../layouts/AdminStructure/Layout";
import publicApi from "../../services/publicApi";

export default function ShowDoctor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const fetchDoctor = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin-structure/show/docteur/${id}`);
      if (res.data.status === "success") setDoctor(res.data.user);
      else setError(res.data.message || "Erreur lors du chargement");
    } catch (err) {
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    feather.replace();
    fetchDoctor();
  }, [fetchDoctor]);

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "Non renseigné";
  };

  const getProfileImageUrl = (profil) => {
    if (!profil) return `${publicApi.defaults.baseURL}/storage/profil/placeholder.png`;
    return `${publicApi.defaults.baseURL}/storage/profil/${profil}`;
  };

  if (loading) {
    return (
      <AdminStructureLayout>
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Chargement des informations...</p>
        </Container>
      </AdminStructureLayout>
    );
  }

  if (error) {
    return (
      <AdminStructureLayout>
        <Container className="py-5">
          <Alert variant="danger" className="text-center">
            <i data-feather="alert-circle" className="me-2" /> {error}
          </Alert>
          <div className="text-center">
            <Button variant="outline-secondary" onClick={() => navigate("/admin-structure/view/docteur")}>Retour</Button>
          </div>
        </Container>
      </AdminStructureLayout>
    );
  }

  return (
    <AdminStructureLayout>
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <Button variant="outline-secondary" className="me-3" onClick={() => navigate("/admin-structure/view/docteur")}>Retour</Button>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>Profil du Docteur</h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>Informations complètes</p>
            </div>
          </div>
        </div>

        <Row className="g-4">
          <Col lg={4}>
            <Card className={`shadow-sm border-0 h-100 ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="mb-4">
                  <Image
                    src={getProfileImageUrl(doctor.profil)}
                    roundedCircle
                    width={120}
                    height={120}
                    onError={(e) => { e.target.src = "/images/default-avatar.png"; }}
                    className="border mb-3"
                  />
                  <h4>{doctor.name}</h4>
                  <Badge bg={doctor.status === "Connecté" ? "success" : "secondary"} className="mt-2">
                    {doctor.status || "Indéfini"}
                  </Badge>
                </div>
                <div className="text-start">
                  <p><i data-feather="mail" className="me-2 text-primary" /> {doctor.email}</p>
                  <p><i data-feather="phone" className="me-2 text-success" /> {doctor.code_phone} {doctor.phone}</p>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <div className="d-flex flex-column gap-4">
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
                  <h5><i data-feather="user" className="me-2 text-primary" />Informations Personnelles</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-2">
                    <Col md={6}><strong>Genre :</strong></Col>
                    <Col>{doctor.gender || "Non renseigné"}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={6}><strong>Date de naissance :</strong></Col>
                    <Col>{formatDate(doctor.birthday)}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col md={6}><strong>Matricule :</strong></Col>
                    <Col>{doctor.matricule}</Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
                <Card.Header><h5><i data-feather="briefcase" className="me-2 text-info" />Structure Associée</h5></Card.Header>
                <Card.Body>
                  {doctor.structure ? (
                    <>
                      <Row className="mb-2">
                        <Col md={6}><strong>Nom :</strong></Col>
                        <Col>{doctor.structure.nom}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col md={6}><strong>Adresse :</strong></Col>
                        <Col>{doctor.structure.adresse}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col md={6}><strong>Email :</strong></Col>
                        <Col>{doctor.structure.email}</Col>
                      </Row>
                      <Row>
                        <Col md={6}><strong>Matricule :</strong></Col>
                        <Col>{doctor.structure.matricule}</Col>
                      </Row>
                    </>
                  ) : (
                    <p className="text-muted">Aucune structure associée.</p>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </AdminStructureLayout>
  );
}
