// LayoutPatient.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PatientNavbar from "./NavBar";
import PatientSidebar from "./SideBar";
import feather from "feather-icons";
import '../../assets/Patient/theme.css';
import "../../assets/Patient/NavBarPatient.css";
import "../../assets/Patient/SideBarPatient.css"; // s'assurer que le style est appliqué

export default function PatientLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    feather.replace();
  }, [location.pathname, sidebarVisible, sidebarCollapsed, theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("patient-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
    setTheme(savedTheme);
  }, []);

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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarVisible(false);
        setSidebarCollapsed(false);
      } else {
        setSidebarVisible(true);
        const savedCollapsed = localStorage.getItem("patient-sidebar-collapsed") === "true";
        setSidebarCollapsed(savedCollapsed);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarVisible) {
      setSidebarVisible(false);
    }
  }, [location.pathname, isMobile, sidebarVisible]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("patient-sidebar-collapsed", sidebarCollapsed.toString());
    }
  }, [sidebarCollapsed, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarVisible((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const getMainContentClasses = () => {
    if (isMobile) {
      return 'main-content';
    }
    return sidebarCollapsed ? 'main-content sidebar-collapsed' : 'main-content sidebar-expanded';
  };

  return (
    <>
      <PatientNavbar toggleSidebar={toggleSidebar} />

      <div className="layout-wrapper">
        <PatientSidebar 
          user={user} 
          collapsed={!isMobile && sidebarCollapsed}
          isMobile={isMobile}
          visible={isMobile ? sidebarVisible : true}
        />

        <div className={getMainContentClasses()}>
          <main className="p-0">
            <div className="container-fluid">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
