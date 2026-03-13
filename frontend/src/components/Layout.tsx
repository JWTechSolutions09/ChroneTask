import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation, Link, useParams } from "react-router-dom";
import { clearToken, isAuthed } from "../auth/token";
import { http } from "../api/http";
import { useTheme } from "../contexts/ThemeContext";
import { useUserUsageType, UsageType } from "../hooks/useUserUsageType";
import { useTerminology } from "../hooks/useTerminology";
import AppNavbar from "./AppNavbar";

type LayoutProps = {
  children: React.ReactNode;
  organizationId?: string;
  usageType?: UsageType;
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

export default function Layout({ children, organizationId, usageType: propUsageType }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { theme, toggleTheme } = useTheme();
  const { usageType: hookUsageType, loading: loadingUsageType } = useUserUsageType();
  const usageType = propUsageType || hookUsageType;
  const t = useTerminology();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    // Inicializar isMobile correctamente desde el inicio
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });
  const [orgs, setOrgs] = useState<Org[]>([]);
  
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Determinar si mostrar secciones de organización/equipo
  // Solo mostrar si NO está cargando Y definitivamente NO es modo personal
  const showOrgSections = !loadingUsageType && (usageType === "business" || usageType === "team");
  const isPersonalMode = !loadingUsageType && usageType === "personal";
  const isTeamMode = !loadingUsageType && usageType === "team";
  const orgLabel = isTeamMode ? "Equipo" : "Organización";

  // Detectar si estamos en móvil y manejar resize
  useEffect(() => {
    let wasMobile = window.innerWidth <= 768;
    
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Solo cerrar el sidebar si REALMENTE cambiamos de móvil a desktop
      // (no solo si estamos en desktop, sino si cambió de móvil a desktop)
      if (!mobile && wasMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      wasMobile = mobile;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarOpen]);
  
  // En móvil, cuando el menú está abierto, forzar que no esté colapsado
  // Usar useMemo para evitar re-renderizados innecesarios
  // En móvil con menú abierto, SIEMPRE mostrar todo (no colapsado)
  const effectiveCollapsed = useMemo(() => {
    // Si estamos en móvil Y el sidebar está abierto, NUNCA colapsar
    if (isMobile && sidebarOpen) {
      return false;
    }
    // En desktop o cuando el sidebar está cerrado, usar el estado normal
    return sidebarCollapsed;
  }, [isMobile, sidebarOpen, sidebarCollapsed]);

  // NO cerrar automáticamente el sidebar al cambiar de ruta
  // El sidebar se cerrará solo cuando el usuario haga clic en un NavItem
  // Esto evita que se cierre solo sin interacción del usuario

  // Memoizar funciones para evitar recrearlas en cada render
  // NO cargar organizaciones en modo personal
  const loadOrgs = useCallback(async () => {
    if (isPersonalMode) return; // No cargar en modo personal
    try {
      const res = await http.get("/api/orgs");
      setOrgs(res.data || []);
    } catch (err: any) {
      console.error(`Error cargando ${isTeamMode ? "equipos" : "organizaciones"}:`, err);
      // No mostrar error en el sidebar para no interrumpir la UX
    }
  }, [isPersonalMode, isTeamMode]);

  const loadOrgInfo = useCallback(async () => {
    if (!organizationId || isPersonalMode) return; // No cargar en modo personal
    try {
      const res = await http.get("/api/orgs");
      const orgs = res.data || [];
      const org = orgs.find((o: Org) => o.id === organizationId);
      setCurrentOrg(org || null);
    } catch (err: any) {
      console.error(`Error cargando información de ${isTeamMode ? "equipo" : "organización"}:`, err);
      // No mostrar error en el sidebar para no interrumpir la UX
    }
  }, [organizationId, isPersonalMode, isTeamMode]);

  const loadProjects = useCallback(async () => {
    if (!organizationId || isPersonalMode) return; // No cargar en modo personal
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
  }, [organizationId, isPersonalMode]);

  // Limpiar organizaciones cuando se detecta modo personal
  useEffect(() => {
    if (isPersonalMode) {
      setOrgs([]);
      setCurrentOrg(null);
      setProjects([]);
    }
  }, [isPersonalMode]);

  // Solo cargar datos cuando cambie organizationId (NO en modo personal)
  useEffect(() => {
    // No cargar nada en modo personal o mientras está cargando el tipo de uso
    if (isPersonalMode || loadingUsageType) return;
    
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
  }, [organizationId, isPersonalMode, loadOrgInfo, loadProjects, loadOrgs]); // Dependemos de organizationId y modo personal


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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-secondary)", position: "relative", flexDirection: "column" }}>
      {/* Barra superior global de la aplicación (similar al landing) */}
      <AppNavbar />

      {/* Contenedor principal con sidebar + contenido */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>

      {/* Sidebar / Mobile Dropdown Menu */}
      <aside
        style={{
          // En desktop, usar estos estilos
          ...(!isMobile && {
            width: effectiveCollapsed ? "70px" : "280px",
            position: "sticky",
            height: "100vh",
            borderRight: "1px solid var(--border-color)",
            transition: "width 0.3s ease",
          }),
          // En móvil, ocultar completamente
          ...(isMobile && {
            display: "none",
            visibility: "hidden",
            opacity: 0,
            height: 0,
            width: 0,
            overflow: "hidden",
            position: "absolute",
            top: "-9999px",
            left: "-9999px",
            pointerEvents: "none",
          }),
          backgroundColor: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
          top: 0,
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
        onTouchEnd={(e) => {
          // Prevenir que el touch en el sidebar cierre el menú
          e.stopPropagation();
        }}
      >
        {/* Logo/Header - Oculto en móvil cuando navbar está visible */}
        <div
          className="sidebar-header"
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
                  src="/logolanding.png" 
                  alt="ChroneTask Logo" 
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
              <span style={{ 
                fontWeight: 700, 
                fontSize: isMobile ? "20px" : "18px", 
                color: "var(--text-primary)", 
                letterSpacing: "-0.5px", 
                whiteSpace: "nowrap", 
                overflow: "hidden", 
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0,
              }}>
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
                src="/logolanding.png" 
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
          {/* Botón de cerrar en móvil - REMOVIDO, ahora se usa el navbar */}
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
        <nav 
          style={{ 
            flex: 1, 
            padding: isMobile ? "16px 12px" : "12px", 
            overflowY: "auto", 
            overflowX: "hidden", 
            display: "flex", 
            flexDirection: "column", 
            WebkitOverflowScrolling: "touch",
            gap: isMobile ? "8px" : "0",
            // En móvil cuando está abierto, forzar visibilidad
            ...(isMobile && sidebarOpen ? {
              opacity: 1,
              visibility: 'visible',
            } : {})
          }}
          className={isMobile && sidebarOpen ? "mobile-nav-open" : ""}
        >
          {loadingUsageType ? (
            <div style={{ 
              padding: "20px", 
              textAlign: "center", 
              color: "var(--text-secondary)",
              fontSize: "14px"
            }}>
              Cargando...
            </div>
          ) : !loadingUsageType && showOrgSections && organizationId ? (
            <>
              {/* Organization/Team Info */}
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
                    {orgLabel}
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
                  forceShowLabel={isMobile && sidebarOpen}
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
                  forceShowLabel={isMobile && sidebarOpen}
                  onNavigate={closeMobileMenu}
                  onClick={() => {
                    navigate(`/org/${organizationId}/dashboard`);
                    setTimeout(() => {
                      const inviteBtn = document.querySelector(`[title="${t.inviteMembersToOrganization}"]`);
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
                  forceShowLabel={isMobile && sidebarOpen}
                  onNavigate={closeMobileMenu}
                  onClick={() => {
                    navigate(`/org/${organizationId}/dashboard`);
                    setTimeout(() => {
                      const membersBtn = document.querySelector(`[title="${t.viewOrganizationMembers}"]`);
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
                  forceShowLabel={isMobile && sidebarOpen}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="📁"
                  label="Proyectos"
                  to={`/org/${organizationId}/projects`}
                  active={isActive(`/org/${organizationId}/projects`)}
                  collapsed={effectiveCollapsed}
                  forceShowLabel={isMobile && sidebarOpen}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="🔔"
                  label="Notificaciones"
                  to={`/org/${organizationId}/notifications`}
                  active={isActive(`/org/${organizationId}/notifications`)}
                  collapsed={effectiveCollapsed}
                  forceShowLabel={isMobile && sidebarOpen}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="📊"
                  label="Resumen"
                  to={`/org/${organizationId}/analytics`}
                  active={isActive(`/org/${organizationId}/analytics`)}
                  collapsed={effectiveCollapsed}
                  forceShowLabel={isMobile && sidebarOpen}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="📅"
                  label="Cronograma"
                  to={`/org/${organizationId}/timeline`}
                  active={isActive(`/org/${organizationId}/timeline`) || isActive(`/org/${organizationId}/project/`) && location.pathname.includes("timeline")}
                  collapsed={effectiveCollapsed}
                  forceShowLabel={isMobile && sidebarOpen}
                  onNavigate={closeMobileMenu}
                />
                <NavItem
                  icon="📝"
                  label="Notas"
                  to={`/org/${organizationId}/notes`}
                  active={isActive(`/org/${organizationId}/notes`) || isActive(`/org/${organizationId}/project/`) && location.pathname.includes("notes")}
                  collapsed={effectiveCollapsed}
                  forceShowLabel={isMobile && sidebarOpen}
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
          ) : !loadingUsageType && isPersonalMode ? (
            <>
              {/* Modo Personal - Dashboard completo */}
              {!effectiveCollapsed && (
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
                  Navegación Principal
                </div>
              )}
              <NavItem
                icon="📊"
                label="Dashboard"
                to="/personal/dashboard"
                active={isActive("/personal/dashboard")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
              <NavItem
                icon="📁"
                label="Mis Proyectos"
                to="/personal/projects"
                active={isActive("/personal/projects")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
              <NavItem
                icon="🔔"
                label="Notificaciones"
                to="/personal/notifications"
                active={isActive("/personal/notifications")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
              <NavItem
                icon="📅"
                label="Cronograma"
                to="/personal/timeline"
                active={isActive("/personal/timeline")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
              <NavItem
                icon="📝"
                label="Notas"
                to="/personal/notes"
                active={isActive("/personal/notes")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
              <NavItem
                icon="📆"
                label="Calendario"
                to="/personal/calendar"
                active={isActive("/personal/calendar")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
            </>
          ) : !loadingUsageType && isTeamMode ? (
            <>
              {/* Modo Equipo */}
              <NavItem
                icon="👥"
                label="Equipos"
                to="/teams"
                active={isActive("/teams")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
            </>
          ) : !loadingUsageType && !isPersonalMode ? (
            <>
              {/* Modo Empresarial - Organizaciones */}
              <NavItem
                icon="🏢"
                label={t.organizations}
                to="/orgs"
                active={isActive("/orgs")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
              <NavItem
                icon="🔀"
                label={t.selectOrgLabel}
                to="/org-select"
                active={isActive("/org-select")}
                collapsed={effectiveCollapsed}
                forceShowLabel={isMobile && sidebarOpen}
                onNavigate={closeMobileMenu}
              />
            </>
          ) : null}

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
                <span>{t.changeOrg}</span>
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
  forceShowLabel?: boolean; // Nueva prop para forzar mostrar el label
};

function NavItem({ icon, label, to, active, collapsed, indent, onClick, onNavigate, forceShowLabel }: NavItemProps) {
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

  // Si forceShowLabel es true, siempre mostrar el label (para móvil cuando el menú está abierto)
  const shouldShowLabel = !collapsed || forceShowLabel;

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
        gap: forceShowLabel ? "14px" : "12px",
        padding: forceShowLabel ? "14px 16px" : "10px 12px",
        marginBottom: forceShowLabel ? "4px" : "6px",
        borderRadius: "10px",
        textDecoration: "none",
        color: active ? "var(--primary)" : "var(--text-primary)",
        backgroundColor: active ? "rgba(0, 123, 255, 0.1)" : "transparent",
        fontWeight: active ? 600 : 500,
        fontSize: forceShowLabel ? "16px" : "14px",
        transition: "all 0.2s",
        paddingLeft: indent ? (forceShowLabel ? "44px" : "36px") : (forceShowLabel ? "16px" : "12px"),
        justifyContent: collapsed && !forceShowLabel ? "center" : "flex-start",
        border: active ? "2px solid rgba(0, 123, 255, 0.3)" : "2px solid transparent",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        minHeight: forceShowLabel ? "52px" : "44px",
        wordBreak: "break-word",
        overflowWrap: "break-word",
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
      title={collapsed && !forceShowLabel ? label : undefined}
      className={forceShowLabel ? "mobile-nav-item-open" : ""}
    >
      <span style={{ 
        fontSize: forceShowLabel ? "22px" : "20px", 
        minWidth: forceShowLabel ? "28px" : "24px", 
        textAlign: "center", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        flexShrink: 0 
      }}>{icon}</span>
      {shouldShowLabel && (
        <span style={{ 
          whiteSpace: "normal", 
          overflow: "visible", 
          textOverflow: "clip",
          lineHeight: "1.4",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}>{label}</span>
      )}
    </Link>
  );
}
