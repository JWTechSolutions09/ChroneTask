import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";
import { useTerminology } from "../hooks/useTerminology";
import { useUserUsageType } from "../hooks/useUserUsageType";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  assignedToName?: string;
  projectId: string;
  projectName?: string;
};

type TimelineView = "week" | "month";

export default function Timeline() {
  const { organizationId, projectId } = useParams<{ organizationId?: string; projectId?: string }>();
  const location = useLocation();
  const { usageType } = useUserUsageType();
  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;
  const [tasks, setTasks] = useState<Task[]>([]);
  const t = useTerminology();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<TimelineView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const loadProjects = useCallback(async () => {
    if (isPersonalMode || isPersonalRoute) {
      try {
        const res = await http.get("/api/users/me/projects");
        setProjects(res.data || []);
      } catch (ex: any) {
        // Silently fail
      }
      return;
    }
    if (!organizationId) return;
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects`);
      setProjects(res.data || []);
    } catch (ex: any) {
      // Silently fail
    }
  }, [organizationId, isPersonalMode, isPersonalRoute]);

  const loadTasks = useCallback(async () => {
    if (isPersonalMode || isPersonalRoute) {
      setLoading(true);
      try {
        let allTasks: Task[] = [];
        const res = await http.get("/api/users/me/projects");
        const personalProjects = res.data || [];
        
        for (const project of personalProjects) {
          try {
            const tasksRes = await http.get(`/api/projects/${project.id}/tasks`);
            const projectTasks = (tasksRes.data || []).map((t: any) => ({
              ...t,
              projectId: project.id,
              projectName: project.name,
            }));
            allTasks = [...allTasks, ...projectTasks];
          } catch (ex: any) {
            // Silently fail for individual projects
          }
        }
        
        setTasks(allTasks);
      } catch (ex: any) {
        showToast("Error cargando tareas", "error");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!organizationId) return;
    setLoading(true);
    try {
      let allTasks: Task[] = [];
      
      if (projectId) {
        // Load tasks from specific project
        const res = await http.get(`/api/projects/${projectId}/tasks`);
        const tasksData = res.data || [];
        allTasks = tasksData.map((t: any) => ({
          ...t,
          projectId,
          projectName: projects.find((p) => p.id === projectId)?.name,
        }));
      } else {
        // Load tasks from all projects
        const projectIds = projects.map((p) => p.id);
        for (const pid of projectIds) {
          try {
            const res = await http.get(`/api/projects/${pid}/tasks`);
            const tasksData = res.data || [];
            allTasks.push(
              ...tasksData.map((t: any) => ({
                ...t,
                projectId: pid,
                projectName: projects.find((p) => p.id === pid)?.name,
              }))
            );
          } catch (ex: any) {
            // Skip projects we can't access
          }
        }
      }

      // Filter tasks with dates (but show all if none have dates)
      const tasksWithDates = allTasks.filter((t) => t.startDate || t.dueDate);
      setTasks(tasksWithDates.length > 0 ? tasksWithDates : allTasks);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando tareas";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, projects, showToast, isPersonalMode, isPersonalRoute]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length > 0) {
      loadTasks();
    }
  }, [loadTasks, projects]);

  const getDaysInView = () => {
    if (view === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
      }
      return days;
    } else {
      // Month view
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
      return days;
    }
  };

  // Determinar el estado de una tarea basado en su fecha límite
  const getTaskUrgencyStatus = useCallback((task: Task) => {
    if (task.status === "Done") return "completed";
    if (!task.dueDate) return "normal";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "due-today";
    if (diffDays <= 2) return "due-soon";
    return "normal";
  }, []);

  // Obtener color y estilo según el estado de urgencia
  const getTaskStyle = useCallback((task: Task) => {
    const urgencyStatus = getTaskUrgencyStatus(task);
    
    const styles = {
      overdue: {
        backgroundColor: "#dc3545",
        color: "white",
        borderLeft: "4px solid #a0283a",
        boxShadow: "0 4px 8px rgba(220, 53, 69, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        fontWeight: 700,
        icon: "⚠️",
      },
      "due-today": {
        backgroundColor: "#ffc107",
        color: "#212529",
        borderLeft: "4px solid #ff9800",
        boxShadow: "0 4px 8px rgba(255, 193, 7, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        fontWeight: 700,
        icon: "🔥",
      },
      "due-soon": {
        backgroundColor: "#ff9800",
        color: "white",
        borderLeft: "4px solid #f57c00",
        boxShadow: "0 3px 6px rgba(255, 152, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        fontWeight: 600,
        icon: "⏰",
      },
      completed: {
        backgroundColor: "#28a745",
        color: "white",
        borderLeft: "4px solid #1e7e34",
        boxShadow: "0 2px 4px rgba(40, 167, 69, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        fontWeight: 500,
        opacity: 0.85,
        icon: "✅",
      },
      normal: {
        backgroundColor: "#007bff",
        color: "white",
        borderLeft: "4px solid #0056b3",
        boxShadow: "0 2px 4px rgba(0, 123, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        fontWeight: 500,
        icon: "📋",
      },
    };
    
    return styles[urgencyStatus] || styles.normal;
  }, [getTaskUrgencyStatus]);

  const getTasksForDate = useCallback((date: Date) => {
    return tasks.filter((task) => {
      // Priorizar dueDate sobre startDate
      const taskDue = task.dueDate ? new Date(task.dueDate) : null;
      const taskStart = task.startDate ? new Date(task.startDate) : null;
      const dateStr = date.toISOString().split("T")[0];

      // Si hay dueDate, usar ese como referencia principal
      if (taskDue) {
        const dueStr = taskDue.toISOString().split("T")[0];
        // Si también hay startDate, mostrar en el rango
        if (taskStart) {
          const startStr = taskStart.toISOString().split("T")[0];
          return dateStr >= startStr && dateStr <= dueStr;
        }
        // Solo dueDate, mostrar solo en ese día
        return dateStr === dueStr;
      }
      // Si no hay dueDate, usar startDate
      if (taskStart) {
        return dateStr === taskStart.toISOString().split("T")[0];
      }
      return false;
    });
  }, [tasks]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
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

  const days = useMemo(() => getDaysInView(), [view, currentDate]);
  const viewTitle = useMemo(() => {
    return view === "week" 
      ? `Semana del ${formatDate(days[0])}`
      : currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }, [view, days, currentDate]);

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Cronograma"
          subtitle={viewTitle}
          breadcrumbs={
            isPersonalMode || isPersonalRoute
              ? [{ label: "Dashboard", to: "/personal/dashboard" }, { label: "Cronograma" }]
              : [
                  { label: t.organizations, to: "/org-select" },
                  { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
                  { label: "Cronograma" },
                ]
          }
          actions={
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                value={projectId || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    const path = isPersonalMode || isPersonalRoute
                      ? `/personal/project/${e.target.value}/timeline`
                      : `/org/${organizationId}/project/${e.target.value}/timeline`;
                    window.location.href = path;
                  } else {
                    const path = isPersonalMode || isPersonalRoute
                      ? `/personal/timeline`
                      : `/org/${organizationId}/timeline`;
                    window.location.href = path;
                  }
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  minWidth: "120px",
                  flex: "1 1 auto",
                }}
              >
                <option value="">Todos los proyectos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() => navigateDate("prev")}
                style={{ flex: "1 1 auto", minWidth: "80px" }}
              >
                ← Anterior
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCurrentDate(new Date())}
                style={{ flex: "1 1 auto", minWidth: "60px" }}
              >
                Hoy
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigateDate("next")}
                style={{ flex: "1 1 auto", minWidth: "80px" }}
              >
                Siguiente →
              </Button>
              <Button
                variant={view === "week" ? "primary" : "secondary"}
                onClick={() => setView("week")}
                style={{ flex: "1 1 auto", minWidth: "80px" }}
              >
                Semana
              </Button>
              <Button
                variant={view === "month" ? "primary" : "secondary"}
                onClick={() => setView("month")}
                style={{ flex: "1 1 auto", minWidth: "80px" }}
              >
                Mes
              </Button>
            </div>
          }
        />

        <div style={{ 
          padding: isMobile ? "12px" : "24px",
          boxSizing: "border-box",
        }} className="timeline-container">
          {loading ? (
            <div className="loading">Cargando cronograma...</div>
          ) : isMobile ? (
            /* Vista de lista para móvil */
            <div style={{ width: "100%" }}>
              {tasks.filter(t => t.status !== "Done").length === 0 ? (
                <Card style={{ padding: "40px", textAlign: "center" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
                    No hay tareas pendientes
                  </div>
                </Card>
              ) : (
                tasks
                  .filter(t => t.status !== "Done")
                  .sort((a, b) => {
                    // Ordenar por fecha de vencimiento (las más urgentes primero)
                    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    return aDue - bDue;
                  })
                  .map((task) => {
                    const taskStyle = getTaskStyle(task);
                    const urgencyStatus = getTaskUrgencyStatus(task);
                    const taskDue = task.dueDate ? new Date(task.dueDate) : null;
                    const taskStart = task.startDate ? new Date(task.startDate) : null;
                    
                    return (
                      <Card
                        key={task.id}
                        style={{
                          marginBottom: "16px",
                          padding: "16px",
                          borderLeft: `4px solid ${taskStyle.borderLeft?.replace("4px solid ", "") || "#007bff"}`,
                          backgroundColor: "var(--bg-primary)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => {
                          const projectPath = isPersonalMode || isPersonalRoute
                            ? `/personal/project/${task.projectId}/board`
                            : `/org/${organizationId}/project/${task.projectId}/board`;
                          window.location.href = projectPath;
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                          <span style={{ fontSize: "20px" }}>{taskStyle.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              color: "var(--text-primary)", 
                              fontSize: "16px",
                              marginBottom: "4px",
                            }}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div style={{ 
                                fontSize: "14px", 
                                color: "var(--text-secondary)",
                                marginTop: "8px",
                                lineHeight: "1.5",
                              }}>
                                {task.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "8px",
                          paddingTop: "12px",
                          borderTop: "1px solid var(--border-color)",
                        }}>
                          {task.projectName && (
                            <div style={{ 
                              fontSize: "13px", 
                              color: "var(--text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}>
                              <span>📁</span>
                              <span>{task.projectName}</span>
                            </div>
                          )}
                          
                          {task.assignedToName && (
                            <div style={{ 
                              fontSize: "13px", 
                              color: "var(--text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}>
                              <span>👤</span>
                              <span>{task.assignedToName}</span>
                            </div>
                          )}
                          
                          {taskDue && (
                            <div style={{ 
                              fontSize: "13px",
                              color: urgencyStatus === "overdue" ? "#dc3545" : 
                                     urgencyStatus === "due-today" ? "#ffc107" : 
                                     "var(--text-secondary)",
                              fontWeight: urgencyStatus === "overdue" || urgencyStatus === "due-today" ? 600 : 400,
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}>
                              <span>📅</span>
                              <span>Vence: {taskDue.toLocaleDateString("es-ES", { 
                                weekday: "short",
                                day: "numeric", 
                                month: "short",
                                year: "numeric"
                              })}</span>
                            </div>
                          )}
                          
                          {!taskDue && taskStart && (
                            <div style={{ 
                              fontSize: "13px",
                              color: "var(--text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}>
                              <span>📅</span>
                              <span>Inicio: {taskStart.toLocaleDateString("es-ES", { 
                                weekday: "short",
                                day: "numeric", 
                                month: "short",
                                year: "numeric"
                              })}</span>
                            </div>
                          )}
                          
                          <div style={{ 
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}>
                            <span>📊</span>
                            <span>Estado: {task.status}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })
              )}
            </div>
          ) : (
            <Card style={{ overflowX: "auto", width: "100%", padding: 0 }}>
              <div style={{ 
                display: "flex", 
                minWidth: "100%",
                borderBottom: "2px solid var(--border-color)",
              }}>
                {/* Day Headers - Mejorados */}
                <div style={{ 
                  minWidth: "220px", 
                  borderRight: "2px solid var(--border-color)", 
                  padding: "14px",
                  backgroundColor: "var(--bg-tertiary)",
                  position: "sticky",
                  left: 0,
                  zIndex: 20,
                  boxShadow: "2px 0 4px rgba(0, 0, 0, 0.05)",
                }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Tarea
                  </div>
                </div>
                {days.map((day, idx) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const tasksForDay = getTasksForDate(day);
                  const hasOverdue = tasksForDay.some(t => getTaskUrgencyStatus(t) === "overdue");
                  const hasDueToday = tasksForDay.some(t => getTaskUrgencyStatus(t) === "due-today");
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        minWidth: view === "week" ? "150px" : "80px",
                        borderRight: idx < days.length - 1 ? "1px solid var(--border-color)" : "none",
                        padding: "12px",
                        textAlign: "center",
                        backgroundColor: isToday 
                          ? "var(--bg-highlight)" 
                          : hasOverdue 
                          ? "rgba(220, 53, 69, 0.05)"
                          : hasDueToday
                          ? "rgba(255, 193, 7, 0.05)"
                          : "var(--bg-tertiary)",
                        borderTop: isToday ? "3px solid var(--primary)" : "none",
                        position: "relative",
                      }}
                    >
                      <div style={{ 
                        fontWeight: isToday ? 700 : 600, 
                        color: isToday ? "var(--primary)" : "var(--text-primary)", 
                        fontSize: "13px",
                        marginBottom: "4px",
                      }}>
                        {formatDate(day)}
                      </div>
                      {tasksForDay.length > 0 && (
                        <div style={{
                          fontSize: "10px",
                          color: hasOverdue ? "#dc3545" : hasDueToday ? "#ffc107" : "var(--text-secondary)",
                          fontWeight: hasOverdue || hasDueToday ? 600 : 400,
                          backgroundColor: hasOverdue ? "rgba(220, 53, 69, 0.1)" : hasDueToday ? "rgba(255, 193, 7, 0.1)" : "var(--bg-secondary)",
                          borderRadius: "10px",
                          padding: "2px 6px",
                          display: "inline-block",
                        }}>
                          {tasksForDay.length} {tasksForDay.length > 1 ? "tareas" : "tarea"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Task Rows */}
              {tasks.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                  No hay tareas con fechas asignadas
                </div>
              ) : (
                tasks.map((task) => {
                  // Priorizar dueDate sobre startDate
                  const taskDue = task.dueDate ? new Date(task.dueDate) : null;
                  const taskStart = task.startDate ? new Date(task.startDate) : null;
                  
                  // Si hay dueDate, usarlo como fecha final; si no, usar startDate como única fecha
                  let startIdx = -1;
                  let endIdx = -1;
                  
                  if (taskDue && taskStart) {
                    // Rango: desde startDate hasta dueDate
                    startIdx = days.findIndex((d) => d.toDateString() === taskStart.toDateString());
                    endIdx = days.findIndex((d) => d.toDateString() === taskDue.toDateString());
                  } else if (taskDue) {
                    // Solo dueDate: mostrar solo en ese día
                    endIdx = days.findIndex((d) => d.toDateString() === taskDue.toDateString());
                    startIdx = endIdx;
                  } else if (taskStart) {
                    // Solo startDate: mostrar solo en ese día
                    startIdx = days.findIndex((d) => d.toDateString() === taskStart.toDateString());
                    endIdx = startIdx;
                  }
                  
                  const span = startIdx >= 0 && endIdx >= 0 ? endIdx - startIdx + 1 : 1;
                  const taskStyle = getTaskStyle(task);

                  return (
                    <div 
                      key={task.id} 
                      style={{ 
                        display: "flex", 
                        borderTop: "1px solid var(--border-color)",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div
                        style={{
                          minWidth: "220px",
                          borderRight: "2px solid var(--border-color)",
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          backgroundColor: "var(--bg-primary)",
                          position: "sticky",
                          left: 0,
                          zIndex: 10,
                          boxShadow: "2px 0 4px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "16px" }}>{taskStyle.icon}</span>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px", flex: 1 }}>
                            {task.title}
                          </div>
                        </div>
                        {task.projectName && (
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>📁</span>
                            <span>{task.projectName}</span>
                          </div>
                        )}
                        {task.assignedToName && (
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>👤</span>
                            <span>{task.assignedToName}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div style={{ 
                            fontSize: "11px", 
                            color: getTaskUrgencyStatus(task) === "overdue" ? "#dc3545" : 
                                   getTaskUrgencyStatus(task) === "due-today" ? "#ffc107" : 
                                   "var(--text-secondary)",
                            fontWeight: getTaskUrgencyStatus(task) === "overdue" || getTaskUrgencyStatus(task) === "due-today" ? 600 : 400,
                            display: "flex", 
                            alignItems: "center", 
                            gap: "4px" 
                          }}>
                            <span>📅</span>
                            <span>Vence: {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                          </div>
                        )}
                      </div>
                      {days.map((day, idx) => {
                        const isInRange = taskStart && taskDue && day >= taskStart && day <= taskDue;
                        const isStart = taskStart && day.toDateString() === taskStart.toDateString();
                        const isEnd = taskDue && day.toDateString() === taskDue.toDateString();

                        if (idx === startIdx) {
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                const projectPath = isPersonalMode || isPersonalRoute
                                  ? `/personal/project/${task.projectId}/board`
                                  : `/org/${organizationId}/project/${task.projectId}/board`;
                                window.location.href = projectPath;
                              }}
                              style={{
                                minWidth: view === "week" ? "150px" : "80px",
                                borderRight: idx < days.length - 1 ? "1px solid var(--border-color)" : "none",
                                padding: "6px",
                                position: "relative",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  ...taskStyle,
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  minHeight: "50px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  justifyContent: "center",
                                  gap: "4px",
                                  width: span > 1 ? `calc(${span * 100}% - ${(span - 1) * 6}px)` : "100%",
                                  wordBreak: "break-word",
                                  whiteSpace: "normal",
                                  lineHeight: "1.4",
                                  transition: "all 0.2s ease",
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = taskStyle.boxShadow?.replace("0 4px", "0 6px").replace("0 3px", "0 5px").replace("0 2px", "0 4px") || "0 4px 12px rgba(0, 0, 0, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = taskStyle.boxShadow || "none";
                                }}
                                title={`${task.title}${task.dueDate ? ` - Vence: ${new Date(task.dueDate).toLocaleDateString("es-ES")}` : ""}`}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                                  <span style={{ fontSize: "14px" }}>{taskStyle.icon}</span>
                                  <span style={{ fontWeight: taskStyle.fontWeight, flex: 1 }}>{task.title}</span>
                                </div>
                                {task.dueDate && span > 1 && (
                                  <div style={{ fontSize: "10px", opacity: 0.9, marginTop: "2px" }}>
                                    📅 {new Date(task.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } else if (idx > startIdx && idx <= endIdx) {
                          return (
                            <div 
                              key={idx} 
                              style={{ 
                                minWidth: view === "week" ? "150px" : "80px",
                                borderRight: idx < days.length - 1 ? "1px solid var(--border-color)" : "none",
                                padding: "6px",
                                position: "relative",
                              }}
                            >
                              {/* Continuación visual de la barra */}
                              <div
                                style={{
                                  width: "100%",
                                  height: "50px",
                                  backgroundColor: taskStyle.backgroundColor,
                                  opacity: 0.3,
                                  borderRadius: "4px",
                                  borderLeft: taskStyle.borderLeft,
                                }}
                              />
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={idx}
                              style={{
                                minWidth: view === "week" ? "150px" : "80px",
                                borderRight: idx < days.length - 1 ? "1px solid var(--border-color)" : "none",
                                padding: "6px",
                              }}
                            />
                          );
                        }
                      })}
                    </div>
                  );
                })
              )}
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
