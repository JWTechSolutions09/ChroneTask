import React from "react";

type LineChartProps = {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showArea?: boolean;
};

export default function LineChart({ data, height = 200, color = "var(--primary)", showDots = true, showArea = false }: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = 20;
  const chartHeight = height - padding * 2;
  const chartWidth = 100 - (padding / 5) * 2;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * chartWidth + padding / 5;
    const y = chartHeight - (item.value / maxValue) * chartHeight + padding;
    return { x, y, value: item.value, label: item.label };
  });

  const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x}% ${p.y}`).join(" ");
  const areaPath = `${pathData} L ${points[points.length - 1].x}% ${height - padding} L ${points[0].x}% ${height - padding} Z`;

  return (
    <div style={{ width: "100%", height: height + 40, position: "relative" }}>
      <svg width="100%" height={height} style={{ overflow: "visible" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={`${padding / 5}%`}
            y1={padding + ratio * chartHeight}
            x2="100%"
            y2={padding + ratio * chartHeight}
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity={0.3}
          />
        ))}
        {/* Area */}
        {showArea && (
          <path d={areaPath} fill={color} opacity={0.1} style={{ transition: "all 0.5s ease" }} />
        )}
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "all 0.5s ease" }}
        />
        {/* Dots */}
        {showDots &&
          points.map((point, index) => (
            <g key={index}>
              <circle cx={`${point.x}%`} cy={point.y} r="4" fill={color} style={{ transition: "all 0.5s ease" }} />
              <circle cx={`${point.x}%`} cy={point.y} r="8" fill={color} opacity={0.2} style={{ transition: "all 0.5s ease" }} />
            </g>
          ))}
      </svg>
      {/* Labels */}
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
          <span key={index} style={{ textAlign: "center" }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
