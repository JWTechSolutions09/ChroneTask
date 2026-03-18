import React from "react";
import Card from "./Card";
import InvitationsBody from "./InvitationsBody";

type Invitation = {
  id: string;
  token: string;
  invitationLink?: string;
  email?: string;
  role: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
};

type InvitationsModalProps = {
  organizationId: string;
  organizationName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function InvitationsModal({
  organizationId,
  organizationName,
  isOpen,
  onClose,
}: InvitationsModalProps) {
  if (!isOpen) return null;

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
        padding: "20px",
      }}
      onClick={onClose}
    >
      <Card
        style={{
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
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
              transition: "all 0.2s",
            }}
            title="Cerrar"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <InvitationsBody organizationId={organizationId} organizationName={organizationName} enabled={isOpen} />
      </Card>
    </div>
  );
}
