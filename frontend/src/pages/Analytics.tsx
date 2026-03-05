import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import DonutChart from "../components/DonutChart";
import BarChart from "../components/BarChart";
import LineChart from "../components/LineChart";
import { useToast } from "../contexts/ToastContext";
import { useTerminology } from "../hooks/useTerminology";
import { useUserUsageType } from "../hooks/useUserUsageType";

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
  const { organizationId } = useParams<{ organizationId?: string }>();
  const location = useLocation();
  const { usageType } = useUserUsageType();
  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const { showToast } = useToast();
  const t = useTerminology();

  const loadAnalytics = useCallback(async () => {
    if (!organizationId && !isPersonalMode && !isPersonalRoute) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProjectId) params.append("projectId", selectedProjectId);
      if (selectedMemberId) params.append("memberId", selectedMemberId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      // Para proyectos personales, usar endpoint diferente si existe
      const endpoint = isPersonalMode || isPersonalRoute 
        ? `/api/users/me/analytics?${params.toString()}`
        : `/api/orgs/${organizationId}/analytics?${params.toString()}`;
      
      try {
        const res = await http.get(endpoint);
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
      } catch (endpointError: any) {
        // Si el endpoint no existe (404), usar datos vacíos sin mostrar error
        if (endpointError?.response?.status === 404) {
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
        } else {
          throw endpointError;
        }
      }
    } catch (ex: any) {
      console.error("Error loading analytics:", ex);
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando analíticas";
      // Solo mostrar error si no es 404 (endpoint no existe)
      if (ex?.response?.status !== 404) {
        showToast(errorMsg, "error");
      }
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
  }, [organizationId, selectedProjectId, selectedMemberId, startDate, endDate, showToast, isPersonalMode, isPersonalRoute]);

  const loadProjects = useCallback(async () => {
    try {
      let projectsData: any[] = [];
      if (isPersonalMode || isPersonalRoute) {
        const res = await http.get("/api/users/me/projects");
        projectsData = res.data || [];
      } else if (organizationId) {
        const res = await http.get(`/api/orgs/${organizationId}/projects`);
        projectsData = res.data || [];
      }
      setProjects(projectsData);
    } catch (ex: any) {
      // Silently fail
    }
  }, [organizationId, isPersonalMode, isPersonalRoute]);

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

  // En modo personal, no requerimos organizationId
  if (!isPersonalMode && !isPersonalRoute && !organizationId) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">Error: Falta Organization ID</div>
        </div>
      </Layout>
    );
  }

  // Calcular métricas adicionales para gráficos
  const taskStatusData = useMemo(() => {
    if (!analytics) return [];
    return [
      { label: "Completadas", value: analytics.completedTasks, color: "#28a745" },
      { label: "Pendientes", value: analytics.pendingTasks, color: "#ffc107" },
      { label: "Vencidas", value: analytics.overdueTasks, color: "#dc3545" },
    ].filter((item) => item.value > 0);
  }, [analytics]);

  const slaData = useMemo(() => {
    if (!analytics) return [];
    return [
      { label: "Cumplidos", value: analytics.slaMet, color: "#28a745" },
      { label: "Incumplidos", value: analytics.slaMissed, color: "#dc3545" },
    ].filter((item) => item.value > 0);
  }, [analytics]);

  const memberActivityData = useMemo(() => {
    if (!analytics || analytics.memberActivities.length === 0) return [];
    return analytics.memberActivities.slice(0, 5).map((member) => ({
      label: member.userName,
      value: member.completedTasks,
      color: "#007bff",
    }));
  }, [analytics]);

  const completionRate = useMemo(() => {
    if (!analytics || analytics.totalTasks === 0) return 0;
    return Math.round((analytics.completedTasks / analytics.totalTasks) * 100);
  }, [analytics]);

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Resumen y Analíticas"
          subtitle="Estadísticas y métricas de rendimiento"
          breadcrumbs={
            isPersonalMode || isPersonalRoute
              ? [{ label: "Dashboard", to: "/personal/dashboard" }, { label: "Resumen" }]
              : [
                  { label: t.organizations, to: "/org-select" },
                  { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
                  { label: "Resumen" },
                ]
          }
          actions={
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%" }}>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  flex: "1 1 auto",
                  minWidth: "150px",
                  maxWidth: "100%",
                  fontSize: "14px",
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
                  flex: "1 1 auto",
                  minWidth: "140px",
                  maxWidth: "100%",
                  fontSize: "14px",
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
                  flex: "1 1 auto",
                  minWidth: "140px",
                  maxWidth: "100%",
                  fontSize: "14px",
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
              {/* Summary Cards - Mejoradas */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                <Card
                  style={{
                    padding: "24px",
                    background: "linear-gradient(135deg, #007bff15 0%, #007bff05 100%)",
                    border: "1px solid #007bff30",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        Total Tareas
                      </div>
                      <div style={{ fontSize: "36px", fontWeight: 700, color: "#007bff", lineHeight: 1.2 }}>
                        {analytics.totalTasks}
                      </div>
                    </div>
                    <div style={{ fontSize: "32px", opacity: 0.2 }}>📋</div>
                  </div>
                </Card>
                <Card
                  style={{
                    padding: "24px",
                    background: "linear-gradient(135deg, #28a74515 0%, #28a74505 100%)",
                    border: "1px solid #28a74530",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        Completadas
                      </div>
                      <div style={{ fontSize: "36px", fontWeight: 700, color: "#28a745", lineHeight: 1.2 }}>
                        {analytics.completedTasks}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {completionRate}% del total
                      </div>
                    </div>
                    <div style={{ fontSize: "32px", opacity: 0.2 }}>✅</div>
                  </div>
                </Card>
                <Card
                  style={{
                    padding: "24px",
                    background: "linear-gradient(135deg, #ffc10715 0%, #ffc10705 100%)",
                    border: "1px solid #ffc10730",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        Pendientes
                      </div>
                      <div style={{ fontSize: "36px", fontWeight: 700, color: "#ffc107", lineHeight: 1.2 }}>
                        {analytics.pendingTasks}
                      </div>
                    </div>
                    <div style={{ fontSize: "32px", opacity: 0.2 }}>⏳</div>
                  </div>
                </Card>
                <Card
                  style={{
                    padding: "24px",
                    background: "linear-gradient(135deg, #dc354515 0%, #dc354505 100%)",
                    border: "1px solid #dc354530",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        Vencidas
                      </div>
                      <div style={{ fontSize: "36px", fontWeight: 700, color: "#dc3545", lineHeight: 1.2 }}>
                        {analytics.overdueTasks}
                      </div>
                    </div>
                    <div style={{ fontSize: "32px", opacity: 0.2 }}>⚠️</div>
                  </div>
                </Card>
                <Card
                  style={{
                    padding: "24px",
                    background: "linear-gradient(135deg, #28a74515 0%, #28a74505 100%)",
                    border: "1px solid #28a74530",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        SLA Cumplidos
                      </div>
                      <div style={{ fontSize: "36px", fontWeight: 700, color: "#28a745", lineHeight: 1.2 }}>
                        {analytics.slaMet}
                      </div>
                    </div>
                    <div style={{ fontSize: "32px", opacity: 0.2 }}>🎯</div>
                  </div>
                </Card>
                <Card
                  style={{
                    padding: "24px",
                    background: "linear-gradient(135deg, #dc354515 0%, #dc354505 100%)",
                    border: "1px solid #dc354530",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        SLA Incumplidos
                      </div>
                      <div style={{ fontSize: "36px", fontWeight: 700, color: "#dc3545", lineHeight: 1.2 }}>
                        {analytics.slaMissed}
                      </div>
                    </div>
                    <div style={{ fontSize: "32px", opacity: 0.2 }}>❌</div>
                  </div>
                </Card>
              </div>

              {/* Gráficos principales */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "24px" }}>
                {/* Gráfico de estado de tareas */}
                {taskStatusData.length > 0 && (
                  <Card style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Estado de Tareas
                    </h3>
                    <DonutChart data={taskStatusData} size={200} showLabels={true} showLegend={true} />
                  </Card>
                )}

                {/* Gráfico de SLA */}
                {slaData.length > 0 && (
                  <Card style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Cumplimiento de SLA
                    </h3>
                    <DonutChart data={slaData} size={200} showLabels={true} showLegend={true} />
                  </Card>
                )}

                {/* Gráfico de actividad de miembros */}
                {memberActivityData.length > 0 && (
                  <Card style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Top Miembros por Tareas Completadas
                    </h3>
                    <BarChart data={memberActivityData} height={200} horizontal={true} showValues={true} />
                  </Card>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
                {/* Member Activities - Mejorado */}
                <Card style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>👥</span>
                    <span>Miembros Más Activos</span>
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

                {/* Projects with Blockages - Mejorado */}
                <Card style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🚫</span>
                    <span>Proyectos con Bloqueos</span>
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
                          to={
                            isPersonalMode || isPersonalRoute
                              ? `/personal/project/${project.projectId}/board`
                              : `/org/${organizationId}/project/${project.projectId}/board`
                          }
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

                {/* Tasks Due Soon - Mejorado */}
                <Card style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>⏰</span>
                    <span>Tareas por Vencer</span>
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
                          to={
                            isPersonalMode || isPersonalRoute
                              ? `/personal/project/${task.projectId}/board`
                              : `/org/${organizationId}/project/${task.projectId}/board`
                          }
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

                {/* Inactive Members - Mejorado */}
                {analytics.inactiveMembers.length > 0 && (
                  <Card style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>😴</span>
                      <span>Miembros Inactivos</span>
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
