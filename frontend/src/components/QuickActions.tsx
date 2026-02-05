import React from "react";
import Button from "./Button";

type QuickAction = {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "success" | "danger";
};

type QuickActionsProps = {
  actions: QuickAction[];
  orientation?: "horizontal" | "vertical";
};

export default function QuickActions({ actions, orientation = "horizontal" }: QuickActionsProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: orientation === "vertical" ? "column" : "row",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || "primary"}
          onClick={action.onClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
          }}
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
