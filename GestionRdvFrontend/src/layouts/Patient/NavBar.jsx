import React, { useEffect, useState } from "react";
import { Navbar, Button, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../assets/Patient/theme.css";
import feather from "feather-icons";

export default function PatientNavbar({ toggleSidebar }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");

  // Détecte le thème au montage et sur changement du DOM
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

  const toggleTheme = () => {
    const html = document.documentElement;
    const newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("patient-theme", newTheme);
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fonction pour obtenir les initiales
  const getInitials = (name) => {
    if (!name) return "PT";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Fonction pour tronquer le nom
  const truncateName = (name, maxLength = 18) => {
    if (!name) return "";
    return name.length > maxLength ? name.slice(0, maxLength - 3) + "..." : name;
  };

  useEffect(() => {
    feather.replace();
  }, [theme]);

  // Gestionnaire de clic pour le toggle avec vérification
  const handleToggleSidebar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof toggleSidebar === 'function') {
      toggleSidebar();
    }
  };

  return (
    <Navbar className="patient-navbar fixed-top" expand={false}>
      {/* Partie gauche - Logo et bouton toggle */}
      <div className="navbar-left">
        <Button 
          variant="link" 
          onClick={handleToggleSidebar}
          className="toggle-btn me-3"
          title="Toggle Sidebar"
        >
          <i 
            data-feather="menu" 
            style={{ 
              width: '22px', 
              height: '22px',
              strokeWidth: '2'
            }} 
          />
        </Button>
        
        <div className="logo-container">
          <div className="logo-structure">
            <i data-feather="heart" />
          </div>
          <Navbar.Brand className="navbar-brand mb-0">
            <div className="brand-text">
              <span className="brand-main">Medi Connect</span>
              <span className="h6 text-secondary">Espace Patient</span>
            </div>
          </Navbar.Brand>
        </div>
      </div>

      {/* Partie droite - Actions utilisateur */}
      <div className="navbar-right">

        {/* Bouton Notifications */}
        <Button 
          variant="link" 
          className="notification-btn me-3"
          title="Notifications"
          as={Link}
          to="/patient/notifications"
        >
          <i data-feather="bell" />
          {/* Badge pour les notifications non lues */}
          {/* <Badge bg="danger" pill className="notification-badge">
            3
          </Badge> */}
        </Button>

        {/* Bouton Messages */}
        <Button 
          variant="link" 
          className="message-btn me-3"
          title="Messages"
          as={Link}
          to="/patient/messages"
        >
          <i data-feather="message-circle" />
        </Button>

        {/* Toggle Thème */}
        <Button 
          variant="link" 
          onClick={toggleTheme} 
          className="theme-toggle me-3"
          title={`Passer au thème ${theme === "dark" ? "clair" : "sombre"}`}
        >
          <i data-feather={theme === "dark" ? "sun" : "moon"} />
        </Button>

        {/* Dropdown Utilisateur */}
        <Dropdown align="end" className="user-dropdown" onToggle={(isOpen) => {
          if (isOpen) {
            // Remplace les icônes quand le dropdown s'ouvre
            setTimeout(() => feather.replace(), 0);
          }
        }}>
          <Dropdown.Toggle 
            variant="primary" 
            id="dropdown-user" 
            className="user-dropdown-toggle"
          >
            <div className="user-avatar">
              {getInitials(user?.name)}
            </div>
            <div className="user-info d-none d-sm-block">
              <span className="user-name">
                {truncateName(user?.name || "Patient")}
              </span>
            </div>
            <i data-feather="chevron-down" className="dropdown-icon" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="">
            <div className="dropdown-header">
              <div className="user-details">
                <div className="fw-semibold">{user?.name || "Patient"}</div>
                <div className="text-muted small">{user?.email || "patient@email.com"}</div>
                <div className="text-primary small">Patient</div>
              </div>
            </div>
            
            <Dropdown.Item 
              as={Link} 
              to="/patient/profil" 
              className="dropdown-item-custom"
            >
              <i data-feather="user" className="me-2" />
              Mon Profil
            </Dropdown.Item>
            
            <Dropdown.Item 
              as={Link} 
              to="/patient/dossier-medical" 
              className="dropdown-item-custom"
            >
              <i data-feather="file-medical" className="me-2" />
              Mon Dossier Médical
            </Dropdown.Item>
            
            <Dropdown.Item 
              as={Link} 
              to="/patient/historique" 
              className="dropdown-item-custom"
            >
              <i data-feather="clock" className="me-2" />
              Historique
            </Dropdown.Item>
            
            <Dropdown.Item 
              as={Link} 
              to="/patient/parametres" 
              className="dropdown-item-custom"
            >
              <i data-feather="settings" className="me-2" />
              Paramètres
            </Dropdown.Item>
            
            <Dropdown.Divider />
            
            <Dropdown.Item 
              onClick={handleLogout} 
              className="dropdown-item-logout"
            >
              <i data-feather="log-out" className="me-2" />
              Déconnexion
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Navbar>
  );
}