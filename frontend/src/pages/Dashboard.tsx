import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
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
  const { organizationId } = useParams<{ organizationId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const { showToast } = useToast();

  const loadOrganizationInfo = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await http.get("/api/orgs");
      const orgs = res.data || [];
      const org = orgs.find((o: { id: string }) => o.id === organizationId);
      if (org) {
        setOrganizationName(org.name || "");
      }
    } catch (ex: any) {
      console.error("Error cargando información de organización:", ex);
    }
  }, [organizationId]);

  const loadProjects = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects`);
      const projectsData = res.data || [];
      setProjects(projectsData);
      setFilteredProjects(projectsData);
      // Remover toast automático para evitar spam
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando proyectos";
      setErr(errorMsg);
      // Solo mostrar toast si es un error real, no si es redirección
      if (ex?.response?.status !== 401) {
        showToast(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId, showToast]);

  useEffect(() => {
    if (organizationId) {
      loadOrganizationInfo();
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]); // Solo dependemos de organizationId para evitar loops

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

  if (!organizationId) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">Error: No se proporcionó ID de organización</div>
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
    <Layout organizationId={organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Dashboard"
          subtitle={
            projects.length === 0
              ? "Comienza creando tu primer proyecto"
              : `${projects.length} ${projects.length === 1 ? "proyecto activo" : "proyectos activos"}`
          }
          breadcrumbs={[
            { label: "Organizaciones", to: "/org-select" },
            { label: "Dashboard" },
          ]}
          actions={
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowMembersModal(true)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #6c757d",
                  backgroundColor: "white",
                  color: "#6c757d",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
                title="Ver miembros de la organización"
              >
                👥 Miembros
              </button>
              <button
                onClick={() => setShowInvitationsModal(true)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #007bff",
                  backgroundColor: "white",
                  color: "#007bff",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e7f3ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
                title="Invitar miembros a la organización"
              >
                ✉️ Invitar
              </button>
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #dee2e6",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {viewMode === "grid" ? "📋 Tabla" : "🔲 Grid"}
              </button>
              <Link to={`/org/${organizationId}/projects`}>
                <Button variant="primary">+ Nuevo Proyecto</Button>
              </Link>
            </div>
          }
        />

        <div style={{ padding: "24px" }}>
          {err && <div className="alert alert-error">{err}</div>}

          {/* Metrics Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "32px",
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
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#212529" }}>
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
                      color: "#6c757d",
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
                <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#212529", marginBottom: "12px" }}>
                  No hay proyectos todavía
                </h3>
                <p style={{ fontSize: "16px", color: "#6c757d", marginBottom: "24px" }}>
                  Crea tu primer proyecto para comenzar a gestionar tareas y tiempo
                </p>
                <Link to={`/org/${organizationId}/projects`}>
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
                          color: "#6c757d",
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
                          color: "#6c757d",
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
                          color: "#6c757d",
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
                          color: "#6c757d",
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
                          color: "#6c757d",
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
                            borderBottom: "1px solid #e9ecef",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            <Link
                              to={`/org/${organizationId}/project/${project.id}/board`}
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
                                  backgroundColor: "#e7f3ff",
                                  color: "#007bff",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                }}
                              >
                                {project.template}
                              </span>
                            ) : (
                              <span style={{ color: "#adb5bd", fontSize: "12px" }}>—</span>
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
                                    backgroundColor: "#007bff",
                                    transition: "width 0.3s",
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: "12px", color: "#6c757d", minWidth: "40px" }}>
                                {progress}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#212529" }}>
                              {project.activeTaskCount}
                            </div>
                            <div style={{ fontSize: "11px", color: "#6c757d" }}>
                              de {project.taskCount}
                            </div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <Link
                              to={`/org/${organizationId}/project/${project.id}/board`}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                backgroundColor: "#007bff",
                                color: "white",
                                textDecoration: "none",
                                fontSize: "12px",
                                fontWeight: 500,
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
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
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
                      to={`/org/${organizationId}/project/${project.id}/board`}
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
                                  backgroundColor: "#e7f3ff",
                                  color: "#007bff",
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
                              color: "#6c757d",
                            }}
                          >
                            <span>Progreso</span>
                            <span>{progress}%</span>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              backgroundColor: "#e9ecef",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${progress}%`,
                                backgroundColor: "#007bff",
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
                            color: "#6c757d",
                            paddingTop: "12px",
                            borderTop: "1px solid #e9ecef",
                          }}
                        >
                          <span>
                            <strong style={{ color: "#212529" }}>{project.activeTaskCount}</strong> activas
                          </span>
                          <span>
                            <strong style={{ color: "#212529" }}>{project.taskCount}</strong> total
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
