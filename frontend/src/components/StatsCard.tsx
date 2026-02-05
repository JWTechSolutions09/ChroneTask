import React from "react";
import Card from "./Card";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "#007bff",
  children,
}: StatsCardProps) {
  return (
    <Card
      style={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              color: "#6c757d",
              marginBottom: "8px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: color,
              marginBottom: subtitle ? "4px" : 0,
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: "13px", color: "#6c757d", marginTop: "4px" }}>{subtitle}</div>
          )}
          {trend && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "8px",
                fontSize: "12px",
                color: trend.isPositive ? "#28a745" : "#dc3545",
                fontWeight: 500,
              }}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
          {children}
        </div>
        {icon && (
          <div
            style={{
              fontSize: "40px",
              opacity: 0.2,
              lineHeight: 1,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
