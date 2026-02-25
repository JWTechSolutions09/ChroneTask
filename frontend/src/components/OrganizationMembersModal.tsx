import React, { useState, useEffect, useCallback } from "react";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Card from "./Card";
import Button from "./Button";

type OrganizationMember = {
  userId: string;
  userName: string;
  userEmail: string;
  profilePictureUrl?: string;
  role: string;
  joinedAt: string;
};

type OrganizationMembersModalProps = {
  organizationId: string;
  organizationName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function OrganizationMembersModal({
  organizationId,
  organizationName,
  isOpen,
  onClose,
}: OrganizationMembersModalProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const loadMembers = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const res = await http.get(`/api/orgs/${organizationId}/members`);
      setMembers(res.data || []);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando miembros";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, isOpen, showToast]);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, loadMembers]);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      org_admin: "Administrador",
      pm: "Project Manager",
      member: "Miembro",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      org_admin: "#dc3545",
      pm: "#ffc107",
      member: "#6c757d",
    };
    return colors[role] || "#6c757d";
  };

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
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#212529" }}>
              Miembros de la Organización
            </h2>
            <p style={{ fontSize: "14px", color: "#6c757d", margin: "4px 0 0 0" }}>
              {organizationName} • {members.length} {members.length === 1 ? "miembro" : "miembros"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6c757d",
              padding: "4px 8px",
              borderRadius: "6px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.color = "#212529";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#6c757d";
            }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="loading">Cargando miembros...</div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <p>No hay miembros en esta organización.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {members.map((member) => (
              <div
                key={member.userId}
                style={{
                  padding: "16px",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#e9ecef",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {member.profilePictureUrl ? (
                    <img
                      src={member.profilePictureUrl}
                      alt={member.userName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.textContent = member.userName.charAt(0).toUpperCase();
                      }}
                    />
                  ) : (
                    <span style={{ color: "#6c757d" }}>
                      {member.userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#212529" }}>
                    {member.userName}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6c757d", margin: "4px 0 0 0" }}>
                    {member.userEmail}
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        backgroundColor: getRoleColor(member.role) + "20",
                        color: getRoleColor(member.role),
                        fontWeight: 600,
                      }}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                    <span style={{ fontSize: "12px", color: "#adb5bd" }}>
                      Unido: {new Date(member.joinedAt).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
