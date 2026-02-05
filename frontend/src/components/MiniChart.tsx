import React from "react";

type MiniChartProps = {
  data: number[];
  color?: string;
  height?: number;
  showLabels?: boolean;
};

export default function MiniChart({
  data,
  color = "#007bff",
  height = 40,
  showLabels = false,
}: MiniChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data, 1);
  const barWidth = 100 / data.length;

  return (
    <div style={{ width: "100%", height: `${height}px`, position: "relative" }}>
      <svg width="100%" height={height} style={{ overflow: "visible" }}>
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * (height - 4);
          return (
            <rect
              key={index}
              x={`${index * barWidth}%`}
              y={height - barHeight - 2}
              width={`${barWidth * 0.8}%`}
              height={barHeight}
              fill={color}
              opacity={0.7}
              rx={2}
            >
              <animate
                attributeName="height"
                from="0"
                to={barHeight}
                dur="0.5s"
                fill="freeze"
              />
              <animate
                attributeName="y"
                from={height - 2}
                to={height - barHeight - 2}
                dur="0.5s"
                fill="freeze"
              />
            </rect>
          );
        })}
      </svg>
      {showLabels && (
        <div
          style={{
            position: "absolute",
            bottom: "-20px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            color: "#6c757d",
          }}
        >
          {data.map((_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
      )}
    </div>
  );
}
