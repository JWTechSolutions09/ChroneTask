import React from "react";

type BarChartProps = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
  horizontal?: boolean;
};

export default function BarChart({ data, height = 200, showValues = true, horizontal = false }: BarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const defaultColor = "var(--primary)";

  if (horizontal) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", minWidth: "120px" }}>
                  {item.label}
                </span>
                {showValues && (
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginLeft: "12px" }}>
                    {item.value}
                  </span>
                )}
              </div>
              <div
                style={{
                  width: "100%",
                  height: "24px",
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    backgroundColor: item.color || defaultColor,
                    borderRadius: "4px",
                    transition: "width 0.5s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: "8px",
                  }}
                >
                  {showValues && percentage > 15 && (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "white" }}>{item.value}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const barWidth = 100 / data.length;

  return (
    <div style={{ width: "100%", height: height + 40, position: "relative" }}>
      <svg width="100%" height={height} style={{ overflow: "visible" }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 20);
          const x = `${index * barWidth}%`;
          const width = `${barWidth * 0.7}%`;
          const y = height - barHeight;
          return (
            <g key={index}>
              <rect
                x={x}
                y={height}
                width={width}
                height="0"
                fill={item.color || defaultColor}
                rx={4}
                opacity={0.8}
                style={{ transition: "all 0.5s ease" }}
              >
                <animate attributeName="height" from="0" to={barHeight} dur="0.5s" fill="freeze" />
                <animate attributeName="y" from={height} to={y} dur="0.5s" fill="freeze" />
              </rect>
              {showValues && (
                <text
                  x={`${index * barWidth + barWidth * 0.35}%`}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--text-secondary)"
                  fontWeight="600"
                >
                  {item.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: "-30px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-around",
          fontSize: "11px",
          color: "var(--text-secondary)",
        }}
      >
        {data.map((item, index) => (
          <span key={index} style={{ maxWidth: `${barWidth}%`, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
