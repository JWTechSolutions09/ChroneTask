import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import StatsCard from "../components/StatsCard";
import SearchBar from "../components/SearchBar";
import MiniChart from "../components/MiniChart";
import InvitationsModal from "../components/InvitationsModal";
import OrganizationMembersModal from "../components/OrganizationMembersModal";
import { useToast } from "../contexts/ToastContext";
import { useTerminology } from "../hooks/useTerminology";
import { useUserUsageType } from "../hooks/useUserUsageType";

type Project = {
  id: string;
  name: string;
  description?: string;
  template?: string;
  imageUrl?: string;
  taskCount: number;
  activeTaskCount: number;
  createdAt: string;
};

export default function Dashboard() {
  const { organizationId } = useParams<{ organizationId?: string }>();
  const location = useLocation();
  const { usageType } = useUserUsageType();
  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useTerminology();
  const [err, setErr] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const { showToast } = useToast();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadOrganizationInfo = useCallback(async () => {
    if (!organizationId || isPersonalMode || isPersonalRoute) return;
    try {
      const res = await http.get("/api/orgs");
      const orgs = res.data || [];
      const org = orgs.find((o: { id: string }) => o.id === organizationId);
      if (org) {
        setOrganizationName(org.name || "");
      }
    } catch (ex: any) {
      console.error(`Error cargando información de ${t.organizationLower}:`, ex);
    }
  }, [organizationId, isPersonalMode, isPersonalRoute, t]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      let projectsData: Project[] = [];
      
      if (isPersonalMode || isPersonalRoute) {
        // Cargar proyectos personales
        const res = await http.get("/api/users/me/projects");
        projectsData = res.data || [];
      } else if (organizationId) {
        // Cargar proyectos organizacionales
        const res = await http.get(`/api/orgs/${organizationId}/projects`);
        projectsData = res.data || [];
      } else {
        setLoading(false);
        return;
      }
      
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando proyectos";
      setErr(errorMsg);
      if (ex?.response?.status !== 401) {
        showToast(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId, isPersonalMode, isPersonalRoute, showToast]);

  useEffect(() => {
    if (isPersonalMode || isPersonalRoute || organizationId) {
      loadOrganizationInfo();
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, isPersonalMode, isPersonalRoute]); // Solo dependemos de organizationId para evitar loops

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  // En modo personal, no requerimos organizationId
  if (!isPersonalMode && !isPersonalRoute && !organizationId) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">Error: No se proporcionó ID de {t.organizationLower}</div>
        </div>
      </Layout>
    );
  }

  // Memoizar cálculos costosos
  const { totalTasks, activeTasks, completedTasks, completionRate, taskDistribution } = useMemo(() => {
    const total = projects.reduce((sum, p) => sum + p.taskCount, 0);
    const active = projects.reduce((sum, p) => sum + p.activeTaskCount, 0);
    const completed = total - active;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Distribución de tareas por proyecto para gráfico
    const distribution = projects.slice(0, 5).map(p => p.taskCount);
    
    return { 
      totalTasks: total, 
      activeTasks: active, 
      completedTasks: completed, 
      completionRate: rate,
      taskDistribution: distribution,
    };
  }, [projects]);

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Dashboard"
          subtitle={
            projects.length === 0
              ? "Comienza creando tu primer proyecto"
              : `${projects.length} ${projects.length === 1 ? "proyecto activo" : "proyectos activos"}`
          }
          breadcrumbs={
            isPersonalMode || isPersonalRoute
              ? [{ label: "Dashboard" }]
              : [
                  { label: t.organizations, to: "/org-select" },
                  { label: "Dashboard" },
                ]
          }
          actions={
            <div style={{ 
              display: "flex", 
              gap: "8px", 
              flexWrap: isMobile ? "nowrap" : "wrap",
              alignItems: "center",
            }}>
              {!isPersonalMode && !isPersonalRoute && organizationId && (
                <>
                  <button
                    onClick={() => setShowMembersModal(true)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: isMobile ? "12px" : "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 500,
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                    }}
                    title={t.viewOrganizationMembers}
                  >
                    👥 Miembros
                  </button>
                  <button
                    onClick={() => setShowInvitationsModal(true)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--primary)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--primary)",
                      cursor: "pointer",
                      fontSize: isMobile ? "12px" : "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 500,
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                    }}
                    title={t.inviteMembersToOrganization}
                  >
                    ✉️ Invitar
                  </button>
                </>
              )}
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                style={{
                  padding: isMobile ? "8px 10px" : "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: isMobile ? "12px" : "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                }}
              >
                {viewMode === "grid" ? "📋 Tabla" : "🔲 Grid"}
              </button>
              <Link 
                to={isPersonalMode || isPersonalRoute ? "/personal/projects" : `/org/${organizationId}/projects`}
                style={{ flexShrink: 0 }}
              >
                <Button 
                  variant="primary"
                  style={{
                    fontSize: isMobile ? "12px" : "15px",
                    padding: isMobile ? "8px 12px" : undefined,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isMobile ? "+ Nuevo" : "+ Nuevo Proyecto"}
                </Button>
              </Link>
            </div>
          }
        />

        <div style={{ padding: isMobile ? "12px" : "24px" }}>
          {err && <div className="alert alert-error">{err}</div>}

          {/* Metrics Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(240px, 1fr))",
              gap: isMobile ? "12px" : "20px",
              marginBottom: isMobile ? "20px" : "32px",
            }}
          >
            <StatsCard
              title="Proyectos"
              value={projects.length}
              subtitle="Total activos"
              icon="📁"
              color="#007bff"
            />
            <StatsCard
              title="Tareas Activas"
              value={activeTasks}
              subtitle="En progreso"
              icon="⚡"
              color="#ffc107"
            />
            <StatsCard
              title="Total Tareas"
              value={totalTasks}
              subtitle="En todos los proyectos"
              icon="📋"
              color="#6c757d"
            >
              {taskDistribution.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <MiniChart data={taskDistribution} color="#6c757d" height={30} />
                </div>
              )}
            </StatsCard>
            <StatsCard
              title="Completadas"
              value={`${completionRate}%`}
              subtitle={`${completedTasks} de ${totalTasks}`}
              icon="✅"
              color="#28a745"
              trend={
                completionRate > 0
                  ? {
                      value: completionRate,
                      isPositive: true,
                    }
                  : undefined
              }
            />
          </div>

          {/* Projects Section */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                Proyectos
              </h2>
            </div>

            {/* Search */}
            {projects.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <SearchBar
                  placeholder="Buscar proyectos por nombre o descripción..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  debounceMs={300}
                />
                {searchQuery && (
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>📊</span>
                    <span>
                      Mostrando <strong>{filteredProjects.length}</strong> de{" "}
                      <strong>{projects.length}</strong> proyectos
                    </span>
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="loading">Cargando proyectos...</div>
            ) : projects.length === 0 ? (
              <Card style={{ textAlign: "center", padding: "60px 40px" }}>
                <div className="empty-state-icon" style={{ fontSize: "64px", marginBottom: "20px" }}>
                  📁
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
                  No hay proyectos todavía
                </h3>
                <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                  Crea tu primer proyecto para comenzar a gestionar tareas y tiempo
                </p>
                <Link to={isPersonalMode || isPersonalRoute ? "/personal/projects" : `/org/${organizationId}/projects`}>
                  <Button
                    variant="primary"
                    style={{
                      marginTop: "16px",
                      padding: "12px 24px",
                      fontSize: "16px",
                      fontWeight: 600,
                    }}
                  >
                    + Crear Primer Proyecto
                  </Button>
                </Link>
              </Card>
            ) : viewMode === "table" ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e9ecef" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                        }}
                      >
                        Proyecto
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                        }}
                      >
                        Plantilla
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                        }}
                      >
                        Progreso
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                        }}
                      >
                        Tareas
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                        }}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => {
                      // Calcular progreso correctamente: completadas/total
                      const completedProjectTasks = project.taskCount - project.activeTaskCount;
                      const progress =
                        project.taskCount > 0
                          ? Math.round((completedProjectTasks / project.taskCount) * 100)
                          : 0;
                      return (
                        <tr
                          key={project.id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            <Link
                              to={
                                isPersonalMode || isPersonalRoute
                                  ? `/personal/project/${project.id}/board`
                                  : `/org/${organizationId}/project/${project.id}/board`
                              }
                              style={{
                                textDecoration: "none",
                                color: "var(--text-primary)",
                                fontWeight: 600,
                              }}
                            >
                              {project.name}
                            </Link>
                            {project.description && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-secondary)",
                                  marginTop: "4px",
                                }}
                              >
                                {project.description}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px" }}>
                            {project.template ? (
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  backgroundColor: "var(--bg-highlight)",
                                  color: "var(--primary)",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                }}
                              >
                                {project.template}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                              <div
                                style={{
                                  width: "100px",
                                  height: "8px",
                                  backgroundColor: "var(--bg-tertiary)",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${progress}%`,
                                    backgroundColor: "var(--primary)",
                                    transition: "width 0.3s",
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)", minWidth: "40px" }}>
                                {progress}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                              {project.activeTaskCount}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                              de {project.taskCount}
                            </div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <Link
                              to={
                                isPersonalMode || isPersonalRoute
                                  ? `/personal/project/${project.id}/board`
                                  : `/org/${organizationId}/project/${project.id}/board`
                              }
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                backgroundColor: "var(--primary)",
                                color: "var(--text-inverted)",
                                textDecoration: "none",
                                fontSize: "12px",
                                fontWeight: 500,
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--primary-dark)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--primary)";
                              }}
                            >
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: isMobile ? "12px" : "16px",
                }}
              >
                {filteredProjects.map((project) => {
                  // Calcular progreso correctamente: completadas/total
                  const completedProjectTasks = project.taskCount - project.activeTaskCount;
                  const progress =
                    project.taskCount > 0
                      ? Math.round((completedProjectTasks / project.taskCount) * 100)
                      : 0;
                  return (
                    <Link
                      key={project.id}
                      to={
                        isPersonalMode || isPersonalRoute
                          ? `/personal/project/${project.id}/board`
                          : `/org/${organizationId}/project/${project.id}/board`
                      }
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <Card hover style={{ overflow: "hidden" }}>
                        {project.imageUrl && (
                          <div
                            style={{
                              width: "100%",
                              height: "100px",
                              margin: "-20px -20px 16px -20px",
                              backgroundImage: `url(${project.imageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))",
                              }}
                            />
                          </div>
                        )}
                        <div style={{ marginBottom: "12px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "8px",
                            }}
                          >
                            <h3
                              style={{
                                fontSize: "16px",
                                fontWeight: 600,
                                margin: 0,
                                color: "var(--text-primary)",
                                flex: 1,
                              }}
                            >
                              {project.name}
                            </h3>
                            {project.template && (
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  backgroundColor: "var(--bg-highlight)",
                                  color: "var(--primary)",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                }}
                              >
                                {project.template}
                              </span>
                            )}
                          </div>
                          {project.description && (
                            <p
                              style={{
                                fontSize: "13px",
                                color: "var(--text-secondary)",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {project.description}
                            </p>
                          )}
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "4px",
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <span>Progreso</span>
                            <span>{progress}%</span>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              backgroundColor: "var(--bg-tertiary)",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${progress}%`,
                                backgroundColor: "var(--primary)",
                                transition: "width 0.3s",
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            paddingTop: "12px",
                            borderTop: "1px solid var(--border-color)",
                          }}
                        >
                          <span>
                            <strong style={{ color: "var(--text-primary)" }}>{project.activeTaskCount}</strong> activas
                          </span>
                          <span>
                            <strong style={{ color: "var(--text-primary)" }}>{project.taskCount}</strong> total
                          </span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal de Invitaciones */}
      {organizationId && showInvitationsModal && (
        <InvitationsModal
          organizationId={organizationId}
          organizationName={organizationName}
          isOpen={showInvitationsModal}
          onClose={() => setShowInvitationsModal(false)}
        />
      )}

      {/* Modal de Miembros */}
      {organizationId && showMembersModal && (
        <OrganizationMembersModal
          organizationId={organizationId}
          organizationName={organizationName}
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </Layout>
  );
}
