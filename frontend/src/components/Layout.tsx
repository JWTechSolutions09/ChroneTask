import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation, Link, useParams } from "react-router-dom";
import { clearToken, isAuthed } from "../auth/token";
import { http } from "../api/http";
import { useTheme } from "../contexts/ThemeContext";

type LayoutProps = {
  children: React.ReactNode;
  organizationId?: string;
};

type Org = {
  id: string;
  name: string;
  slug?: string | null;
};

type Project = {
  id: string;
  name: string;
};

export default function Layout({ children, organizationId }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Detectar si estamos en móvil y manejar resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Solo cerrar el sidebar si cambiamos de móvil a desktop
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarOpen]);
  
  // En móvil, cuando el menú está abierto, forzar que no esté colapsado
  // Usar useMemo para evitar re-renderizados innecesarios
  const effectiveCollapsed = useMemo(() => {
    return isMobile && sidebarOpen ? false : sidebarCollapsed;
  }, [isMobile, sidebarOpen, sidebarCollapsed]);

  // Cerrar sidebar al cambiar de ruta en móvil (pero no inmediatamente para evitar parpadeo)
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      // Usar un pequeño delay para evitar que se cierre antes de que se complete la navegación
      const timer = setTimeout(() => {
        setSidebarOpen(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isMobile]);

  // Memoizar funciones para evitar recrearlas en cada render
  const loadOrgs = useCallback(async () => {
    try {
      const res = await http.get("/api/orgs");
      setOrgs(res.data || []);
    } catch (err: any) {
      console.error("Error cargando organizaciones:", err);
      // No mostrar error en el sidebar para no interrumpir la UX
    }
  }, []);

  const loadOrgInfo = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await http.get("/api/orgs");
      const orgs = res.data || [];
      const org = orgs.find((o: Org) => o.id === organizationId);
      setCurrentOrg(org || null);
    } catch (err: any) {
      console.error("Error cargando información de organización:", err);
      // No mostrar error en el sidebar para no interrumpir la UX
    }
  }, [organizationId]);

  const loadProjects = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects`);
      setProjects(res.data || []);
    } catch (err: any) {
      console.error("Error cargando proyectos:", err);
      // No mostrar error en el sidebar para no interrumpir la UX
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Solo cargar datos cuando cambie organizationId
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const loadData = async () => {
      try {
        if (organizationId) {
          await loadOrgInfo();
          if (isMounted) {
            await loadProjects();
          }
        } else {
          await loadOrgs();
        }
      } catch (error) {
        // Silenciar errores de carga en el Layout para no interrumpir la UX
        console.error("Error en Layout:", error);
        // Asegurarse de que el componente siempre renderice
      }
    };
    
    // Usar un pequeño delay para evitar cargas innecesarias durante navegación rápida
    timeoutId = setTimeout(() => {
      loadData();
    }, 100);
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [organizationId]); // Solo dependemos de organizationId


  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Función helper para cerrar el sidebar en móvil
  const closeMobileMenu = useCallback(() => {
    setSidebarOpen(false);
    // Restaurar la posición del scroll
    const scrollY = document.body.style.top;
    document.body.classList.remove('sidebar-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.body.style.left = '';
    
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, []);

  if (!isAuthed()) {
    return <>{children}</>;
  }

  // Prevenir scroll del body cuando el sidebar está abierto en móvil
  React.useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && sidebarOpen) {
      // Guardar la posición del scroll antes de fijar el body
      const scrollY = window.scrollY;
      document.body.classList.add("sidebar-open");
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
    } else {
      // Restaurar la posición del scroll
      const scrollY = document.body.style.top;
      document.body.classList.remove("sidebar-open");
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      document.body.style.left = "";
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    const handleResize = () => {
      if (window.innerWidth > 768) {
        const scrollY = document.body.style.top;
        document.body.classList.remove("sidebar-open");
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.top = "";
        document.body.style.left = "";
        
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      const scrollY = document.body.style.top;
      document.body.classList.remove("sidebar-open");
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      document.body.style.left = "";
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      
      window.removeEventListener("resize", handleResize);
    };
  }, [sidebarOpen]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-secondary)", position: "relative" }}>
      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
        onTouchStart={(e) => {
          e.preventDefault();
          closeMobileMenu();
        }}
      />

      {/* Mobile Menu Button */}
      <button
        onClick={() => {
          const isMobile = window.innerWidth <= 768;
          setSidebarOpen(!sidebarOpen);
          // Si se está abriendo en móvil, asegurar que no esté colapsado
          if (!sidebarOpen && isMobile) {
            setSidebarCollapsed(false);
          }
        }}
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 1001,
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "10px 12px",
          cursor: "pointer",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          fontSize: "20px",
          color: "var(--text-primary)",
          minWidth: "44px",
          minHeight: "44px",
        }}
        className="mobile-menu-btn"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar / Mobile Dropdown Menu */}
      <aside
        style={{
          width: effectiveCollapsed ? "70px" : "280px",
          backgroundColor: "var(--bg-primary)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s ease, transform 0.3s ease",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          boxShadow: theme === "dark" ? "2px 0 8px rgba(0, 0, 0, 0.3)" : "2px 0 8px rgba(0, 0, 0, 0.05)",
          zIndex: 100,
        }}
        className={`sidebar ${sidebarOpen ? "open" : ""} mobile-dropdown-menu`}
        onClick={(e) => {
          // Prevenir que el clic en el sidebar cierre el menú
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          // Prevenir que el touch en el sidebar cierre el menú
          e.stopPropagation();
        }}
      >
        {/* Logo/Header */}
        <div
          style={{
            padding: "20px 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "72px",
            backgroundColor: "var(--bg-primary)",
            position: "relative",
          }}
        >
          {!effectiveCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  backgroundColor: theme === "dark" ? "transparent" : "#000000",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0",
                  boxShadow: "0 3px 8px rgba(0, 0, 0, 0.15)",
                  minHeight: "48px",
                  minWidth: "48px",
                  flexShrink: 0,
                }}
              >
                <img 
                  src="/logosidebar.png" 
                  alt="ChroneTask Logo" 
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <span style={{ fontWeight: 700, fontSize: "18px", color: "var(--text-primary)", letterSpacing: "-0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                ChroneTask
              </span>
            </div>
          )}
          {effectiveCollapsed && (
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: theme === "dark" ? "transparent" : "#000000",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0",
                boxShadow: "0 3px 8px rgba(0, 0, 0, 0.15)",
                margin: "0 auto",
                minHeight: "48px",
                minWidth: "48px",
              }}
            >
              <img 
                src="/logosidebar.png" 
                alt="ChroneTask Logo" 
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          )}
          {/* Botón de cerrar en móvil */}
          <button
            onClick={closeMobileMenu}
            className="mobile-close-btn"
            style={{
              background: "var(--hover-bg)",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              width: "36px",
              height: "36px",
              flexShrink: 0,
              minWidth: "36px",
              minHeight: "36px",
            }}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
          <button
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
              // En móvil, también cerrar el sidebar al colapsar
              if (window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
            }}
            className="sidebar-toggle-btn"
            style={{
              background: "var(--hover-bg)",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              width: "36px",
              height: "36px",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--hover-bg)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            title={sidebarCollapsed ? "Expandir" : "Colapsar"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", WebkitOverflowScrolling: "touch" }}>
          {organizationId ? (
            <>
              {/* Organization Info */}
              {currentOrg && (
                <div
                  style={{
                    padding: "14px",
                    marginBottom: "12px",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    display: effectiveCollapsed ? "none" : "block",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    Organización
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>
                    {currentOrg.name}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ marginBottom: "16px" }}>
                {!effectiveCollapsed && (
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px", marginBottom: "4px" }}>
                    Accesos Rápidos
                  </div>
                )}
                <NavItem
                  icon="➕"
                  label="Nuevo Proyecto"
                  to={`/org/${organizationId}/projects`}
                  active={isActive(`/org/${organizationId}/projects`) && location.search.includes("new")}
                  collapsed={effectiveCollapsed}
                  onNavigate={closeMobileMenu}
                  onClick={() => {
                    // Scroll to create form
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                />
                <NavItem
                  icon="✉️"
                  label="Invitar Miembros"
                  to={`/org/${organizationId}/dashboard`}
                  active={false}
                  collapsed={effectiveCollapsed}
                  onNavigate={closeMobileMenu}
                  onClick={() => {
                    navigate(`/org/${organizationId}/dashboard`);
                    setTimeout(() => {
                      const inviteBtn = document.querySelector('[title="Invitar miembros a la organización"]');
                      if (inviteBtn) (inviteBtn as HTMLElement).click();
                    }, 300);
                  }}
                />
                <NavItem
                  icon="👥"
                  label="Ver Miembros"
                  to={`/org/${organizationId}/dashboard`}
                  active={false}
                  collapsed={effectiveCollapsed}
                  onNavigate={closeMobileMenu}
                  onClick={() => {
                    navigate(`/org/${organizationId}/dashboard`);
                    setTimeout(() => {
                      const membersBtn = document.querySelector('[title="Ver miembros de la organización"]');
                      if (membersBtn) (membersBtn as HTMLElement).click();
                    }, 300);
                  }}
                />
              </div>

              {/* Main Navigation */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px", marginBottom: "4px" }}>
                  {effectiveCollapsed ? "" : "Navegación"}
                </div>
                <NavItem
                  icon="📊"
                  label="Dashboard"
                  to={`/org/${organizationId}/dashboard`}
                  active={isActive(`/org/${organizationId}/dashboard`)}
                  collapsed={effectiveCollapsed}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="📁"
                  label="Proyectos"
                  to={`/org/${organizationId}/projects`}
                  active={isActive(`/org/${organizationId}/projects`)}
                  collapsed={effectiveCollapsed}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="🔔"
                  label="Notificaciones"
                  to={`/org/${organizationId}/notifications`}
                  active={isActive(`/org/${organizationId}/notifications`)}
                  collapsed={effectiveCollapsed}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="📊"
                  label="Resumen"
                  to={`/org/${organizationId}/analytics`}
                  active={isActive(`/org/${organizationId}/analytics`)}
                  collapsed={effectiveCollapsed}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="📅"
                  label="Cronograma"
                  to={`/org/${organizationId}/timeline`}
                  active={isActive(`/org/${organizationId}/timeline`) || isActive(`/org/${organizationId}/project/`) && location.pathname.includes("timeline")}
                  collapsed={effectiveCollapsed}
                  onNavigate={closeMobileMenu}
                />
              </div>

              {/* Projects List */}
              {projects.length > 0 && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-color)", display: effectiveCollapsed ? "none" : "block" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "8px 12px",
                      marginBottom: "4px",
                    }}
                  >
                    Mis Proyectos
                  </div>
                  {projects.map((project) => (
                    <NavItem
                      key={project.id}
                      icon="📋"
                      label={project.name}
                      to={`/org/${organizationId}/project/${project.id}/board`}
                      active={params.projectId === project.id}
                      collapsed={effectiveCollapsed}
                      indent
                      onNavigate={closeMobileMenu}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <NavItem
                icon="🏢"
                label="Organizaciones"
                to="/orgs"
                active={isActive("/orgs")}
                collapsed={effectiveCollapsed}
                onNavigate={closeMobileMenu}
              />
              <NavItem
                icon="🔀"
                label="Seleccionar Org"
                to="/org-select"
                active={isActive("/org-select")}
                collapsed={effectiveCollapsed}
                onNavigate={closeMobileMenu}
              />
            </>
          )}

          {/* Bottom Actions */}
          <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
            {!effectiveCollapsed && (
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px", marginBottom: "8px" }}>
                Configuración
              </div>
            )}
            
            {/* Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                if (window.innerWidth <= 768) {
                  closeMobileMenu();
                }
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: "8px",
                background: "var(--hover-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                justifyContent: effectiveCollapsed ? "center" : "flex-start",
                transition: "all 0.2s",
                fontWeight: 500,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                  e.currentTarget.style.transform = "translateX(2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                  e.currentTarget.style.transform = "translateX(0)";
                }
              }}
              title={effectiveCollapsed ? (theme === "dark" ? "Modo Claro" : "Modo Oscuro") : undefined}
            >
              <span style={{ fontSize: "18px" }}>{theme === "dark" ? "☀️" : "🌙"}</span>
              {!effectiveCollapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>}
            </button>

            {!effectiveCollapsed && organizationId && (
              <button
                onClick={() => {
                  navigate("/org-select");
                  if (window.innerWidth <= 768) {
                    closeMobileMenu();
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: "8px",
                  background: "var(--hover-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.2s",
                  fontWeight: 500,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                    e.currentTarget.style.transform = "translateX(2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }
                }}
              >
                <span style={{ fontSize: "18px" }}>🔄</span>
                <span>Cambiar Org</span>
              </button>
            )}
            
            <button
              onClick={() => {
                navigate("/settings");
                if (window.innerWidth <= 768) {
                  closeMobileMenu();
                }
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                marginBottom: "8px",
                background: "var(--hover-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                justifyContent: effectiveCollapsed ? "center" : "flex-start",
                transition: "all 0.2s",
                fontWeight: 500,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                  e.currentTarget.style.transform = "translateX(2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                  e.currentTarget.style.transform = "translateX(0)";
                }
              }}
              title={effectiveCollapsed ? "Configuración" : undefined}
            >
              <span style={{ fontSize: "18px" }}>⚙️</span>
              {!effectiveCollapsed && <span>Configuración</span>}
            </button>
            
            <button
              onClick={() => {
                handleLogout();
                if (window.innerWidth <= 768) {
                  closeMobileMenu();
                }
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: theme === "dark" ? "rgba(220, 53, 69, 0.2)" : "rgba(220, 53, 69, 0.1)",
                border: "1px solid var(--danger)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                justifyContent: effectiveCollapsed ? "center" : "flex-start",
                transition: "all 0.2s",
                fontWeight: 500,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(220, 53, 69, 0.3)" : "rgba(220, 53, 69, 0.15)";
                  e.currentTarget.style.transform = "translateX(2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(220, 53, 69, 0.2)" : "rgba(220, 53, 69, 0.1)";
                  e.currentTarget.style.transform = "translateX(0)";
                }
              }}
              title={effectiveCollapsed ? "Salir" : undefined}
            >
              <span style={{ fontSize: "18px" }}>🚪</span>
              {!effectiveCollapsed && <span>Salir</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className="main-content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          overflowY: "auto",
          width: "100%",
          minWidth: 0,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </main>
    </div>
  );
}

type NavItemProps = {
  icon: string;
  label: string;
  to: string;
  active: boolean;
  collapsed: boolean;
  indent?: boolean;
  onClick?: () => void;
  onNavigate?: () => void;
};

function NavItem({ icon, label, to, active, collapsed, indent, onClick, onNavigate }: NavItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Llamar al callback de navegación primero para cerrar el menú
    if (onNavigate) {
      onNavigate();
    }
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      onTouchEnd={(e) => {
        // Prevenir que el touch cause problemas
        e.stopPropagation();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        marginBottom: "6px",
        borderRadius: "8px",
        textDecoration: "none",
        color: active ? "var(--primary)" : "var(--text-primary)",
        backgroundColor: active ? "rgba(0, 123, 255, 0.1)" : "transparent",
        fontWeight: active ? 600 : 500,
        fontSize: "14px",
        transition: "all 0.2s",
        paddingLeft: indent ? "36px" : "12px",
        justifyContent: collapsed ? "center" : "flex-start",
        border: active ? "1px solid rgba(0, 123, 255, 0.2)" : "1px solid transparent",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "rgba(0, 0, 0, 0.1)",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        if (!active && window.innerWidth > 768) {
          e.currentTarget.style.backgroundColor = "var(--hover-bg)";
          e.currentTarget.style.transform = "translateX(4px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active && window.innerWidth > 768) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.transform = "translateX(0)";
        }
      }}
      title={collapsed ? label : undefined}
    >
      <span style={{ fontSize: "20px", minWidth: "24px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
      {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
    </Link>
  );
}
