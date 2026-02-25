import React from "react";
import { Link } from "react-router-dom";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        color: "var(--text-secondary)",
        marginBottom: "12px",
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span style={{ color: "var(--text-tertiary)", margin: "0 4px" }}>›</span>}
          {item.to && index < items.length - 1 ? (
            <Link
              to={item.to}
              style={{
                color: "var(--primary)",
                textDecoration: "none",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
                e.currentTarget.style.color = "var(--primary-dark)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
                e.currentTarget.style.color = "var(--primary)";
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: index === items.length - 1 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: index === items.length - 1 ? 600 : 400 }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
