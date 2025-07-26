import React, { useEffect, useState } from "react";
import {
  Container,
  Button,
  Row,
  Col,
  Badge,
  Card,
} from "react-bootstrap";
import feather from "feather-icons";
import AdminStructureLayout from "../../layouts/AdminStructure/Layout";

export default function AdminStructureDashboard() {

  const [stats, setStats] = useState({
    totalPatients: 1247,
    rdvAujourdhui: 28,
    consultationsEnLigne: 15,
    consultationsPresentielles: 13,
    personnelActif: 45,
    dossiersActifs: 1189,
    consultationsChat: 8
  });

  // Remplacer les icônes feather au chargement
  useEffect(() => {
    feather.replace();
  }, []);

  const features = [
    {
      title: "Gestion Personnel",
      icon: "users",
      color: "primary",
      items: ["Médecins", "Infirmiers", "Planning", "Disponibilités"],
      route: "/admin-structure/personnel",
      badge: "45 actifs",
      description: "Gérer l'équipe médicale et les plannings"
    },
    {
      title: "Rendez-vous",
      icon: "calendar",
      color: "success",
      items: ["Prendre RDV", "Planning", "Confirmations", "Annulations"],
      route: "/admin-structure/rendez-vous",
      badge: "28 aujourd'hui",
      description: "Gestion complète des rendez-vous patients"
    },
    {
      title: "Consultations",
      icon: "video",
      color: "info",
      items: ["Chat en ligne", "Présentiel", "Historique", "Suivi"],
      route: "/admin-structure/consultations",
      badge: "15 en ligne",
      description: "Consultations en ligne et présentiel"
    },
    {
      title: "Dossiers Médicaux",
      icon: "file-text",
      color: "warning",
      items: ["Dossiers Patients", "Antécédents", "Prescriptions", "Archives"],
      route: "/admin-structure/dossiers",
      badge: "1189 dossiers",
      description: "Gestion des dossiers médicaux complets"
    }
  ];

  const quickStats = [
    {
      title: "Patients Totaux",
      value: stats.totalPatients.toLocaleString(),
      icon: "users",
      color: "primary",
      change: "+12%",
      positive: true
    },
    {
      title: "RDV Aujourd'hui",
      value: stats.rdvAujourdhui,
      icon: "calendar",
      color: "success",
      change: "+5",
      positive: true
    },
    {
      title: "Consultations Chat",
      value: stats.consultationsChat,
      icon: "message-circle",
      color: "info",
      change: "En cours",
      positive: true
    },
    {
      title: "Personnel Actif",
      value: stats.personnelActif,
      icon: "user-check",
      color: "primary",
      change: "+2",
      positive: true
    },
    {
      title: "Consultations Présentiel",
      value: stats.consultationsPresentielles,
      icon: "user",
      color: "success",
      change: "Aujourd'hui",
      positive: true
    },
    {
      title: "Dossiers Actifs",
      value: stats.dossiersActifs,
      icon: "file-text",
      color: "warning",
      change: "+3%",
      positive: true
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "rdv",
      message: "Nouveau RDV - Dr. Martin avec Marie Dubois",
      time: "Il y a 5 min",
      icon: "calendar-plus",
      color: "success"
    },
    {
      id: 2,
      type: "consultation",
      message: "Consultation chat terminée - Dr. Sophie",
      time: "Il y a 10 min",
      icon: "message-circle",
      color: "info"
    },
    {
      id: 3,
      type: "personnel",
      message: "Dr. Leroy connecté - Disponible consultations",
      time: "Il y a 15 min",
      icon: "user-check",
      color: "primary"
    },
    {
      id: 4,
      type: "dossier",
      message: "Dossier médical mis à jour - Patient #1247",
      time: "Il y a 30 min",
      icon: "file-plus",
      color: "warning"
    },
    {
      id: 5,
      type: "consultation",
      message: "Consultation présentiel programmée - 14h30",
      time: "Il y a 45 min",
      icon: "user",
      color: "success"
    }
  ];

  const consultationStats = [
    {
      type: "Chat en ligne",
      count: stats.consultationsEnLigne,
      icon: "message-circle",
      color: "info"
    },
    {
      type: "Présentiel",
      count: stats.consultationsPresentielles,
      icon: "user",
      color: "success"
    }
  ];

  return (
  <AdminStructureLayout>
    <Container fluid className="p-0">
      
      {/* En-tête du Dashboard */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">
                <i data-feather="home" className="me-2"></i>
                Dashboard Admin Structure
              </h1>
              <p className="text-muted mb-0">
                Vue d'ensemble et gestion de votre structure médicale
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm">
                <i data-feather="refresh-cw" className="me-1"></i>
                Actualiser
              </Button>
              <Button variant="primary" size="sm">
                <i data-feather="plus" className="me-1"></i>
                Nouvelle Consultation
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Statistiques Rapides */}
      <Row className="mb-4">
        {quickStats.map((stat, index) => (
          <Col key={index} xl={2} lg={4} md={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1 small">{stat.title}</p>
                    <h4 className="mb-1">{stat.value}</h4>
                    <div className="d-flex align-items-center">
                      <Badge 
                        bg={stat.positive ? 'success' : 'secondary'}
                        className="me-1 small"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`bg-${stat.color} bg-opacity-10 rounded-3 p-3`}>
                    <i 
                      data-feather={stat.icon} 
                      className={`text-${stat.color}`}
                      style={{ width: '24px', height: '24px' }}
                    ></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Types de Consultations */}
      <Row className="mb-4">
        <Col>
          <h5 className="mb-3">
            <i data-feather="activity" className="me-2"></i>
            Consultations du Jour
          </h5>
        </Col>
      </Row>

      <Row className="mb-4">
        {consultationStats.map((consultation, index) => (
          <Col key={index} md={6} className="mb-3">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className={`bg-${consultation.color} bg-opacity-10 rounded-3 p-3 me-3`}>
                    <i 
                      data-feather={consultation.icon} 
                      className={`text-${consultation.color}`}
                      style={{ width: '24px', height: '24px' }}
                    ></i>
                  </div>
                  <div>
                    <h6 className="mb-1">{consultation.type}</h6>
                    <h4 className="mb-0 text-primary">{consultation.count} consultations</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Section Principales Fonctionnalités */}
      <Row className="mb-4">
        <Col>
          <h4 className="mb-3">
            <i data-feather="grid" className="me-2"></i>
            Modules Principaux
          </h4>
        </Col>
      </Row>

      <Row className="mb-4">
        {features.map((feature, index) => (
          <Col key={index} lg={6} xl={3} className="mb-4">
            <Card className="h-100 border-0 shadow-sm hover-shadow">
              <Card.Header className={`bg-${feature.color} bg-opacity-10 border-0 d-flex align-items-center justify-content-between`}>
                <div className="d-flex align-items-center">
                  <div className={`bg-${feature.color} rounded-3 p-2 me-3`}>
                    <i 
                      data-feather={feature.icon} 
                      className="text-white"
                      style={{ width: '20px', height: '20px' }}
                    ></i>
                  </div>
                  <div>
                    <h6 className="mb-0">{feature.title}</h6>
                    <small className="text-muted">{feature.description}</small>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {feature.items.map((item, itemIndex) => (
                      <Badge 
                        key={itemIndex}
                        bg="light" 
                        text="dark" 
                        className="px-2 py-1 small"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg={feature.color}>
                      {feature.badge}
                    </Badge>
                    <Button 
                      variant={feature.color}
                      size="sm"
                      onClick={() => window.location.href = feature.route}
                    >
                      <i data-feather="arrow-right" className="me-1"></i>
                      Accéder
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Section Activités Récentes et Actions Rapides */}
      <Row>
        {/* Activités Récentes */}
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0 d-flex align-items-center justify-content-between">
              <h5 className="mb-0">
                <i data-feather="activity" className="me-2"></i>
                Activités Récentes
              </h5>
              <Button variant="outline-primary" size="sm">
                <i data-feather="eye" className="me-1"></i>
                Voir tout
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="list-group-item border-0 py-3 px-4"
                  >
                    <div className="d-flex align-items-center">
                      <div className={`bg-${activity.color} bg-opacity-10 rounded-circle p-2 me-3`}>
                        <i 
                          data-feather={activity.icon} 
                          className={`text-${activity.color}`}
                          style={{ width: '16px', height: '16px' }}
                        ></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0">{activity.message}</p>
                        <small className="text-muted">{activity.time}</small>
                      </div>
                      <Badge bg={activity.color} className="ms-2">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Actions Rapides */}
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0">
              <h5 className="mb-0">
                <i data-feather="zap" className="me-2"></i>
                Actions Rapides
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-success" className="text-start">
                  <i data-feather="calendar-plus" className="me-2"></i>
                  Prendre Rendez-vous
                </Button>
                <Button variant="outline-info" className="text-start">
                  <i data-feather="message-circle" className="me-2"></i>
                  Consultation Chat
                </Button>
                <Button variant="outline-primary" className="text-start">
                  <i data-feather="user" className="me-2"></i>
                  Consultation Présentiel
                </Button>
                <Button variant="outline-warning" className="text-start">
                  <i data-feather="file-plus" className="me-2"></i>
                  Nouveau Dossier
                </Button>
                <Button variant="outline-secondary" className="text-start">
                  <i data-feather="user-plus" className="me-2"></i>
                  Ajouter Personnel
                </Button>
              </div>
              
              <hr className="my-3" />
              
              <div>
                <h6 className="mb-2 text-center">Consultations Actives</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Chat en ligne</span>
                  <Badge bg="info">{stats.consultationsChat}</Badge>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">En attente</span>
                  <Badge bg="warning">3</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CSS personnalisé pour les effets hover */}
      <style jsx>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </Container>
  </AdminStructureLayout>
  );
}