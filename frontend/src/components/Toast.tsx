import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

type ToastProps = {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
};

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: {
      bg: "#d4edda",
      border: "#c3e6cb",
      text: "#155724",
      icon: "✓",
    },
    error: {
      bg: "#f8d7da",
      border: "#f5c6cb",
      text: "#721c24",
      icon: "✕",
    },
    warning: {
      bg: "#fff3cd",
      border: "#ffeaa7",
      text: "#856404",
      icon: "⚠",
    },
    info: {
      bg: "#d1ecf1",
      border: "#bee5eb",
      text: "#0c5460",
      icon: "ℹ",
    },
  };

  const styles = typeStyles[type];

  return (
    <div
      style={{
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.text,
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "300px",
        maxWidth: "500px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <span style={{ fontSize: "20px", fontWeight: "bold" }}>{styles.icon}</span>
      <span style={{ flex: 1, fontSize: "14px" }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: styles.text,
          cursor: "pointer",
          fontSize: "18px",
          padding: "0",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.7,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.7";
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
