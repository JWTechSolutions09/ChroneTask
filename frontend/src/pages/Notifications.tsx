import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";

type Notification = {
  id: string;
  type: string;
  title?: string;
  message?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  triggeredByUserId?: string;
  triggeredByUserName?: string;
  triggeredByUserAvatar?: string;
  isRead: boolean;
  createdAt: string;
};

const NOTIFICATION_ICONS: Record<string, string> = {
  task_status_change: "🔄",
  task_completed: "✅",
  task_blocked: "🚫",
  new_comment: "💬",
  sla_warning: "⏰",
  task_overdue: "⚠️",
};

const NOTIFICATION_COLORS: Record<string, string> = {
  task_status_change: "#007bff",
  task_completed: "#28a745",
  task_blocked: "#dc3545",
  new_comment: "#17a2b8",
  sla_warning: "#ffc107",
  task_overdue: "#dc3545",
};

export default function Notifications() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { showToast } = useToast();

  const loadNotifications = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await http.get(`/api/notifications?unreadOnly=${filter === "unread"}`);
      setNotifications(res.data || []);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando notificaciones";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, filter, showToast]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await http.get("/api/notifications/unread-count");
      setUnreadCount(res.data || 0);
    } catch (ex: any) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadNotifications, loadUnreadCount]);

  const markAsRead = async (id: string) => {
    try {
      await http.patch(`/api/notifications/${id}/read`);
      await loadNotifications();
      await loadUnreadCount();
    } catch (ex: any) {
      showToast("Error marcando notificación", "error");
    }
  };

  const markAllAsRead = async () => {
    try {
      await http.patch("/api/notifications/read-all");
      await loadNotifications();
      await loadUnreadCount();
      showToast("Todas las notificaciones marcadas como leídas", "success");
    } catch (ex: any) {
      showToast("Error marcando notificaciones", "error");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await http.delete(`/api/notifications/${id}`);
      await loadNotifications();
      await loadUnreadCount();
      showToast("Notificación eliminada", "success");
    } catch (ex: any) {
      showToast("Error eliminando notificación", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.taskId && notification.projectId) {
      return `/org/${organizationId}/project/${notification.projectId}/board`;
    }
    if (notification.projectId) {
      return `/org/${organizationId}/projects`;
    }
    return `/org/${organizationId}/dashboard`;
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

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <Layout organizationId={organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Notificaciones"
          subtitle={`${notifications.length} notificaciones${unreadNotifications.length > 0 ? ` • ${unreadNotifications.length} sin leer` : ""}`}
          breadcrumbs={[
            { label: "Organizaciones", to: "/org-select" },
            { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
            { label: "Notificaciones" },
          ]}
          actions={
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                variant={filter === "all" ? "primary" : "secondary"}
                onClick={() => setFilter("all")}
              >
                Todas
              </Button>
              <Button
                variant={filter === "unread" ? "primary" : "secondary"}
                onClick={() => setFilter("unread")}
              >
                Sin leer ({unreadNotifications.length})
              </Button>
              {unreadNotifications.length > 0 && (
                <Button variant="secondary" onClick={markAllAsRead}>
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          }
        />

        <div style={{ padding: "24px" }}>
          {loading ? (
            <div className="loading">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>🔔</div>
              <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>
                No hay notificaciones
              </div>
              <div>No tienes notificaciones {filter === "unread" ? "sin leer" : ""}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  style={{
                    padding: "16px",
                    borderLeft: `4px solid ${NOTIFICATION_COLORS[notification.type] || "#6c757d"}`,
                    backgroundColor: notification.isRead ? "var(--bg-primary)" : "var(--bg-secondary)",
                    opacity: notification.isRead ? 0.8 : 1,
                  }}
                >
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div
                      style={{
                        fontSize: "32px",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "var(--bg-tertiary)",
                        borderRadius: "10px",
                      }}
                    >
                      {NOTIFICATION_ICONS[notification.type] || "🔔"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: "4px",
                            }}
                          >
                            {notification.title || "Notificación"}
                          </h3>
                          {notification.message && (
                            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                              {notification.message}
                            </p>
                          )}
                        </div>
                        {!notification.isRead && (
                          <div
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: NOTIFICATION_COLORS[notification.type] || "#007bff",
                            }}
                          />
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
                        {notification.triggeredByUserName && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                            <span>Por:</span>
                            {notification.triggeredByUserAvatar ? (
                              <img
                                src={notification.triggeredByUserAvatar}
                                alt={notification.triggeredByUserName}
                                style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }}
                              />
                            ) : null}
                            <span>{notification.triggeredByUserName}</span>
                          </div>
                        )}
                        {notification.projectName && (
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            📁 {notification.projectName}
                          </span>
                        )}
                        {notification.taskTitle && (
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            📋 {notification.taskTitle}
                          </span>
                        )}
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        <Link
                          to={getNotificationLink(notification)}
                          style={{ textDecoration: "none" }}
                        >
                          <Button variant="primary" style={{ fontSize: "12px", padding: "6px 12px" }}>
                            Ver
                          </Button>
                        </Link>
                        {!notification.isRead && (
                          <Button
                            variant="secondary"
                            onClick={() => markAsRead(notification.id)}
                            style={{ fontSize: "12px", padding: "6px 12px" }}
                          >
                            Marcar como leída
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => deleteNotification(notification.id)}
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
