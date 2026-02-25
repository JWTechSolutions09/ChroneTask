import React from "react";
import Card from "./Card";

type ActivityItem = {
  id: string;
  type: "task_created" | "task_updated" | "task_assigned" | "member_added" | "project_created";
  message: string;
  timestamp: string;
  user?: string;
};

type ActivityFeedProps = {
  activities: ActivityItem[];
  maxItems?: number;
};

export default function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      task_created: "➕",
      task_updated: "✏️",
      task_assigned: "👤",
      member_added: "👥",
      project_created: "📁",
    };
    return icons[type] || "📌";
  };

  if (activities.length === 0) {
    return (
      <Card>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
          Actividad Reciente
        </h3>
        <div className="empty-state">
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No hay actividad reciente</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
        Actividad Reciente
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {displayedActivities.map((activity) => (
          <div
            key={activity.id}
            style={{
              display: "flex",
              gap: "12px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ fontSize: "20px" }}>{getActivityIcon(activity.type)}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                {activity.message}
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                {new Date(activity.timestamp).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
