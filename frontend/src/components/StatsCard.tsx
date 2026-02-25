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
  children?: React.ReactNode;
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "var(--primary)",
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
              color: "var(--text-secondary)",
              marginBottom: "8px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: color,
              marginBottom: subtitle ? "6px" : 0,
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 500 }}>{subtitle}</div>
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
