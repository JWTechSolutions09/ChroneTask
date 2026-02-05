import React from "react";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantColors = {
    danger: {
      bg: "#fee",
      border: "#fcc",
      button: "#dc3545",
    },
    warning: {
      bg: "#fff3cd",
      border: "#ffc107",
      button: "#ffc107",
    },
    info: {
      bg: "#d1ecf1",
      border: "#17a2b8",
      button: "#17a2b8",
    },
  };

  const colors = variantColors[variant];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "20px",
            fontWeight: 600,
            color: "#212529",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "14px",
            color: "#6c757d",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #dee2e6",
              backgroundColor: "white",
              color: "#495057",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: colors.button,
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
