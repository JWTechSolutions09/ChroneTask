import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearToken } from "../auth/token";

const AppNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: { label: string; path: string; icon: string }[] = [
    { label: "Dashboard", path: "/personal/dashboard", icon: "🏠" },
    { label: "Proyectos", path: "/personal/projects", icon: "📁" },
    { label: "Calendario", path: "/personal/calendar", icon: "📅" },
    { label: "Cronograma", path: "/personal/timeline", icon: "📆" },
    { label: "Notas", path: "/personal/notes", icon: "📝" },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNavigate = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    clearToken();
    setMobileOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="app-nav">
      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="app-nav-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="app-nav-container">
        {/* Logo / Marca */}
        <button
          className="app-nav-logo"
          onClick={() => handleNavigate("/personal/dashboard")}
        >
          <img src="/logolanding.png" alt="ChroneTask" />
          <span>ChroneTask</span>
        </button>

        {/* Toggle móvil */}
        <button
          className="app-nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menú"
        >
          <span className={mobileOpen ? "open" : ""}></span>
          <span className={mobileOpen ? "open" : ""}></span>
          <span className={mobileOpen ? "open" : ""}></span>
        </button>

        {/* Links desktop / contenedor móvil */}
        <div
          className={`app-nav-links ${mobileOpen ? "mobile-open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`app-nav-link ${
                isActive(item.path) ? "active" : ""
              }`}
              onClick={() => handleNavigate(item.path)}
            >
              <span className="app-nav-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button className="app-nav-link app-nav-link-primary" onClick={handleLogout}>
            <span className="app-nav-link-icon">🚪</span>
            <span>Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;

