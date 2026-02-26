import React from "react";
import Breadcrumbs from "./Breadcrumbs";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-color)",
        padding: "24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: breadcrumbs && breadcrumbs.length > 0 ? "12px" : 0,
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              margin: 0,
              color: "var(--text-primary)",
              marginBottom: subtitle ? "8px" : 0,
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                color: "var(--text-secondary)",
                fontWeight: 400,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
