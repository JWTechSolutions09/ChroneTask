import React from "react";

type ProgressBarProps = {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
};

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  color = "#007bff",
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: { height: "4px", fontSize: "11px" },
    md: { height: "8px", fontSize: "12px" },
    lg: { height: "12px", fontSize: "14px" },
  };

  const sizeStyle = sizes[size];

  return (
    <div style={{ width: "100%" }}>
      {(label || showValue) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
            fontSize: sizeStyle.fontSize,
          }}
        >
          {label && <span style={{ color: "#6c757d", fontWeight: 500 }}>{label}</span>}
          {showValue && (
            <span style={{ color: "#495057", fontWeight: 600 }}>{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        style={{
          width: "100%",
          height: sizeStyle.height,
          backgroundColor: "#e9ecef",
          borderRadius: sizeStyle.height,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: color,
            borderRadius: sizeStyle.height,
            transition: animated ? "width 0.6s ease-out" : "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {animated && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                animation: "shimmer 2s infinite",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
