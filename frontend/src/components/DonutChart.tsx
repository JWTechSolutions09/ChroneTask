import React from "react";

type DonutChartProps = {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  showLegend?: boolean;
};

export default function DonutChart({
  data,
  size = 200,
  strokeWidth = 20,
  showLabels = true,
  showLegend = true,
}: DonutChartProps) {
  if (data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = (percentage / 100) * circumference;
            const strokeDashoffset = circumference - currentOffset;
            currentOffset += strokeDasharray;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: "all 0.5s ease",
                }}
              />
            );
          })}
        </svg>
        {showLabels && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>{total}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Total</div>
          </div>
        )}
      </div>
      {showLegend && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, color: "var(--text-primary)", fontWeight: 500 }}>{item.label}</span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{percentage}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
