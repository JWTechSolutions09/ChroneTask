import React from "react";
import ProjectCommentsBody from "./ProjectCommentsBody";

type ProjectCommentsPanelProps = {
  organizationId?: string;
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProjectCommentsPanel({
  organizationId,
  projectId,
  projectName,
  isOpen,
  onClose,
}: ProjectCommentsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "500px",
          maxWidth: "95vw",
          backgroundColor: "var(--bg-primary)",
          boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
              Comentarios del Proyecto
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            ×
          </button>
        </div>

        {/* Comments List */}
        <ProjectCommentsBody organizationId={organizationId} projectId={projectId} enabled={isOpen} />
      </div>
    </>
  );
}
