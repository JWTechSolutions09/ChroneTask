import React from "react";
import Card from "./Card";

type Notification = {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
};

type NotificationsPanelProps = {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
};

export default function NotificationsPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
    };
    return icons[type] || "📌";
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      info: "var(--primary)",
      success: "var(--success)",
      warning: "var(--warning)",
      error: "var(--danger)",
    };
    return colors[type] || "var(--text-secondary)";
  };

  return (
    <Card style={{ maxHeight: "500px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
          Notificaciones {unreadCount > 0 && (
            <span style={{
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "12px",
              backgroundColor: "var(--danger)",
              color: "white",
              marginLeft: "8px",
            }}>
              {unreadCount}
            </span>
          )}
        </h3>
        <div style={{ display: "flex", gap: "8px" }}>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              Marcar todas como leídas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClear}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                border: "1px solid var(--danger)",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "var(--danger)",
                cursor: "pointer",
              }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No hay notificaciones</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => {
                if (!notification.read) {
                  onMarkAsRead(notification.id);
                }
                if (notification.actionUrl) {
                  window.location.href = notification.actionUrl;
                }
              }}
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: notification.read ? "var(--bg-secondary)" : "var(--bg-primary)",
                border: `2px solid ${notification.read ? "var(--border-color)" : getNotificationColor(notification.type)}`,
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: notification.read ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ fontSize: "24px" }}>{getNotificationIcon(notification.type)}</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {notification.title}
                  </h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {notification.message}
                  </p>
                  <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "var(--text-tertiary)" }}>
                    {new Date(notification.timestamp).toLocaleString("es-ES")}
                  </p>
                </div>
                {!notification.read && (
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: getNotificationColor(notification.type),
                      marginTop: "6px",
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
