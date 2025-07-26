import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Modal, Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PatientLayout from "../../layouts/Patient/LayoutPatient";
import feather from "feather-icons";

export default function Notifications() {
  // États principaux
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filtres et recherche
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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

  // Fonction pour récupérer les notifications depuis l'API
  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: page
      };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/patient/notifications', { params });
      
      if (response.data.success) {
        setNotifications(response.data.data.data || []);
        setTotalPages(response.data.data.last_page || 1);
        setCurrentPage(response.data.data.current_page || 1);
      } else {
        setError(response.data.message || "Erreur lors du chargement des notifications");
      }
      
    } catch (err) {
      setError("Erreur lors du chargement des notifications");
      console.error("Erreur API:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  // Effect pour charger les données initiales
  useEffect(() => {
    fetchNotifications(1);
  }, [typeFilter, statusFilter, fetchNotifications]);

  // Effect pour gérer le changement de page
  useEffect(() => {
    if (currentPage) {
      fetchNotifications(currentPage);
    }
  }, [currentPage, fetchNotifications]);

  useEffect(() => {
    feather.replace();
  }, [notifications, loading, showDetailModal]);

  // Fonction pour changer de page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setTypeFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  // Fonction pour obtenir l'icône selon le type de notification
  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'rendez-vous':
      case 'appointment':
        return 'calendar';
      case 'rappel':
      case 'reminder':
        return 'bell';
      case 'information':
      case 'info':
        return 'info';
      case 'urgence':
      case 'urgent':
        return 'alert-triangle';
      case 'message':
        return 'message-circle';
      case 'paiement':
      case 'payment':
        return 'credit-card';
      case 'système':
      case 'system':
        return 'settings';
      default:
        return 'bell';
    }
  };

  // Fonction pour obtenir la couleur selon le type de notification
  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'rendez-vous':
      case 'appointment':
        return 'primary';
      case 'rappel':
      case 'reminder':
        return 'warning';
      case 'information':
      case 'info':
        return 'info';
      case 'urgence':
      case 'urgent':
        return 'danger';
      case 'message':
        return 'success';
      case 'paiement':
      case 'payment':
        return 'dark';
      case 'système':
      case 'system':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heure${Math.floor(diffInHours) > 1 ? 's' : ''}`;
    } else if (diffInHours < 168) {
      return `Il y a ${Math.floor(diffInHours / 24)} jour${Math.floor(diffInHours / 24) > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Fonction pour afficher les détails d'une notification
  const showNotificationDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    // Marquer comme lue si pas déjà lu
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  // Fonction pour marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/patient/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    }
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await api.put('/patient/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Erreur lors du marquage global:", error);
    }
  };

  // Fonction pour supprimer des notifications
  const deleteNotifications = async () => {
    try {
      if (selectedNotifications.length > 0) {
        await api.delete('/patient/notifications/bulk', {
          data: { ids: selectedNotifications }
        });
        setNotifications(prev => 
          prev.filter(n => !selectedNotifications.includes(n.id))
        );
        setSelectedNotifications([]);
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // Fonction pour gérer la sélection des notifications
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Fonction pour sélectionner/désélectionner toutes les notifications
  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  // Statistiques des notifications
  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    urgent: notifications.filter(n => n.type?.toLowerCase() === 'urgence').length,
    today: notifications.filter(n => {
      const today = new Date().toDateString();
      return new Date(n.created_at).toDateString() === today;
    }).length
  };

  return (
    <PatientLayout>
      <Container className={`py-4 ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
        {/* En-tête avec titre et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="bell" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Mes Notifications
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Restez informé de toutes vos activités médicales
              </p>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {notificationStats.total}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="bell" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-warning">
                        {notificationStats.unread}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Non lues
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="mail" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-danger">
                        {notificationStats.urgent}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Urgentes
                      </small>
                    </div>
                    <div className="text-danger">
                      <i data-feather="alert-triangle" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-success">
                        {notificationStats.today}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Aujourd'hui
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="calendar" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Panneau principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="inbox" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Liste des Notifications
                </span>
                <span className={`ms-3 small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Page {currentPage} sur {totalPages}
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                <Button
                  variant={theme === "dark" ? "outline-light" : "outline-success"}
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={notificationStats.unread === 0}
                >
                  <i data-feather="check" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                  Tout marquer comme lu
                </Button>
                
                {selectedNotifications.length > 0 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <i data-feather="trash-2" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                    Supprimer ({selectedNotifications.length})
                  </Button>
                )}
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="filter" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Type de notification
                  </Form.Label>
                  <Form.Select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les types</option>
                    <option value="rendez-vous">Rendez-vous</option>
                    <option value="rappel">Rappel</option>
                    <option value="information">Information</option>
                    <option value="urgence">Urgence</option>
                    <option value="message">Message</option>
                    <option value="paiement">Paiement</option>
                    <option value="système">Système</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="eye" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes</option>
                    <option value="read">Lues</option>
                    <option value="unread">Non lues</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small opacity-0">Action</Form.Label>
                  <div className="d-flex gap-2">
                    <Button 
                      variant={theme === "dark" ? "outline-light" : "outline-primary"} 
                      className="flex-fill" 
                      onClick={() => fetchNotifications(1)}
                    >
                      <i data-feather="search" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Filtrer
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={resetFilters}
                    >
                      <i data-feather="x" style={{ width: "16px", height: "16px" }}></i>
                    </Button>
                  </div>
                </Col>
                <Col md={2}>
                  <Form.Label className="small opacity-0">Sélection</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      id="select-all"
                      label="Tout sélectionner"
                      checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                      onChange={toggleSelectAll}
                      className={theme === "dark" ? "text-light" : ""}
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* Affichage du contenu */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className={`mt-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Chargement des notifications...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-5">
                <i data-feather="alert-triangle" className="text-danger mb-3" style={{ width: "48px", height: "48px" }}></i>
                <h5 className="text-danger">{error}</h5>
                <Button variant="primary" onClick={() => fetchNotifications(currentPage)} className="mt-3">
                  <i data-feather="refresh-cw" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Réessayer
                </Button>
              </div>
            ) : (
              <>
                {notifications.length > 0 ? (
                  <div className="notification-list">
                    {notifications.map((notification, index) => (
                      <Card 
                        key={notification.id}
                        className={`mb-3 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"} ${!notification.is_read ? 'border-start border-primary border-3' : ''}`}
                        style={{ 
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          opacity: notification.is_read ? 0.8 : 1
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                        }}
                      >
                        <Card.Body className="p-3">
                          <Row className="align-items-center">
                            <Col xs="auto">
                              <Form.Check
                                type="checkbox"
                                checked={selectedNotifications.includes(notification.id)}
                                onChange={() => toggleNotificationSelection(notification.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Col>
                            
                            <Col xs="auto">
                              <div className={`p-2 rounded-circle bg-${getNotificationColor(notification.type)} bg-opacity-10`}>
                                <i 
                                  data-feather={getNotificationIcon(notification.type)} 
                                  className={`text-${getNotificationColor(notification.type)}`} 
                                  style={{ width: "20px", height: "20px" }}
                                ></i>
                              </div>
                            </Col>
                            
                            <Col className="cursor-pointer" onClick={() => showNotificationDetails(notification)}>
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center mb-1">
                                    <h6 className={`mb-0 me-2 ${theme === "dark" ? "text-light" : "text-dark"} ${!notification.is_read ? 'fw-bold' : ''}`}>
                                      {notification.title || 'Notification'}
                                    </h6>
                                    {!notification.is_read && (
                                      <Badge bg="primary" className="px-2 py-1">
                                        <i data-feather="circle" style={{ width: "8px", height: "8px", fill: "currentColor" }}></i>
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className={`mb-2 small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                    {notification.message ? 
                                      (notification.message.length > 120 
                                        ? notification.message.substring(0, 120) + "..."
                                        : notification.message
                                      ) : 'Aucun message'
                                    }
                                  </p>
                                  
                                  <div className="d-flex align-items-center gap-3">
                                    <Badge bg={getNotificationColor(notification.type)} className="px-2">
                                      {notification.type || 'Info'}
                                    </Badge>
                                    <small className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                                      <i data-feather="clock" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                      {formatDate(notification.created_at)}
                                    </small>
                                  </div>
                                </div>
                                
                                <div className="d-flex align-items-center gap-2">
                                  {notification.priority === 'high' && (
                                    <Badge bg="danger" className="px-2">
                                      <i data-feather="alert-triangle" style={{ width: "12px", height: "12px" }}></i>
                                    </Badge>
                                  )}
                                  
                                  <Dropdown>
                                    <Dropdown.Toggle 
                                      variant="link" 
                                      className={`p-1 border-0 ${theme === "dark" ? "text-light" : "text-muted"}`}
                                      style={{ textDecoration: 'none' }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <i data-feather="more-horizontal" style={{ width: "16px", height: "16px" }}></i>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className={theme === "dark" ? "dropdown-menu-dark" : ""}>
                                      <Dropdown.Item onClick={() => showNotificationDetails(notification)}>
                                        <i data-feather="eye" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                                        Voir détails
                                      </Dropdown.Item>
                                      {!notification.is_read && (
                                        <Dropdown.Item onClick={() => markAsRead(notification.id)}>
                                          <i data-feather="check" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                                          Marquer comme lu
                                        </Dropdown.Item>
                                      )}
                                      <Dropdown.Divider />
                                      <Dropdown.Item 
                                        className="text-danger"
                                        onClick={() => {
                                          setSelectedNotifications([notification.id]);
                                          setShowDeleteModal(true);
                                        }}
                                      >
                                        <i data-feather="trash-2" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                                        Supprimer
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i data-feather="bell-off" className="text-muted mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                    <h6 className={theme === "dark" ? "text-light" : "text-muted"}>Aucune notification trouvée</h6>
                    <p className={`small mb-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Aucune notification ne correspond à vos critères de recherche.
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={resetFilters}
                    >
                      <i data-feather="refresh-cw" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Réinitialiser
                    </Button>
                  </div>
                )}

                {/* Pagination améliorée */}
                {totalPages > 1 && (
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4">
                    <div className={`mb-2 mb-md-0 small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Affichage de la page {currentPage} sur {totalPages}
                    </div>
                    
                    <nav aria-label="Pagination des notifications">
                      <div className="d-flex align-items-center gap-2">
                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          title="Première page"
                        >
                          <i data-feather="chevrons-left" style={{ width: "14px", height: "14px" }}></i>
                        </Button>

                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          title="Page précédente"
                        >
                          <i data-feather="chevron-left" style={{ width: "14px", height: "14px" }}></i>
                        </Button>

                        <div className="d-flex gap-1">
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                            if (endPage - startPage + 1 < maxVisiblePages) {
                              startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }

                            if (startPage > 1) {
                              pages.push(
                                <Button
                                  key={1}
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handlePageChange(1)}
                                >
                                  1
                                </Button>
                              );
                              if (startPage > 2) {
                                pages.push(
                                  <span key="ellipsis1" className={`px-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                    ...
                                  </span>
                                );
                              }
                            }

                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <Button
                                  key={i}
                                  variant={currentPage === i ? "primary" : "outline-primary"}
                                  size="sm"
                                  onClick={() => handlePageChange(i)}
                                  className={currentPage === i ? "fw-bold" : ""}
                                >
                                  {i}
                                </Button>
                              );
                            }

                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(
                                  <span key="ellipsis2" className={`px-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                    ...
                                  </span>
                                );
                              }
                              pages.push(
                                <Button
                                  key={totalPages}
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handlePageChange(totalPages)}
                                >
                                  {totalPages}
                                </Button>
                              );
                            }

                            return pages;
                          })()}
                        </div>

                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          title="Page suivante"
                        >
                          <i data-feather="chevron-right" style={{ width: "14px", height: "14px" }}></i>
                        </Button>

                        <Button
                          variant={theme === "dark" ? "outline-light" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          title="Dernière page"
                        >
                          <i data-feather="chevrons-right" style={{ width: "14px", height: "14px" }}></i>
                        </Button>
                      </div>
                    </nav>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Modal de détails d'une notification */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
        className={theme === "dark" ? "modal-dark" : ""}
      >
        <Modal.Header closeButton className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Modal.Title>
            <i data-feather="bell" className="me-2" style={{ width: "20px", height: "20px" }}></i>
            Détails de la notification
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          {selectedNotification && (
            <div>
              <div className="d-flex align-items-center mb-4">
                <div className={`me-3 p-3 rounded-circle bg-${getNotificationColor(selectedNotification.type)} bg-opacity-10`}>
                  <i 
                    data-feather={getNotificationIcon(selectedNotification.type)} 
                    className={`text-${getNotificationColor(selectedNotification.type)}`} 
                    style={{ width: "24px", height: "24px" }}
                  ></i>
                </div>
                <div>
                  <h4 className={theme === "dark" ? "text-light" : "text-dark"}>
                    {selectedNotification.title || 'Notification'}
                  </h4>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={getNotificationColor(selectedNotification.type)}>
                      {selectedNotification.type || 'Info'}
                    </Badge>
                    {selectedNotification.priority === 'high' && (
                      <Badge bg="danger">
                        <i data-feather="alert-triangle" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                        Priorité élevée
                      </Badge>
                    )}
                    <Badge bg={selectedNotification.is_read ? "success" : "warning"}>
                      {selectedNotification.is_read ? "Lue" : "Non lue"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="message-square" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Message
                </h6>
                <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                  <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {selectedNotification.message || 'Aucun message disponible'}
                  </p>
                </div>
              </div>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Date de création:
                    </strong>
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      {formatDate(selectedNotification.created_at)}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={`d-block mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Expéditeur:
                    </strong>
                    <span className={theme === "dark" ? "text-light" : "text-muted"}>
                      {selectedNotification.sender || 'Système'}
                    </span>
                  </div>
                </Col>
              </Row>

              {selectedNotification.data && (
                <div className="mb-3">
                  <strong className={`d-block mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Informations supplémentaires:
                  </strong>
                  <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <pre className={`mb-0 small ${theme === "dark" ? "text-light" : "text-dark"}`} style={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedNotification.action_url && (
                <div className="mb-3">
                  <strong className={`d-block mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="external-link" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Action recommandée:
                  </strong>
                  <Button 
                    variant="primary"
                    as={Link}
                    to={selectedNotification.action_url}
                    className="w-100"
                  >
                    <i data-feather="arrow-right" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    {selectedNotification.action_text || 'Voir plus'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            <i data-feather="x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Fermer
          </Button>
          {selectedNotification && !selectedNotification.is_read && (
            <Button 
              variant="success" 
              onClick={() => {
                markAsRead(selectedNotification.id);
                setSelectedNotification({...selectedNotification, is_read: true});
              }}
            >
              <i data-feather="check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Marquer comme lu
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className={theme === "dark" ? "modal-dark" : ""}
      >
        <Modal.Header closeButton className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Modal.Title>
            <i data-feather="trash-2" className="me-2 text-danger" style={{ width: "20px", height: "20px" }}></i>
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <div className="text-center">
            <div className="mb-3">
              <i data-feather="alert-triangle" className="text-warning" style={{ width: "48px", height: "48px" }}></i>
            </div>
            <p className={theme === "dark" ? "text-light" : "text-dark"}>
              Êtes-vous sûr de vouloir supprimer {selectedNotifications.length === 1 ? 'cette notification' : `ces ${selectedNotifications.length} notifications`} ?
            </p>
            <p className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Cette action est irréversible.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            <i data-feather="x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Annuler
          </Button>
          <Button variant="danger" onClick={deleteNotifications}>
            <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </PatientLayout>
  );
}