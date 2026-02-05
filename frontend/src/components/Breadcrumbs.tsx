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
        fontSize: "14px",
        color: "#6c757d",
        marginBottom: "16px",
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span style={{ color: "#adb5bd" }}>/</span>}
          {item.to && index < items.length - 1 ? (
            <Link
              to={item.to}
              style={{
                color: "#007bff",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: index === items.length - 1 ? "#212529" : "#6c757d" }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
