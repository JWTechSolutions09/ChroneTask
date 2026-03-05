import React, { useState, useEffect, useCallback } from "react";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Card from "./Card";
import Button from "./Button";
import { useTerminology } from "../hooks/useTerminology";

type OrganizationMember = {
  userId: string;
  userName: string;
  userEmail: string;
  profilePictureUrl?: string;
  role: string;
};

type ProjectMember = {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
};

type AddProjectMemberModalProps = {
  organizationId?: string;
  projectId: string;
  projectName: string;
  isOpen: boolean;
  isPersonalProject?: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
};

export default function AddProjectMemberModal({
  organizationId,
  projectId,
  projectName,
  isOpen,
  isPersonalProject = false,
  onClose,
  onMemberAdded,
}: AddProjectMemberModalProps) {
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const { showToast } = useToast();
  const t = useTerminology();

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      if (isPersonalProject) {
        // Para proyectos personales, no hay organización
        // Cargar miembros del proyecto personal
        const projectRes = await http.get(`/api/users/me/projects/${projectId}/members`);
        setProjectMembers(projectRes.data || []);
        // Para proyectos personales, no hay miembros de organización disponibles
        setOrgMembers([]);
      } else {
        if (!organizationId) {
          throw new Error("OrganizationId is required for non-personal projects");
        }
        // Cargar miembros de la organización
        const orgRes = await http.get(`/api/orgs/${organizationId}/members`);
        setOrgMembers(orgRes.data || []);

        // Cargar miembros del proyecto
        const projectRes = await http.get(`/api/orgs/${organizationId}/projects/${projectId}/members`);
        setProjectMembers(projectRes.data || []);
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando datos";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, isOpen, showToast, isPersonalProject]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSelectedUserId("");
      setSelectedRole("member");
    }
  }, [isOpen, loadData]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setAdding(true);
    try {
      const endpoint = isPersonalProject
        ? `/api/users/me/projects/${projectId}/members`
        : `/api/orgs/${organizationId}/projects/${projectId}/members`;
      
      await http.post(endpoint, {
        userId: selectedUserId,
        role: selectedRole,
      });
      await loadData();
      showToast("Miembro agregado al proyecto exitosamente", "success");
      setSelectedUserId("");
      setSelectedRole("member");
      if (onMemberAdded) {
        onMemberAdded();
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error agregando miembro";
      showToast(errorMsg, "error");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const endpoint = isPersonalProject
        ? `/api/users/me/projects/${projectId}/members/${userId}`
        : `/api/orgs/${organizationId}/projects/${projectId}/members/${userId}`;
      
      await http.delete(endpoint);
      await loadData();
      showToast("Miembro removido del proyecto exitosamente", "success");
      if (onMemberAdded) {
        onMemberAdded();
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error removiendo miembro";
      showToast(errorMsg, "error");
    }
  };

  // Filtrar miembros de la organización que no están en el proyecto
  const availableMembers = orgMembers.filter(
    (orgMember) => !projectMembers.some((pm) => pm.userId === orgMember.userId)
  );

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Gestionar Miembros del Proyecto
            </h2>
            <p style={{ fontSize: "14px", color: "#6c757d", margin: "4px 0 0 0" }}>
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
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="loading">Cargando...</div>
        ) : (
          <>
            {/* Formulario para agregar miembro - Solo para proyectos organizacionales */}
            {!isPersonalProject && (
              <Card style={{ marginBottom: "24px", backgroundColor: "var(--bg-secondary)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
                  Agregar Miembro al Proyecto
                </h3>
                <form onSubmit={handleAddMember} style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                      Miembro del {t.organization}
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      disabled={adding || availableMembers.length === 0}
                      className="input"
                      required
                    >
                      <option value="">Selecciona un miembro</option>
                      {availableMembers.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.userName} ({member.userEmail})
                        </option>
                      ))}
                    </select>
                    {availableMembers.length === 0 && (
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        Todos los miembros del {t.organizationLower} ya están en el proyecto
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                      Rol en el Proyecto
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={adding}
                      className="input"
                    >
                      <option value="member">Miembro</option>
                      <option value="pm">Project Manager</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <Button type="submit" variant="primary" disabled={adding || !selectedUserId || availableMembers.length === 0} loading={adding}>
                    Agregar al Proyecto
                  </Button>
                </form>
              </Card>
            )}
            {isPersonalProject && (
              <Card style={{ marginBottom: "24px", backgroundColor: "#e3f2fd", border: "1px solid #90caf9" }}>
                <p style={{ fontSize: "14px", color: "#1976d2", margin: 0 }}>
                  ℹ️ Los proyectos personales solo muestran los miembros actuales. Para agregar miembros, considera crear un equipo u organización.
                </p>
              </Card>
            )}

            {/* Lista de miembros del proyecto */}
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
                Miembros del Proyecto ({projectMembers.length})
              </h3>
              {projectMembers.length === 0 ? (
                <div className="empty-state">
                  <p>No hay miembros asignados a este proyecto.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {projectMembers.map((member) => (
                    <div
                      key={member.userId}
                      style={{
                        padding: "16px",
                        border: "1px solid #dee2e6",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                          {member.userName}
                        </h4>
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                          {member.userEmail}
                        </p>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            backgroundColor: "#e7f3ff",
                            color: "#004085",
                            fontWeight: 600,
                            display: "inline-block",
                            marginTop: "8px",
                          }}
                        >
                          {member.role}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          border: "1px solid #dc3545",
                          borderRadius: "6px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#c82333";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#dc3545";
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
