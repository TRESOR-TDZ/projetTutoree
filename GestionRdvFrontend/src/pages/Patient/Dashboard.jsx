import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Badge, Alert, ProgressBar, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PatientLayout from "../../layouts/Patient/LayoutPatient";
import feather from "feather-icons";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, []);

  // Données simulées pour le dashboard
  const dashboardData = {
    upcomingAppointments: [
      {
        id: 1,
        doctor: "Dr. Martin Durand",
        specialty: "Cardiologue",
        date: "2025-07-22",
        time: "14:30",
        type: "Présentiel",
        location: "Cabinet Médical Central"
      },
      {
        id: 2,
        doctor: "Dr. Sophie Lambert",
        specialty: "Dermatologue",
        date: "2025-07-25",
        time: "09:15",
        type: "En ligne",
        location: "Consultation vidéo"
      }
    ],
    recentResults: [
      {
        id: 1,
        exam: "Analyse de sang",
        date: "2025-07-15",
        status: "Résultats disponibles",
        urgent: false
      },
      {
        id: 2,
        exam: "IRM Genou",
        date: "2025-07-10",
        status: "À revoir avec votre médecin",
        urgent: true
      }
    ],
    healthMetrics: {
      nextVaccin: "Rappel Tétanos - Dans 6 mois",
      lastCheckup: "2025-06-01",
      healthScore: 85
    },
    notifications: [
      {
        id: 1,
        message: "Rappel : RDV demain avec Dr. Durand",
        type: "appointment",
        time: "Il y a 2h"
      },
      {
        id: 2,
        message: "Nouveaux résultats d'analyses disponibles",
        type: "results",
        time: "Il y a 5h"
      },
      {
        id: 3,
        message: "Message du Dr. Lambert",
        type: "message",
        time: "Hier"
      }
    ]
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  return (
    <PatientLayout>
      {/* En-tête de bienvenue */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            Bonjour {user?.name || "Patient"} ! 👋
          </h1>
          <p className="text-muted mb-0">
            {currentTime.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} - {currentTime.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          as={Link} 
          to="/patient/prendre-rdv"
          className="d-flex align-items-center"
        >
          <i data-feather="plus-circle" className="me-2" style={{ width: '20px', height: '20px' }} />
          Prendre RDV
        </Button>
      </div>

      {/* Alertes importantes */}
      <Alert variant="info" className="d-flex align-items-center mb-4">
        <i data-feather="bell" className="me-2" style={{ width: '20px', height: '20px' }} />
        <strong>Rappel :</strong> Vous avez un rendez-vous demain à 14h30 avec Dr. Durand
      </Alert>

      {/* Cartes de statistiques rapides */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-2">
                <i data-feather="calendar" style={{ width: '32px', height: '32px' }} />
              </div>
              <h5 className="card-title">Prochains RDV</h5>
              <h2 className="text-primary mb-0">2</h2>
              <small className="text-muted">Cette semaine</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">
                <i data-feather="activity" style={{ width: '32px', height: '32px' }} />
              </div>
              <h5 className="card-title">État de santé</h5>
              <h2 className="text-success mb-0">{dashboardData.healthMetrics.healthScore}%</h2>
              <small className="text-muted">Score global</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">
                <i data-feather="file-text" style={{ width: '32px', height: '32px' }} />
              </div>
              <h5 className="card-title">Résultats</h5>
              <h2 className="text-warning mb-0">2</h2>
              <small className="text-muted">À consulter</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">
                <i data-feather="message-circle" style={{ width: '32px', height: '32px' }} />
              </div>
              <h5 className="card-title">Messages</h5>
              <h2 className="text-info mb-0">3</h2>
              <small className="text-muted">Non lus</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Prochains rendez-vous */}
        <Col lg={8} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="calendar" className="me-2" style={{ width: '20px', height: '20px' }} />
                Prochains rendez-vous
              </h5>
              <Button variant="outline-primary" size="sm" as={Link} to="/patient/rendez-vous">
                Voir tout
              </Button>
            </Card.Header>
            <Card.Body>
              {dashboardData.upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id} className="border-start border-primary border-3 mb-3">
                      <Card.Body className="py-3">
                        <Row className="align-items-center">
                          <Col md={8}>
                            <h6 className="mb-1 fw-bold">{appointment.doctor}</h6>
                            <p className="text-muted mb-1">{appointment.specialty}</p>
                            <div className="d-flex align-items-center text-sm">
                              <i data-feather="calendar" className="me-1" style={{ width: '16px', height: '16px' }} />
                              <span className="me-3">{formatDate(appointment.date)}</span>
                              <i data-feather="clock" className="me-1" style={{ width: '16px', height: '16px' }} />
                              <span>{appointment.time}</span>
                            </div>
                          </Col>
                          <Col md={4} className="text-end">
                            <Badge 
                              bg={appointment.type === 'En ligne' ? 'success' : 'primary'} 
                              className="mb-2"
                            >
                              {appointment.type}
                            </Badge>
                            <p className="text-muted small mb-0">{appointment.location}</p>
                            {appointment.type === 'En ligne' && (
                              <Button variant="outline-success" size="sm" className="mt-2">
                                <i data-feather="video" className="me-1" style={{ width: '14px', height: '14px' }} />
                                Rejoindre
                              </Button>
                            )}
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i data-feather="calendar" className="text-muted mb-2" style={{ width: '48px', height: '48px' }} />
                  <p className="text-muted">Aucun rendez-vous programmé</p>
                  <Button variant="primary" as={Link} to="/patient/prendre-rdv">
                    Prendre un rendez-vous
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Colonne latérale */}
        <Col lg={4}>
          {/* État de santé */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="heart" className="me-2 text-danger" style={{ width: '20px', height: '20px' }} />
                État de santé
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Score global</span>
                  <span className="fw-bold">{dashboardData.healthMetrics.healthScore}%</span>
                </div>
                <ProgressBar 
                  now={dashboardData.healthMetrics.healthScore} 
                  variant={getHealthScoreColor(dashboardData.healthMetrics.healthScore)}
                />
              </div>
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Dernier bilan :</span>
                  <span>{new Date(dashboardData.healthMetrics.lastCheckup).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Prochain vaccin :</span>
                  <span>Dans 6 mois</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Résultats récents */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="file-text" className="me-2" style={{ width: '20px', height: '20px' }} />
                Résultats récents
              </h5>
              <Button variant="outline-primary" size="sm" as={Link} to="/patient/examens">
                Voir tout
              </Button>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {dashboardData.recentResults.map((result) => (
                  <ListGroup.Item key={result.id} className="px-0 d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">{result.exam}</h6>
                      <p className="text-muted small mb-1">{new Date(result.date).toLocaleDateString('fr-FR')}</p>
                      <Badge variant={result.urgent ? "danger" : "success"} className="small">
                        {result.status}
                      </Badge>
                    </div>
                    <Button variant="outline-primary" size="sm">
                      <i data-feather="eye" style={{ width: '14px', height: '14px' }} />
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Notifications récentes */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="bell" className="me-2" style={{ width: '20px', height: '20px' }} />
                Notifications
              </h5>
              <Button variant="outline-primary" size="sm" as={Link} to="/patient/notifications">
                Voir tout
              </Button>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {dashboardData.notifications.map((notification) => (
                  <ListGroup.Item key={notification.id} className="px-0 border-0">
                    <div className="d-flex align-items-start">
                      <div className={`me-2 mt-1 ${
                        notification.type === 'appointment' ? 'text-primary' :
                        notification.type === 'results' ? 'text-warning' : 'text-info'
                      }`}>
                        <i data-feather={
                          notification.type === 'appointment' ? 'calendar' :
                          notification.type === 'results' ? 'file-text' : 'message-circle'
                        } style={{ width: '16px', height: '16px' }} />
                      </div>
                      <div className="flex-1">
                        <p className="small mb-1">{notification.message}</p>
                        <span className="text-muted extra-small">{notification.time}</span>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Actions rapides */}
      <Row className="mt-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">Actions rapides</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-primary" 
                    className="w-100 py-3 d-flex flex-column align-items-center"
                    as={Link}
                    to="/patient/prendre-rdv"
                  >
                    <i data-feather="plus-circle" className="mb-2" style={{ width: '24px', height: '24px' }} />
                    Prendre RDV
                  </Button>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-success" 
                    className="w-100 py-3 d-flex flex-column align-items-center"
                    as={Link}
                    to="/patient/consultation-enligne"
                  >
                    <i data-feather="video" className="mb-2" style={{ width: '24px', height: '24px' }} />
                    Consultation en ligne
                  </Button>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-info" 
                    className="w-100 py-3 d-flex flex-column align-items-center"
                    as={Link}
                    to="/patient/messages"
                  >
                    <i data-feather="message-circle" className="mb-2" style={{ width: '24px', height: '24px' }} />
                    Messages
                  </Button>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-warning" 
                    className="w-100 py-3 d-flex flex-column align-items-center"
                    as={Link}
                    to="/patient/dossier-medical"
                  >
                    <i data-feather="file-medical" className="mb-2" style={{ width: '24px', height: '24px' }} />
                    Mon Dossier
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </PatientLayout>
  );
}