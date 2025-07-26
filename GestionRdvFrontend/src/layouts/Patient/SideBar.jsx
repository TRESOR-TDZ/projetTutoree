import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import '../../assets/Patient//theme.css';
import { useAuth } from "../../contexts/AuthContext";

export default function PatientSidebar({ collapsed, isMobile, visible }) {
  const { user } = useAuth();
  const location = useLocation();
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

  // Menu organisé par sections spécifiques au Patient
  const menuSections = [
    {
      title: "Accueil",
      items: [
        { label: "Dashboard", icon: "home", path: "/patient/dashboard" },
        { label: "Rendez-vous", icon: "calendar", path: "/patient/rendez-vous" },
      ]
    },
    {
      title: "Recherche",
      items: [
        { label: "Trouver un Médecin", icon: "search", path: "/patient/view/doctor" },
        { label: "Établissements", icon: "map-pin", path: "/patient/view/structure" },
      ]
    },
    {
      title: "Consultations",
      items: [
        { label: "Prendre RDV", icon: "plus-circle", path: "/patient/prendre-rdv" },
        { label: "Consultation en ligne", icon: "video", path: "/patient/consultation-enligne" },
        { label: "Mes Consultations", icon: "user-check", path: "/patient/mes-consultations" },
      ]
    },
    {
      title: "Santé",
      items: [
        { label: "Dossier Médical", icon: "file-medical", path: "/patient/dossier-medical" },
        { label: "Ordonnances", icon: "file-text", path: "/patient/ordonnances" },
        { label: "Examens & Résultats", icon: "activity", path: "/patient/examens" },
        // { label: "Vaccinations", icon: "shield", path: "/patient/vaccinations" },
      ]
    },
    {
      title: "Communication",
      items: [
        // { label: "Messages", icon: "message-circle", path: "/patient/messages" },
        { label: "Notifications", icon: "bell", path: "/patient/notifications" },
      ]
    },
    {
      title: "Mon Compte",
      items: [
        { label: "Profil", icon: "user", path: "/patient/profil" },
        // { label: "Historique", icon: "clock", path: "/patient/historique" },
        // { label: "Paramètres", icon: "settings", path: "/patient/parametres" },
      ]
    },
  ];

  // Classes CSS dynamiques
  const sidebarClasses = [
    'patient-sidebar',
    collapsed && !isMobile ? 'collapsed' : '',
    isMobile && !visible ? 'mobile-hidden' : '',
    isMobile && visible ? 'mobile-visible' : ''
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses}>
      {/* Header avec logo et informations */}
      <div className={`sidebar-header ${theme === "dark" ? "text-light" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <i data-feather="heart" />
          </div>
          <div className="sidebar-logo-text">
            <h6 className="sidebar-logo-title">Bienvenue</h6>
            <p className="sidebar-logo-subtitle">{user?.name || "Patient"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="sidebar-nav-section">
            <h6 className="sidebar-nav-section-title">{section.title}</h6>
            <ul className="list-unstyled mb-0">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="sidebar-nav-item">
                  <Link
                    to={item.path}
                    className={`sidebar-nav-link ${
                      location.pathname.startsWith(item.path) ? "active" : ""
                    }`}
                    title={collapsed && !isMobile ? item.label : undefined}
                  >
                    <i 
                      data-feather={item.icon} 
                      className="sidebar-nav-icon"
                    />
                    <span className="sidebar-nav-text">{item.label}</span>
                    {item.badge && (
                      <span className="sidebar-nav-badge">{item.badge}</span>
                    )}
                    {item.count && (
                      <span className="sidebar-nav-count">{item.count}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer avec informations système */}
      <div className="sidebar-footer">
        <div className="system-status">
          <div className="health-tip text-truncate">
            <i data-feather="info" className="me-1" />
            <small>Prenez soin de votre santé</small>
          </div>
        </div>
      </div>
    </aside>
  );
}