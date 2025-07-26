import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/AdminSysteme/css/theme.css";

export default function AdminSystemeSidebar({ user, collapsed }) {
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

  // Fonction pour obtenir les initiales  pour l'affichage des infirmation personnelle
  // const getInitials = (name) => {
  //   if (!name) return "U";
  //   return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  // };

  // Menu organisé par sections
  const menuSections = [
    {
      title: "Tableau de bord",
      items: [
        { label: "Dashboard", icon: "grid", path: "/admin-systeme/dashboard" },
      ]
    },
    {
      title: "Gestion",
      items: [
        { label: "Structures", icon: "home", path: "/admin-systeme/view/structures" },
        { label: "Patients", icon: "users", path: "/admin-systeme/view/patient" },
        { label: "Docteurs", icon: "user-check", path: "/admin-systeme/view/docteur" },
        { label: "Admin Structures", icon: "shield", path: "/admin-systeme/view/admin-structure" },
      ]
    },
    {
      title: "Administration",
      items: [
        { label: "Admin Système", icon: "settings", path: "/admin-systeme/view/admin-systeme" },
        { label: "Invitations", icon: "mail", path: "/admin-systeme/view/invitations", 
          // badge: "3" 
        },
      ]
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : "" }  ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
      {/* Header avec logo et informations */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span>MC</span>
          </div>
          <div className="sidebar-logo-text">
            <h6 className="sidebar-logo-title">Medi Connect</h6>
            <p className="sidebar-logo-subtitle">Admin Système</p>
          </div>
        </div>
        
        {/* Informations utilisateur */}
        {/* <div className="sidebar-user-info">
          <div className="sidebar-user-avatar">
            {getInitials(user?.name)}
          </div>
          <h6 className="sidebar-user-name">
            {user?.name || "Administrateur"}
          </h6>
          <p className="sidebar-user-role">
            {user?.structure?.nom || "Système"}
          </p>
        </div> */}

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
                  >
                    <i 
                      data-feather={item.icon} 
                      className="sidebar-nav-icon"
                    />
                    <span className="sidebar-nav-text">{item.label}</span>
                    {item.badge && (
                      <span className="sidebar-nav-badge">{item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      
      {/* <div className="sidebar-footer mt-auto p-3 text-center">
        <small className="text-muted">
          Version 2.1.0
        </small>
      </div> */}

    </aside>
  );
}