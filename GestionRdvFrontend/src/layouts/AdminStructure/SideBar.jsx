import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/AdminStructure/css/theme.css";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminStructureSidebar({ collapsed, isMobile, visible }) {
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

  // Menu organisé par sections spécifiques à l'Admin Structure
  const menuSections = [
    {
      title: "Vue d'ensemble",
      items: [
        { label: "Dashboard", icon: "home", path: "/admin-structure/dashboard" },
        { label: "Statistiques", icon: "bar-chart-2", path: "/admin-structure/statistiques" },
      ]
    },
    {
      title: "Gestion Personnel",
      items: [
        { label: "Médecins", icon: "user-check", path: "/admin-structure/view/docteur" },
        { label: "Personnel Admin", icon: "user-plus", path: "/admin-structure/personnel" },
      ]
    },
    {
      title: "Gestion Patients",
      items: [
        { label: "Patients", icon: "user", path: "/admin-structure/patients" },
        { label: "Rendez-vous", icon: "calendar", path: "/admin-structure/rdv" },
        { label: "Dossiers Médicaux", icon: "file-text", path: "/admin-structure/dossiers" },
      ]
    },
    {
      title: "Administration",
      items: [
        { label: "Structure", icon: "home", path: "/admin-structure/ma-structure" },
        { label: "Configuration", icon: "settings", path: "/admin-structure/config" },
      ]
    },
  ];

  // Classes CSS dynamiques
  const sidebarClasses = [
    'admin-structure-sidebar',
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
            <i data-feather="building-2" />
          </div>
          <div className="sidebar-logo-text">
            <h6 className="sidebar-logo-title">{user.structure?.nom || "Ma Structure"}</h6>
            <p className="sidebar-logo-subtitle">Administration</p>
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
          <div className="status-item">
            <i data-feather="wifi" className="status-online" />
            <span>Connecté</span>
          </div>
        </div>
      </div>
    </aside>
  );
}