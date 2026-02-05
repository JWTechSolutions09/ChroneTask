import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation, Link, useParams } from "react-router-dom";
import { clearToken, isAuthed } from "../auth/token";
import { http } from "../api/http";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

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

  if (!isAuthed()) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarCollapsed ? "60px" : "260px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e9ecef",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo/Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e9ecef",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "64px",
          }}
        >
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "20px",
                  boxShadow: "0 2px 4px rgba(0, 123, 255, 0.3)",
                }}
              >
                ⏱️
              </div>
              <span style={{ fontWeight: 700, fontSize: "18px", color: "#212529", letterSpacing: "-0.5px" }}>
                ChroneTask
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "20px",
                boxShadow: "0 2px 4px rgba(0, 123, 255, 0.3)",
                margin: "0 auto",
              }}
            >
              ⏱️
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              color: "#6c757d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={sidebarCollapsed ? "Expandir" : "Colapsar"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
          {organizationId ? (
            <>
              {/* Organization Info */}
              {currentOrg && !sidebarCollapsed && (
                <div
                  style={{
                    padding: "12px",
                    marginBottom: "8px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "4px" }}>
                    Organización
                  </div>
                  <div style={{ fontWeight: 600, color: "#212529", fontSize: "14px" }}>
                    {currentOrg.name}
                  </div>
                </div>
              )}

              {/* Main Navigation */}
              <div style={{ marginBottom: "16px" }}>
                <NavItem
                  icon="📊"
                  label="Dashboard"
                  to={`/org/${organizationId}/dashboard`}
                  active={isActive(`/org/${organizationId}/dashboard`)}
                  collapsed={sidebarCollapsed}
                />
                <NavItem
                  icon="📁"
                  label="Proyectos"
                  to={`/org/${organizationId}/projects`}
                  active={isActive(`/org/${organizationId}/projects`)}
                  collapsed={sidebarCollapsed}
                />
              </div>

              {/* Projects List */}
              {!sidebarCollapsed && projects.length > 0 && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e9ecef" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#6c757d",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "8px 12px",
                      marginBottom: "4px",
                    }}
                  >
                    Proyectos
                  </div>
                  {projects.map((project) => (
                    <NavItem
                      key={project.id}
                      icon="📋"
                      label={project.name}
                      to={`/org/${organizationId}/project/${project.id}/board`}
                      active={params.projectId === project.id}
                      collapsed={false}
                      indent
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
                collapsed={sidebarCollapsed}
              />
              <NavItem
                icon="🔀"
                label="Seleccionar Org"
                to="/org-select"
                active={isActive("/org-select")}
                collapsed={sidebarCollapsed}
              />
            </>
          )}

          {/* Bottom Actions */}
          <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid #e9ecef" }}>
            {!sidebarCollapsed && (
              <button
                onClick={() => navigate("/org-select")}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  marginBottom: "8px",
                  background: "none",
                  border: "1px solid #e9ecef",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#495057",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>🔄</span>
                <span>Cambiar Org</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "none",
                border: "1px solid #e9ecef",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                color: "#dc3545",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
              }}
            >
              <span>🚪</span>
              {!sidebarCollapsed && <span>Salir</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
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
};

function NavItem({ icon, label, to, active, collapsed, indent }: NavItemProps) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 12px",
        marginBottom: "4px",
        borderRadius: "6px",
        textDecoration: "none",
        color: active ? "#007bff" : "#495057",
        backgroundColor: active ? "#e7f3ff" : "transparent",
        fontWeight: active ? 600 : 400,
        fontSize: "14px",
        transition: "all 0.2s",
        paddingLeft: indent ? "32px" : "12px",
        justifyContent: collapsed ? "center" : "flex-start",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "#f8f9fa";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
      title={collapsed ? label : undefined}
    >
      <span style={{ fontSize: "18px", minWidth: "20px", textAlign: "center" }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
