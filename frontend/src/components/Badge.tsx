import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "secondary";
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
};

export default function Badge({
  children,
  variant = "secondary",
  size = "md",
  style,
}: BadgeProps) {
  const variantStyles = {
    primary: { bg: "#e7f3ff", color: "#007bff", border: "#b3d9ff" },
    success: { bg: "#d4edda", color: "#28a745", border: "#c3e6cb" },
    warning: { bg: "#fff3cd", color: "#ffc107", border: "#ffeaa7" },
    danger: { bg: "#f8d7da", color: "#dc3545", border: "#f5c6cb" },
    info: { bg: "#d1ecf1", color: "#17a2b8", border: "#bee5eb" },
    secondary: { bg: "#e9ecef", color: "#6c757d", border: "#dee2e6" },
  };

  const sizes = {
    sm: { padding: "2px 8px", fontSize: "10px" },
    md: { padding: "4px 10px", fontSize: "11px" },
    lg: { padding: "6px 12px", fontSize: "12px" },
  };

  const styles = variantStyles[variant];
  const sizeStyle = sizes[size];

  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        borderRadius: "6px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        ...sizeStyle,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
