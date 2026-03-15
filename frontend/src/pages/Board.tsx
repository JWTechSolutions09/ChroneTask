import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import TimeTracker from "../components/TimeTracker";
import CreateTaskModal from "../components/CreateTaskModal";
import AddProjectMemberModal from "../components/AddProjectMemberModal";
import ProjectCommentsPanel from "../components/ProjectCommentsPanel";
import TaskDetailModal from "../components/TaskDetailModal";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";
import { useTerminology } from "../hooks/useTerminology";
import { useUserUsageType } from "../hooks/useUserUsageType";

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
  startDate?: string;
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
  const { organizationId, projectId } = useParams<{ organizationId?: string; projectId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { usageType } = useUserUsageType();
  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState<string>("");
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const { showToast } = useToast();
  const t = useTerminology();

  const loadProjectInfo = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = isPersonalMode || isPersonalRoute
        ? await http.get(`/api/users/me/projects/${projectId}`)
        : await http.get(`/api/orgs/${organizationId}/projects/${projectId}`);
      setProjectName(res.data?.name || "");
    } catch (err: any) {
      console.error("Error cargando información del proyecto:", err);
      setErr(err?.response?.data?.message ?? "Error cargando información del proyecto");
    }
  }, [projectId, organizationId, isPersonalMode, isPersonalRoute]);

  const loadProjectMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = isPersonalMode || isPersonalRoute
        ? await http.get(`/api/users/me/projects/${projectId}/members`)
        : await http.get(`/api/orgs/${organizationId}/projects/${projectId}/members`);
      setProjectMembers(res.data || []);
    } catch (err: any) {
      console.error("Error cargando miembros del proyecto:", err);
      // No mostrar error si falla, simplemente no habrá miembros disponibles
    }
  }, [projectId, organizationId, isPersonalMode, isPersonalRoute]);

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
    if (projectId) {
      // Para proyectos personales, no necesitamos organizationId
      if (isPersonalMode || isPersonalRoute || organizationId) {
        loadProjectInfo();
        loadProjectMembers();
        loadTasks();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, organizationId, isPersonalMode, isPersonalRoute]); // Solo dependemos de los IDs para evitar loops

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

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  // Manejo de touch para móvil
  const [touchStart, setTouchStart] = useState<{ task: Task; startX: number; startY: number } | null>(null);
  const [touchTarget, setTouchTarget] = useState<string | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent, task: Task) => {
    if (!isMobile) return;
    e.preventDefault();
    setTouchStart({
      task,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
    });
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStart) return;
    e.preventDefault();
    const touch = e.touches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elementBelow) {
      const statusColumn = elementBelow.closest('[data-status]');
      if (statusColumn) {
        const status = (statusColumn as HTMLElement).dataset.status;
        if (status) setTouchTarget(status);
      }
    }
  }, [isMobile, touchStart]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      await http.patch(`/api/projects/${projectId}/tasks/${taskId}/status`, newStatus);
      await loadTasks();
      showToast("Estado actualizado", "success");
    } catch (ex: any) {
      showToast(ex?.response?.data?.message ?? "Error actualizando estado", "error");
    }
  }, [projectId, loadTasks, showToast]);

  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    if (!isMobile || !touchStart) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow) {
      const statusColumn = elementBelow.closest('[data-status]');
      if (statusColumn) {
        const newStatus = (statusColumn as HTMLElement).dataset.status;
        if (newStatus && newStatus !== touchStart.task.status) {
          await handleStatusChange(touchStart.task.id, newStatus);
        }
      }
    }
    
    setTouchStart(null);
    setTouchTarget(null);
  }, [isMobile, touchStart, handleStatusChange]);

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

  // En modo personal, requerimos projectId
  // En modo organizacional, requerimos ambos organizationId y projectId
  if (!projectId) {
    return (
      <Layout organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">
            Error: Faltan parámetros requeridos (Project ID)
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!isPersonalMode && !isPersonalRoute && !organizationId) {
    return (
      <Layout organizationId={organizationId}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">
            Error: Faltan parámetros requeridos (Organization ID)
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}>
      <KeyboardShortcuts
        onNewTask={() => {
          if (isMobile && projectId) {
            // En móvil, redirigir a la página de crear tarea
            if (organizationId) {
              navigate(`/org/${organizationId}/project/${projectId}/create-task`);
            } else {
              navigate(`/personal/project/${projectId}/create-task`);
            }
          } else {
            // En desktop, abrir modal
            setShowCreateModal(true);
          }
        }}
        onSearch={() => {
          // TODO: Implementar búsqueda rápida
        }}
      />
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title={projectName || "Board Kanban"}
          subtitle={`${tasks.length} tareas`}
          breadcrumbs={
            isPersonalMode || isPersonalRoute
              ? [
                  { label: "Mis Proyectos", to: "/personal/projects" },
                  { label: projectName || "Board" },
                ]
              : [
                  { label: t.organizations, to: "/org-select" },
                  { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
                  { label: "Proyectos", to: `/org/${organizationId}/projects` },
                  { label: projectName || "Board" },
                ]
          }
          actions={
            <div style={{ 
              display: "flex", 
              gap: isMobile ? "10px" : "8px", 
              flexWrap: isMobile ? "wrap" : "nowrap", 
              width: "100%",
              justifyContent: isMobile ? "flex-start" : "flex-start",
            }}>
              <Button 
                variant="secondary" 
                onClick={() => setShowCommentsPanel(true)}
                style={isMobile ? { 
                  fontSize: "14px", 
                  padding: "12px 16px",
                  minHeight: "44px",
                  minWidth: "44px",
                  flex: isMobile ? "1 1 calc(50% - 5px)" : "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                } : {}}
              >
                {isMobile ? "💬 Comentarios" : "💬 Comentarios"}
              </Button>
              {!isPersonalMode && !isPersonalRoute && organizationId && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowMemberModal(true)}
                  style={isMobile ? { 
                    fontSize: "14px", 
                    padding: "12px 16px",
                    minHeight: "44px",
                    minWidth: "44px",
                    flex: isMobile ? "1 1 calc(50% - 5px)" : "0 0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  } : {}}
                >
                  {isMobile ? "👥 Miembros" : "👥 Miembros"}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  if (isPersonalMode || isPersonalRoute) {
                    navigate(`/personal/project/${projectId}/notes`);
                  } else if (organizationId && projectId) {
                    navigate(`/org/${organizationId}/project/${projectId}/notes`);
                  }
                }}
                style={isMobile ? { 
                  fontSize: "14px", 
                  padding: "12px 16px",
                  minHeight: "44px",
                  minWidth: "44px",
                  flex: isMobile ? "1 1 calc(50% - 5px)" : "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                } : {}}
              >
                {isMobile ? "📝 Notas" : "📝 Notas"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (isPersonalMode || isPersonalRoute) {
                    navigate(`/personal/project/${projectId}/timeline`);
                  } else if (organizationId && projectId) {
                    navigate(`/org/${organizationId}/project/${projectId}/timeline`);
                  }
                }}
                style={isMobile ? { 
                  fontSize: "14px", 
                  padding: "12px 16px",
                  minHeight: "44px",
                  minWidth: "44px",
                  flex: isMobile ? "1 1 calc(50% - 5px)" : "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                } : {}}
              >
                {isMobile ? "📅 Cronograma" : "📅 Cronograma"}
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (isMobile && projectId) {
                    // En móvil, redirigir a la página de crear tarea
                    if (organizationId) {
                      navigate(`/org/${organizationId}/project/${projectId}/create-task`);
                    } else {
                      navigate(`/personal/project/${projectId}/create-task`);
                    }
                  } else {
                    // En desktop, abrir modal
                    setShowCreateModal(true);
                  }
                }}
                style={isMobile ? {
                  fontSize: "15px",
                  fontWeight: 600,
                  padding: "14px 20px",
                  minHeight: "48px",
                  flex: isMobile ? "1 1 100%" : "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                } : {
                  minWidth: "auto",
                  fontSize: "15px",
                  padding: "12px 20px",
                }}
              >
                {isMobile ? "+ Nueva Tarea" : "+ Nueva Tarea"}
              </Button>
            </div>
          }
        />

        <div style={{ padding: isMobile ? "12px" : "24px" }}>
          {err && <div className="alert alert-error">{err}</div>}

          {/* Quick Stats */}
          {!loading && tasks.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(150px, 1fr))",
                gap: isMobile ? "10px" : "16px",
                marginBottom: isMobile ? "16px" : "24px",
              }}
            >
              <Card style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--primary)", marginBottom: "4px" }}>
                  {tasks.length}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Total Tareas
                </div>
              </Card>
              <Card style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--success)", marginBottom: "4px" }}>
                  {tasks.filter((t) => t.status === "Done").length}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Completadas
                </div>
              </Card>
              <Card style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--warning)", marginBottom: "4px" }}>
                  {tasks.filter((t) => t.status === "In Progress").length}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  En Progreso
                </div>
              </Card>
              <Card style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--danger)", marginBottom: "4px" }}>
                  {tasks.filter((t) => t.status === "Blocked").length}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Bloqueadas
                </div>
              </Card>
            </div>
          )}

          {/* Kanban Board */}
          {loading ? (
            <div className="loading">Cargando tareas...</div>
          ) : (
            <div
              className="kanban-board"
              style={{
                display: isMobile ? "flex" : "grid",
                gridTemplateColumns: isMobile ? "none" : `repeat(${STATUSES.length}, 1fr)`,
                flexDirection: isMobile ? "row" : "row",
                gap: isMobile ? "12px" : "16px",
                overflowX: isMobile ? "auto" : "auto",
                overflowY: "hidden",
                minWidth: 0,
                paddingBottom: isMobile ? "8px" : "0",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {STATUSES.map((status) => {
                const statusTasks = getTasksByStatus(status);
                const statusColor = STATUS_COLORS[status] || "#6c757d";

                return (
                  <div
                    key={status}
                    data-status={status}
                    className="fade-in"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderRadius: "12px",
                      padding: isMobile ? "10px" : "16px",
                      minHeight: isMobile ? "400px" : "600px",
                      minWidth: isMobile ? "340px" : "auto",
                      maxWidth: isMobile ? "340px" : "none",
                      width: isMobile ? "340px" : "auto",
                      boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.08)",
                      border: touchTarget === status ? `2px solid ${statusColor}` : "1px solid var(--border-color)",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                    onDragOver={!isMobile ? handleDragOver : undefined}
                    onDrop={!isMobile ? (e) => handleDrop(e, status) : undefined}
                    onDragEnter={!isMobile ? (e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                      e.currentTarget.style.borderColor = statusColor;
                    } : undefined}
                    onDragLeave={!isMobile ? (e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                    } : undefined}
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
                          color: "var(--white)",
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
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: isMobile ? "12px" : "12px",
                      minWidth: 0,
                      width: "100%",
                    }}>
                      {statusTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable={!isMobile}
                          onDragStart={!isMobile ? (e) => {
                            e.currentTarget.style.opacity = "0.5";
                            handleDragStart(e, task);
                          } : undefined}
                          onTouchStart={(e) => handleTouchStart(e, task)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className="hover-lift fade-in"
                          style={{
                            padding: isMobile ? "12px" : "14px",
                            borderLeft: `4px solid ${STATUS_COLORS[task.status] || "#6c757d"}`,
                            cursor: isMobile ? "pointer" : "grab",
                            backgroundColor: "var(--bg-primary)",
                            borderRadius: "10px",
                            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.08)",
                            transition: "all 0.2s ease",
                            marginBottom: isMobile ? "12px" : "10px",
                            border: "1px solid var(--border-color)",
                            touchAction: isMobile ? "pan-y" : "none",
                            userSelect: "none",
                            width: "100%",
                            minWidth: 0,
                            maxWidth: "100%",
                            boxSizing: "border-box",
                            overflow: "hidden",
                          }}
                          onMouseEnter={!isMobile ? (e) => {
                            e.currentTarget.style.borderColor = STATUS_COLORS[task.status] || "#6c757d";
                            e.currentTarget.style.cursor = "grab";
                          } : undefined}
                          onMouseLeave={!isMobile ? (e) => {
                            e.currentTarget.style.borderColor = "var(--border-color)";
                            e.currentTarget.style.cursor = "grab";
                          } : undefined}
                          onDragEnd={!isMobile ? (e) => {
                            e.currentTarget.style.opacity = "1";
                          } : undefined}
                          onClick={() => setSelectedTask(task)}
                        >
                          {/* Header: Type, Priority, Title, Description */}
                          <div style={{ marginBottom: "12px", minWidth: 0, width: "100%" }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "8px", 
                              marginBottom: "8px",
                              flexWrap: "wrap",
                            }}>
                              <span
                                style={{
                                  fontSize: isMobile ? "11px" : "10px",
                                  fontWeight: 700,
                                  backgroundColor: "var(--bg-tertiary)",
                                  color: "var(--text-primary)",
                                  padding: isMobile ? "5px 10px" : "4px 8px",
                                  borderRadius: "6px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                {task.type}
                              </span>
                              {task.priority && (
                                <span
                                  style={{
                                    fontSize: isMobile ? "14px" : "12px",
                                    flexShrink: 0,
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
                                margin: "0 0 8px 0",
                                fontSize: isMobile ? "15px" : "15px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                lineHeight: 1.4,
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                minWidth: 0,
                                width: "100%",
                              }}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p
                                style={{
                                  margin: "0",
                                  fontSize: isMobile ? "13px" : "12px",
                                  color: "var(--text-secondary)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  lineHeight: 1.5,
                                  wordBreak: "break-word",
                                  overflowWrap: "break-word",
                                  minWidth: 0,
                                  width: "100%",
                                }}
                              >
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Meta Info Section: Assignment & Time */}
                          <div
                            style={{
                              marginTop: isMobile ? "10px" : "12px",
                              paddingTop: isMobile ? "10px" : "12px",
                              borderTop: "1px solid var(--border-color)",
                              minWidth: 0,
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                justifyContent: isMobile ? "flex-start" : "space-between",
                                alignItems: isMobile ? "stretch" : "center",
                                gap: isMobile ? "10px" : "8px",
                                marginBottom: isMobile ? "10px" : "12px",
                                minWidth: 0,
                                width: "100%",
                              }}
                            >
                              {!isPersonalMode && !isPersonalRoute && (
                                <div style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: "6px", 
                                  position: "relative",
                                  minWidth: 0,
                                  flex: isMobile ? "1 1 100%" : "0 0 auto",
                                  width: isMobile ? "100%" : "auto",
                                }}>
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
                                        padding: isMobile ? "10px 14px" : "4px 8px",
                                        fontSize: isMobile ? "14px" : "11px",
                                        border: "1px solid #007bff",
                                        borderRadius: "6px",
                                        backgroundColor: "var(--bg-primary)",
                                        color: "var(--text-primary)",
                                        cursor: "pointer",
                                        width: isMobile ? "100%" : "auto",
                                        minWidth: isMobile ? "100%" : "120px",
                                        minHeight: isMobile ? "44px" : "auto",
                                        boxSizing: "border-box",
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
                                        gap: "8px",
                                        padding: isMobile ? "10px 14px" : "4px 8px",
                                        borderRadius: "6px",
                                        transition: "background-color 0.2s",
                                        minHeight: isMobile ? "44px" : "auto",
                                        width: isMobile ? "100%" : "auto",
                                        minWidth: 0,
                                        flex: isMobile ? "1 1 100%" : "0 0 auto",
                                        boxSizing: "border-box",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                      }}
                                      title="Click para asignar usuario"
                                    >
                                      <span style={{ fontSize: isMobile ? "16px" : "14px", flexShrink: 0 }}>👤</span>
                                      {task.assignedToName ? (
                                        <span style={{ 
                                          fontWeight: 600, 
                                          color: "var(--text-primary)",
                                          fontSize: isMobile ? "14px" : "12px",
                                          wordBreak: "break-word",
                                          overflowWrap: "break-word",
                                          minWidth: 0,
                                        }}>
                                          {task.assignedToName}
                                        </span>
                                      ) : (
                                        <span style={{ 
                                          opacity: 0.6, 
                                          fontSize: isMobile ? "13px" : "11px",
                                        }}>
                                          Asignar
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {task.estimatedMinutes && (
                                <div
                                  style={{
                                    fontSize: isMobile ? "13px" : "11px",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    flexShrink: 0,
                                    padding: isMobile ? "8px 0" : "0",
                                  }}
                                >
                                  <span style={{ fontSize: isMobile ? "16px" : "14px" }}>⏱️</span>
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
                                flexDirection: isMobile ? "column" : "row",
                                gap: isMobile ? "8px" : "6px",
                                marginBottom: isMobile ? "10px" : "8px",
                                flexWrap: isMobile ? "nowrap" : "wrap",
                                width: "100%",
                                minWidth: 0,
                                boxSizing: "border-box",
                              }}
                            >
                              {getNextStatus(task.status) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    changeTaskStatus(task.id, getNextStatus(task.status)!);
                                  }}
                                  style={{
                                    padding: isMobile ? "8px 14px" : "6px 10px",
                                    fontSize: isMobile ? "13px" : "11px",
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "8px",
                                    backgroundColor: STATUS_COLORS[getNextStatus(task.status)!] || "#007bff",
                                    color: "var(--white)",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    flex: isMobile ? "1 1 100%" : 1,
                                    minWidth: isMobile ? "100%" : "90px",
                                    minHeight: isMobile ? "36px" : undefined,
                                    width: isMobile ? "100%" : "auto",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.9";
                                    e.currentTarget.style.transform = "scale(1.02)";
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
                                    padding: isMobile ? "8px 14px" : "6px 10px",
                                    fontSize: isMobile ? "13px" : "11px",
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "8px",
                                    backgroundColor: "#28a745",
                                    color: "var(--white)",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    minHeight: isMobile ? "36px" : undefined,
                                    width: isMobile ? "100%" : "auto",
                                    flex: isMobile ? "1 1 100%" : "0 0 auto",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#218838";
                                    e.currentTarget.style.transform = "scale(1.02)";
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
                              <div style={{ 
                                marginTop: isMobile ? "8px" : "8px",
                                width: "100%",
                                minWidth: 0,
                                marginBottom: 0,
                              }}>
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

          {showCreateModal && projectId && !isMobile && (
            <CreateTaskModal
              projectId={projectId}
              onClose={() => setShowCreateModal(false)}
              onSuccess={loadTasks}
            />
          )}

          {showMemberModal && projectId && (
            <AddProjectMemberModal
              organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}
              projectId={projectId}
              projectName={projectName || "Proyecto"}
              isOpen={showMemberModal}
              isPersonalProject={isPersonalMode || isPersonalRoute}
              onClose={() => setShowMemberModal(false)}
              onMemberAdded={() => {
                loadProjectMembers();
                showToast("Miembro agregado exitosamente", "success");
              }}
            />
          )}

          {showCommentsPanel && projectId && (
            <ProjectCommentsPanel
              organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}
              projectId={projectId}
              projectName={projectName || "Proyecto"}
              isOpen={showCommentsPanel}
              onClose={() => setShowCommentsPanel(false)}
            />
          )}

          {selectedTask && projectId && (
            <TaskDetailModal
              task={selectedTask}
              projectId={projectId}
              organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}
              isOpen={!!selectedTask}
              onClose={() => {
                setSelectedTask(null);
                loadTasks();
              }}
              onTaskUpdate={loadTasks}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
