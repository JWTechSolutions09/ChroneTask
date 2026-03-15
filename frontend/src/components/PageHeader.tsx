import React, { useState, useEffect } from "react";
import Breadcrumbs from "./Breadcrumbs";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
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

  // Renderizar normalmente en móvil y desktop

  return (
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid var(--border-color)",
        padding: isMobile ? "16px" : "24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      }}
      className="page-header"
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
        className="page-header-content"
      >
        <div style={{ flex: "1 1 100%", minWidth: 0, maxWidth: "100%" }}>
          <h1
            style={{
              fontSize: isMobile ? "20px" : "28px",
              fontWeight: 700,
              margin: 0,
              color: "var(--text-primary)",
              marginBottom: subtitle ? "8px" : 0,
              letterSpacing: "-0.5px",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? "13px" : "15px",
                color: "var(--text-secondary)",
                fontWeight: 400,
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div 
            style={{ 
              display: "flex", 
              gap: isMobile ? "10px" : "8px", 
              alignItems: "stretch", 
              flexWrap: isMobile ? "wrap" : "nowrap",
              width: isMobile ? "100%" : "auto",
              maxWidth: "100%",
              justifyContent: isMobile ? "flex-start" : "flex-start",
              marginTop: isMobile ? "12px" : "0",
            }}
            className="page-header-actions"
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
