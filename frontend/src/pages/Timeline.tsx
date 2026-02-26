import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";

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
  const { organizationId, projectId } = useParams<{ organizationId: string; projectId?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<TimelineView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const { showToast } = useToast();

  const loadProjects = useCallback(async () => {
    if (!organizationId) return;
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects`);
      setProjects(res.data || []);
    } catch (ex: any) {
      // Silently fail
    }
  }, [organizationId]);

  const loadTasks = useCallback(async () => {
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

      // Filter tasks with dates
      allTasks = allTasks.filter((t) => t.startDate || t.dueDate);
      setTasks(allTasks);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando tareas";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, projects, showToast]);

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

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      const taskStart = task.startDate ? new Date(task.startDate) : null;
      const taskDue = task.dueDate ? new Date(task.dueDate) : null;
      const dateStr = date.toISOString().split("T")[0];

      if (taskStart && taskDue) {
        return date >= taskStart && date <= taskDue;
      } else if (taskStart) {
        return dateStr === taskStart.toISOString().split("T")[0];
      } else if (taskDue) {
        return dateStr === taskDue.toISOString().split("T")[0];
      }
      return false;
    });
  };

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

  if (!organizationId) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">Error: Falta Organization ID</div>
        </div>
      </Layout>
    );
  }

  const days = getDaysInView();
  const viewTitle = view === "week" 
    ? `Semana del ${formatDate(days[0])}`
    : currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <Layout organizationId={organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Cronograma"
          subtitle={viewTitle}
          breadcrumbs={[
            { label: "Organizaciones", to: "/org-select" },
            { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
            { label: "Cronograma" },
          ]}
          actions={
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={projectId || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/org/${organizationId}/project/${e.target.value}/timeline`;
                  } else {
                    window.location.href = `/org/${organizationId}/timeline`;
                  }
                }}
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
              <Button
                variant="secondary"
                onClick={() => navigateDate("prev")}
              >
                ← Anterior
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoy
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigateDate("next")}
              >
                Siguiente →
              </Button>
              <Button
                variant={view === "week" ? "primary" : "secondary"}
                onClick={() => setView("week")}
              >
                Semana
              </Button>
              <Button
                variant={view === "month" ? "primary" : "secondary"}
                onClick={() => setView("month")}
              >
                Mes
              </Button>
            </div>
          }
        />

        <div style={{ padding: "24px" }}>
          {loading ? (
            <div className="loading">Cargando cronograma...</div>
          ) : (
            <Card style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", minWidth: "100%" }}>
                {/* Day Headers */}
                <div style={{ minWidth: "200px", borderRight: "1px solid var(--border-color)", padding: "12px" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>Tarea</div>
                </div>
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      minWidth: view === "week" ? "150px" : "80px",
                      borderRight: idx < days.length - 1 ? "1px solid var(--border-color)" : "none",
                      padding: "12px",
                      textAlign: "center",
                      backgroundColor: day.toDateString() === new Date().toDateString() ? "var(--bg-secondary)" : "transparent",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
                      {formatDate(day)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Task Rows */}
              {tasks.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                  No hay tareas con fechas asignadas
                </div>
              ) : (
                tasks.map((task) => {
                  const taskStart = task.startDate ? new Date(task.startDate) : null;
                  const taskDue = task.dueDate ? new Date(task.dueDate) : null;
                  const startIdx = taskStart ? days.findIndex((d) => d.toDateString() === taskStart.toDateString()) : -1;
                  const endIdx = taskDue ? days.findIndex((d) => d.toDateString() === taskDue.toDateString()) : -1;
                  const span = startIdx >= 0 && endIdx >= 0 ? endIdx - startIdx + 1 : 1;

                  return (
                    <div key={task.id} style={{ display: "flex", borderTop: "1px solid var(--border-color)" }}>
                      <div
                        style={{
                          minWidth: "200px",
                          borderRight: "1px solid var(--border-color)",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
                          {task.title}
                        </div>
                        {task.projectName && (
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            📁 {task.projectName}
                          </div>
                        )}
                        {task.assignedToName && (
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            👤 {task.assignedToName}
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
                              style={{
                                minWidth: view === "week" ? "150px" : "80px",
                                borderRight: idx < days.length - 1 ? "1px solid var(--border-color)" : "none",
                                padding: "8px",
                                position: "relative",
                              }}
                            >
                              <div
                                style={{
                                  backgroundColor: task.status === "Done" ? "#28a745" : task.status === "Blocked" ? "#dc3545" : "#007bff",
                                  color: "white",
                                  padding: "8px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  minHeight: "40px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: `calc(${span * 100}% - ${(span - 1) * 1}px)`,
                                }}
                              >
                                {task.title}
                              </div>
                            </div>
                          );
                        } else if (idx > startIdx && idx <= endIdx) {
                          return <div key={idx} style={{ minWidth: view === "week" ? "150px" : "80px" }} />;
                        } else {
                          return (
                            <div
                              key={idx}
                              style={{
                                minWidth: view === "week" ? "150px" : "80px",
                                borderRight: idx < days.length - 1 ? "1px solid var(--border-color)" : "none",
                                padding: "8px",
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
