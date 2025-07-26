import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AdminStructureSidebar from "./SideBar";
import AdminStructureNavbar from "./NavBar";
import feather from "feather-icons";
import '../../assets/AdminStructure/css/theme.css';
import "../../assets/AdminStructure/css/SideBar.css";
import "../../assets/AdminStructure/css/NavBar.css";

export default function AdminStructureLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [theme, setTheme] = useState("light");

  // Remplace les icônes feather au chargement et sur changement de route/sidebar
  useEffect(() => {
    feather.replace();
  }, [location.pathname, sidebarVisible, sidebarCollapsed, theme]);

  // Gère le thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-structure-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
    setTheme(savedTheme);
  }, []);

  // Détecte les changements de thème depuis le DOM
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(newTheme);
      document.documentElement.setAttribute("data-bs-theme", newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Détection responsive et gestion des états initiaux
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      
      // Gestion des états selon la résolution
      if (mobile) {
        // En mobile : sidebar cachée par défaut, pas de collapsed
        setSidebarVisible(false);
        setSidebarCollapsed(false);
      } else {
        // En desktop : sidebar visible par défaut, peut être collapsed
        setSidebarVisible(true);
        // Garde l'état collapsed précédent ou le récupère du localStorage
        const savedCollapsed = localStorage.getItem("admin-structure-sidebar-collapsed") === "true";
        setSidebarCollapsed(savedCollapsed);
      }
    };

    handleResize(); // appel initial
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fermer la sidebar en cliquant sur un lien en mobile
  useEffect(() => {
    if (isMobile && sidebarVisible) {
      setSidebarVisible(false);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sauvegarde l'état collapsed en desktop
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("admin-structure-sidebar-collapsed", sidebarCollapsed.toString());
    }
  }, [sidebarCollapsed, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      // En mobile : toggle visibility
      setSidebarVisible((prev) => !prev);
    } else {
      // En desktop : toggle collapsed state
      setSidebarCollapsed((prev) => !prev);
    }
  };

  // Détermine les classes CSS pour le contenu principal
  const getMainContentClasses = () => {
    if (isMobile) {
      return 'main-content'; // Pas de marge en mobile
    }
    
    if (sidebarCollapsed) {
      return 'main-content sidebar-collapsed';
    }
    
    return 'main-content sidebar-expanded';
  };

  return (
    <div className="">
      
      
      {/* Sidebar */}
      <AdminStructureSidebar 
        user={user} 
        collapsed={isMobile ? false : sidebarCollapsed} 
        isMobile={isMobile}
        visible={isMobile ? sidebarVisible : true}
      />

      {/* Navbar fixe en haut */}
      <AdminStructureNavbar toggleSidebar={toggleSidebar}  />
      
      {/* Overlay pour mobile - Couvre tout l'écran sauf la sidebar */}
      {isMobile && sidebarVisible && (
        <div
          className=""
          onClick={() => setSidebarVisible(false)}
        />
      )}
      
      {/* Contenu principal */}
      <div className={getMainContentClasses()}>
        {/* Zone de contenu avec padding approprié */}
        <main className="p-4">
          <div className="container-fluid">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}