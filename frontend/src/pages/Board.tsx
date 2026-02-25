import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import TimeTracker from "../components/TimeTracker";
import CreateTaskModal from "../components/CreateTaskModal";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";

type Task = {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority?: string;
  assignedToId?: string;
  assignedToName?: string;
  estimatedMinutes?: number;
  totalMinutes: number;
  dueDate?: string;
  tags?: string;
};

type ProjectMember = {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
};

const STATUSES = ["To Do", "In Progress", "Blocked", "Review", "Done"];
const STATUS_COLORS: Record<string, string> = {
  "To Do": "#6c757d",
  "In Progress": "#007bff",
  "Blocked": "#dc3545",
  "Review": "#ffc107",
  "Done": "#28a745",
};

export default function Board() {
  const { organizationId, projectId } = useParams<{ organizationId: string; projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState<string>("");
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadProjectInfo = useCallback(async () => {
    if (!projectId || !organizationId) return;
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects/${projectId}`);
      setProjectName(res.data?.name || "");
    } catch (err: any) {
      console.error("Error cargando información del proyecto:", err);
      setErr(err?.response?.data?.message ?? "Error cargando información del proyecto");
    }
  }, [projectId, organizationId]);

  const loadProjectMembers = useCallback(async () => {
    if (!projectId || !organizationId) return;
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects/${projectId}/members`);
      setProjectMembers(res.data || []);
    } catch (err: any) {
      console.error("Error cargando miembros del proyecto:", err);
      // No mostrar error si falla, simplemente no habrá miembros disponibles
    }
  }, [projectId, organizationId]);

  const loadTasks = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await http.get(`/api/projects/${projectId}/tasks`);
      setTasks(res.data || []);
    } catch (ex: any) {
      setErr(ex?.response?.data?.message ?? ex.message ?? "Error cargando tareas");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId && organizationId) {
      loadProjectInfo();
      loadProjectMembers();
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, organizationId]); // Solo dependemos de los IDs para evitar loops

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTask || !projectId) return;

    if (draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await http.patch(
        `/api/projects/${projectId}/tasks/${draggedTask.id}/status`,
        JSON.stringify(newStatus),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      await loadTasks();
      showToast("Tarea actualizada exitosamente", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error actualizando estado";
      setErr(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setDraggedTask(null);
    }
  }, [draggedTask, projectId, loadTasks, showToast]);

  const changeTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    if (!projectId) return;

    try {
      await http.patch(
        `/api/projects/${projectId}/tasks/${taskId}/status`,
        JSON.stringify(newStatus),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      await loadTasks();
      showToast("Estado de tarea actualizado", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error actualizando estado";
      showToast(errorMsg, "error");
    }
  }, [projectId, loadTasks, showToast]);

  const assignTask = useCallback(async (taskId: string, userId: string | null) => {
    if (!projectId) return;

    try {
      await http.patch(
        `/api/projects/${projectId}/tasks/${taskId}/assign`,
        userId || null
      );
      await loadTasks();
      setAssigningTaskId(null);
      showToast(userId ? "Usuario asignado correctamente" : "Asignación removida", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error asignando tarea";
      showToast(errorMsg, "error");
      setAssigningTaskId(null);
    }
  }, [projectId, loadTasks, showToast]);

  const getNextStatus = (currentStatus: string): string | null => {
    const currentIndex = STATUSES.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === STATUSES.length - 1) return null;
    return STATUSES[currentIndex + 1];
  };

  const getPreviousStatus = (currentStatus: string): string | null => {
    const currentIndex = STATUSES.indexOf(currentStatus);
    if (currentIndex <= 0) return null;
    return STATUSES[currentIndex - 1];
  };

  const formatTime = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  const getTasksByStatus = useCallback((status: string) => {
    return tasks.filter((t) => t.status === status);
  }, [tasks]);

  if (!organizationId || !projectId) {
    return (
      <Layout organizationId={organizationId}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">
            Error: Faltan parámetros requeridos {!organizationId && "(Organization ID)"} {!projectId && "(Project ID)"}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout organizationId={organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title={projectName || "Board Kanban"}
          subtitle={`${tasks.length} tareas`}
          breadcrumbs={[
            { label: "Organizaciones", to: "/org-select" },
            { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
            { label: "Proyectos", to: `/org/${organizationId}/projects` },
            { label: projectName || "Board" },
          ]}
          actions={
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              + Nueva Tarea
            </Button>
          }
        />

        <div style={{ padding: "24px" }}>
          {err && <div className="alert alert-error">{err}</div>}

          {/* Kanban Board */}
          {loading ? (
            <div className="loading">Cargando tareas...</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`,
                gap: "16px",
                overflowX: "auto",
              }}
            >
              {STATUSES.map((status) => {
                const statusTasks = getTasksByStatus(status);
                const statusColor = STATUS_COLORS[status] || "#6c757d";

                return (
                  <div
                    key={status}
                    className="fade-in"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderRadius: "12px",
                      padding: "16px",
                      minHeight: "600px",
                      boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.08)",
                      border: "1px solid var(--border-color)",
                      transition: "all 0.2s ease",
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    onDragEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                      e.currentTarget.style.borderColor = statusColor;
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                    }}
                  >
                    {/* Column Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                        paddingBottom: "12px",
                        borderBottom: `3px solid ${statusColor}40`,
                        backgroundColor: `${statusColor}08`,
                        padding: "12px",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            backgroundColor: statusColor,
                            boxShadow: `0 0 0 3px ${statusColor}30`,
                          }}
                        />
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {status}
                        </h3>
                      </div>
                      <span
                        style={{
                          backgroundColor: statusColor,
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "16px",
                          fontSize: "13px",
                          fontWeight: 700,
                          minWidth: "32px",
                          textAlign: "center",
                          boxShadow: `0 2px 4px ${statusColor}40`,
                        }}
                      >
                        {statusTasks.length}
                      </span>
                    </div>

                    {/* Tasks */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {statusTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.currentTarget.style.opacity = "0.5";
                            handleDragStart(e, task);
                          }}
                          className="hover-lift fade-in"
                          style={{
                            padding: "14px",
                            borderLeft: `4px solid ${STATUS_COLORS[task.status] || "#6c757d"}`,
                            cursor: "grab",
                            backgroundColor: "var(--bg-primary)",
                            borderRadius: "10px",
                            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.08)",
                            transition: "all 0.2s ease",
                            marginBottom: "10px",
                            border: "1px solid var(--border-color)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = STATUS_COLORS[task.status] || "#6c757d";
                            e.currentTarget.style.cursor = "grab";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-color)";
                            e.currentTarget.style.cursor = "grab";
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                        >
                          <div style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  backgroundColor: "var(--bg-tertiary)",
                                  color: "var(--text-primary)",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {task.type}
                              </span>
                              {task.priority && (
                                <span
                                  style={{
                                    fontSize: "12px",
                                  }}
                                >
                                  {task.priority === "Critical" && "🔴"}
                                  {task.priority === "High" && "🟠"}
                                  {task.priority === "Medium" && "🟡"}
                                  {task.priority === "Low" && "🟢"}
                                </span>
                              )}
                            </div>
                            <h4
                              style={{
                                margin: "0 0 6px 0",
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                lineHeight: 1.4,
                              }}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p
                                style={{
                                  margin: "0",
                                  fontSize: "12px",
                                  color: "var(--text-secondary)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  lineHeight: 1.5,
                                }}
                              >
                                {task.description}
                              </p>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: "11px",
                              color: "#6c757d",
                              marginTop: "12px",
                              paddingTop: "12px",
                              borderTop: "2px solid var(--border-color)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", position: "relative" }}>
                                {assigningTaskId === task.id ? (
                                  <select
                                    value={task.assignedToId || ""}
                                    onChange={(e) => {
                                      const userId = e.target.value || null;
                                      assignTask(task.id, userId);
                                    }}
                                    onBlur={() => setAssigningTaskId(null)}
                                    autoFocus
                                    style={{
                                      padding: "4px 8px",
                                      fontSize: "11px",
                                      border: "1px solid #007bff",
                                      borderRadius: "6px",
                                      backgroundColor: "var(--bg-primary)",
                                      cursor: "pointer",
                                      minWidth: "120px",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="">Sin asignar</option>
                                    {projectMembers.map((member) => (
                                      <option key={member.userId} value={member.userId}>
                                        {member.userName}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAssigningTaskId(task.id);
                                    }}
                                    style={{
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "4px 8px",
                                      borderRadius: "6px",
                                      transition: "background-color 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                    title="Click para asignar usuario"
                                  >
                                    {task.assignedToName ? (
                                      <>
                                        <span style={{ fontSize: "14px" }}>👤</span>
                                        <span style={{ fontWeight: 600, color: "#495057" }}>
                                          {task.assignedToName}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span style={{ fontSize: "12px" }}>➕</span>
                                        <span style={{ opacity: 0.6, fontSize: "11px" }}>Asignar</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                              {task.estimatedMinutes && (
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <span>⏱️</span>
                                  <span>
                                    {task.estimatedMinutes < 60
                                      ? `${task.estimatedMinutes}m`
                                      : `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Quick Actions - Botones para cambiar estado */}
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              {getPreviousStatus(task.status) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    changeTaskStatus(task.id, getPreviousStatus(task.status)!);
                                  }}
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "6px",
                                    backgroundColor: "var(--bg-tertiary)",
                                        color: "var(--text-primary)",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#dee2e6";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#e9ecef";
                                    e.currentTarget.style.transform = "scale(1)";
                                  }}
                                  title={`Mover a ${getPreviousStatus(task.status)}`}
                                >
                                  <span>←</span>
                                  <span>Anterior</span>
                                </button>
                              )}
                              {getNextStatus(task.status) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    changeTaskStatus(task.id, getNextStatus(task.status)!);
                                  }}
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "6px",
                                    backgroundColor: STATUS_COLORS[getNextStatus(task.status)!] || "#007bff",
                                    color: "white",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    flex: 1,
                                    minWidth: "90px",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.9";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                    e.currentTarget.style.transform = "scale(1)";
                                  }}
                                  title={`Mover a ${getNextStatus(task.status)}`}
                                >
                                  <span>{getNextStatus(task.status)}</span>
                                  <span>→</span>
                                </button>
                              )}
                              {task.status !== "Done" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    changeTaskStatus(task.id, "Done");
                                  }}
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "6px",
                                    backgroundColor: "#28a745",
                                    color: "white",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#218838";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#28a745";
                                    e.currentTarget.style.transform = "scale(1)";
                                  }}
                                  title="Marcar como completada"
                                >
                                  <span>✓</span>
                                  <span>Completar</span>
                                </button>
                              )}
                            </div>

                            {/* Time Tracker */}
                            {projectId && (
                              <div style={{ marginTop: "8px" }}>
                                <TimeTracker
                                  taskId={task.id}
                                  projectId={projectId}
                                  totalMinutes={task.totalMinutes}
                                  onTimeUpdate={loadTasks}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {statusTasks.length === 0 && (
                        <div
                          style={{
                            padding: "60px 20px",
                            textAlign: "center",
                            color: "#adb5bd",
                            fontSize: "14px",
                          }}
                        >
                          <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }}>📋</div>
                          <div>No hay tareas en esta columna</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showCreateModal && projectId && (
            <CreateTaskModal
              projectId={projectId}
              onClose={() => setShowCreateModal(false)}
              onSuccess={loadTasks}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
