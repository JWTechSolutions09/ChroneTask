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
        backgroundColor: "white",
        borderBottom: "1px solid #e9ecef",
        padding: "20px 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              margin: 0,
              color: "#212529",
              marginBottom: subtitle ? "4px" : 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#6c757d",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div style={{ display: "flex", gap: "8px" }}>{actions}</div>}
      </div>
    </div>
  );
}
