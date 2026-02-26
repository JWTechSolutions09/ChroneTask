import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";

type Analytics = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  slaMet: number;
  slaMissed: number;
  memberActivities: MemberActivity[];
  projectsWithBlockages: ProjectBlocked[];
  tasksDueSoon: TaskDueSoon[];
  inactiveMembers: MemberInactivity[];
};

type MemberActivity = {
  userId: string;
  userName: string;
  userAvatar?: string;
  completedTasks: number;
  pendingTasks: number;
  totalMinutes: number;
};

type ProjectBlocked = {
  projectId: string;
  projectName: string;
  blockedTasksCount: number;
};

type TaskDueSoon = {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  dueDate?: string;
  hoursUntilDue: number;
};

type MemberInactivity = {
  userId: string;
  userName: string;
  userAvatar?: string;
  daysSinceLastActivity: number;
};

export default function Analytics() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const { showToast } = useToast();

  const loadAnalytics = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProjectId) params.append("projectId", selectedProjectId);
      if (selectedMemberId) params.append("memberId", selectedMemberId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await http.get(`/api/orgs/${organizationId}/analytics?${params.toString()}`);
      if (res.data) {
        setAnalytics(res.data);
      } else {
        setAnalytics({
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          slaMet: 0,
          slaMissed: 0,
          memberActivities: [],
          projectsWithBlockages: [],
          tasksDueSoon: [],
          inactiveMembers: [],
        });
      }
    } catch (ex: any) {
      console.error("Error loading analytics:", ex);
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando analíticas";
      showToast(errorMsg, "error");
      // Set empty analytics on error
      setAnalytics({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        slaMet: 0,
        slaMissed: 0,
        memberActivities: [],
        projectsWithBlockages: [],
        tasksDueSoon: [],
        inactiveMembers: [],
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, selectedProjectId, selectedMemberId, startDate, endDate, showToast]);

  const loadProjects = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects`);
      setProjects(res.data || []);
    } catch (ex: any) {
      // Silently fail
    }
  }, [organizationId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!organizationId) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">Error: Falta Organization ID</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout organizationId={organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Resumen y Analíticas"
          subtitle="Estadísticas organizacionales y métricas de rendimiento"
          breadcrumbs={[
            { label: "Organizaciones", to: "/org-select" },
            { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
            { label: "Resumen" },
          ]}
          actions={
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">Todos los proyectos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Fecha inicio"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Fecha fin"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          }
        />

        <div style={{ padding: "24px" }}>
          {loading ? (
            <div className="loading">Cargando analíticas...</div>
          ) : analytics === null ? (
            <div className="alert alert-error">No se pudieron cargar las analíticas. Por favor, intenta de nuevo.</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <Card style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                    {analytics.totalTasks}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Total Tareas</div>
                </Card>
                <Card style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#28a745", marginBottom: "8px" }}>
                    {analytics.completedTasks}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Completadas</div>
                </Card>
                <Card style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#ffc107", marginBottom: "8px" }}>
                    {analytics.pendingTasks}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Pendientes</div>
                </Card>
                <Card style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#dc3545", marginBottom: "8px" }}>
                    {analytics.overdueTasks}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Vencidas</div>
                </Card>
                <Card style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#28a745", marginBottom: "8px" }}>
                    {analytics.slaMet}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>SLA Cumplidos</div>
                </Card>
                <Card style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#dc3545", marginBottom: "8px" }}>
                    {analytics.slaMissed}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>SLA Incumplidos</div>
                </Card>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
                {/* Member Activities */}
                <Card style={{ padding: "20px" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Miembros Más Activos
                  </h3>
                  {analytics.memberActivities.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                      No hay datos disponibles
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {analytics.memberActivities.slice(0, 10).map((member) => (
                        <div key={member.userId} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "var(--bg-tertiary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {member.userAvatar ? (
                              <img
                                src={member.userAvatar}
                                alt={member.userName}
                                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                              />
                            ) : (
                              member.userName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                              {member.userName}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {member.completedTasks} completadas • {member.pendingTasks} pendientes • {formatHours(member.totalMinutes)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Projects with Blockages */}
                <Card style={{ padding: "20px" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Proyectos con Bloqueos
                  </h3>
                  {analytics.projectsWithBlockages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                      No hay proyectos con bloqueos
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {analytics.projectsWithBlockages.map((project) => (
                        <Link
                          key={project.projectId}
                          to={`/org/${organizationId}/project/${project.projectId}/board`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <div
                            style={{
                              padding: "12px",
                              backgroundColor: "var(--bg-secondary)",
                              borderRadius: "8px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{project.projectName}</span>
                            <span style={{ fontSize: "14px", color: "#dc3545", fontWeight: 600 }}>
                              {project.blockedTasksCount} bloqueadas
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Tasks Due Soon */}
                <Card style={{ padding: "20px" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Mis Tareas por Vencer
                  </h3>
                  {analytics.tasksDueSoon.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                      No hay tareas por vencer
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {analytics.tasksDueSoon.slice(0, 10).map((task) => (
                        <Link
                          key={task.taskId}
                          to={`/org/${organizationId}/project/${task.projectId}/board`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <div
                            style={{
                              padding: "12px",
                              backgroundColor: "var(--bg-secondary)",
                              borderRadius: "8px",
                            }}
                          >
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                              {task.taskTitle}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                              📁 {task.projectName}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: task.hoursUntilDue < 24 ? "#dc3545" : "#ffc107",
                                fontWeight: 600,
                              }}
                            >
                              ⏰ {task.hoursUntilDue}h restantes
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Inactive Members */}
                {analytics.inactiveMembers.length > 0 && (
                  <Card style={{ padding: "20px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Miembros Inactivos
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {analytics.inactiveMembers.slice(0, 10).map((member) => (
                        <div key={member.userId} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "var(--bg-tertiary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {member.userAvatar ? (
                              <img
                                src={member.userAvatar}
                                alt={member.userName}
                                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                              />
                            ) : (
                              member.userName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                              {member.userName}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                              {member.daysSinceLastActivity === 999
                                ? "Sin actividad registrada"
                                : `${member.daysSinceLastActivity} días sin actividad`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
