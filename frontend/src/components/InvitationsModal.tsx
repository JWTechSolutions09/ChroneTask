import React, { useState, useEffect, useCallback } from "react";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Button from "./Button";
import Card from "./Card";

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
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadInvitations = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const res = await http.get(`/api/orgs/${organizationId}/invitations`);
      setInvitations(res.data || []);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando invitaciones";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, isOpen, showToast]);

  useEffect(() => {
    if (isOpen) {
      loadInvitations();
    }
  }, [isOpen, loadInvitations]);

  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await http.post(`/api/orgs/${organizationId}/invitations`, {
        email: inviteEmail.trim() || null,
        role: inviteRole,
        expirationDays: 30,
      });
      
      await loadInvitations();
      setInviteEmail("");
      showToast("Invitación creada exitosamente", "success");
      
      // Copiar link automáticamente
      if (res.data?.invitationLink) {
        navigator.clipboard.writeText(res.data.invitationLink);
        setCopiedLink(res.data.token);
        showToast("Link copiado al portapapeles", "success");
        setTimeout(() => setCopiedLink(null), 3000);
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando invitación";
      showToast(errorMsg, "error");
    } finally {
      setCreating(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    setDeletingId(invitationId);
    try {
      await http.delete(`/api/orgs/${organizationId}/invitations/${invitationId}`);
      await loadInvitations();
      showToast("Invitación eliminada exitosamente", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error eliminando invitación";
      showToast(errorMsg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const copyLink = (link: string, token: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(token);
    showToast("Link copiado al portapapeles", "success");
    setTimeout(() => setCopiedLink(null), 3000);
  };

  if (!isOpen) return null;

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

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
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#212529" }}>
              Invitar Miembros
            </h2>
            <p style={{ fontSize: "14px", color: "#6c757d", margin: "4px 0 0 0" }}>
              {organizationName}
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

        {/* Formulario para crear invitación */}
        <Card style={{ marginBottom: "24px", backgroundColor: "#f8f9fa" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#212529" }}>
            Crear Nueva Invitación
          </h3>
          <form onSubmit={createInvitation} style={{ display: "grid", gap: "12px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#495057",
                }}
              >
                Email (opcional)
              </label>
              <input
                type="email"
                placeholder="usuario@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={creating}
                className="input"
              />
              <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                Si no especificas un email, cualquiera podrá usar este link
              </p>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#495057",
                }}
              >
                Rol
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={creating}
                className="input"
              >
                <option value="member">Miembro</option>
                <option value="pm">Project Manager</option>
                <option value="org_admin">Administrador</option>
              </select>
            </div>
            <Button type="submit" variant="primary" disabled={creating} loading={creating}>
              Generar Link de Invitación
            </Button>
          </form>
        </Card>

        {/* Lista de invitaciones */}
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#212529" }}>
            Invitaciones Activas
          </h3>
          {loading ? (
            <div className="loading">Cargando invitaciones...</div>
          ) : invitations.length === 0 ? (
            <div className="empty-state">
              <p>No hay invitaciones. Crea una para invitar miembros.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {invitations.map((inv) => (
                <Card
                  key={inv.id}
                  style={{
                    padding: "16px",
                    backgroundColor: inv.isUsed ? "#f8f9fa" : "#fff",
                    border: isExpired(inv.expiresAt) ? "2px solid #ffc107" : "1px solid #dee2e6",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 600, color: "#212529" }}>
                          {inv.email || "Sin email específico"}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: inv.isUsed
                              ? "#e9ecef"
                              : isExpired(inv.expiresAt)
                              ? "#fff3cd"
                              : "#d1ecf1",
                            color: inv.isUsed
                              ? "#6c757d"
                              : isExpired(inv.expiresAt)
                              ? "#856404"
                              : "#0c5460",
                          }}
                        >
                          {inv.isUsed
                            ? "Usada"
                            : isExpired(inv.expiresAt)
                            ? "Expirada"
                            : "Activa"}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: "#e7f3ff",
                            color: "#004085",
                          }}
                        >
                          {inv.role}
                        </span>
                      </div>
                      {inv.invitationLink && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            backgroundColor: "#f8f9fa",
                            padding: "8px",
                            borderRadius: "6px",
                            marginBottom: "8px",
                            wordBreak: "break-all",
                            fontFamily: "monospace",
                          }}
                        >
                          {inv.invitationLink}
                        </div>
                      )}
                      <div style={{ fontSize: "11px", color: "#adb5bd" }}>
                        Expira: {new Date(inv.expiresAt).toLocaleDateString("es-ES")}
                        {inv.isUsed && inv.usedAt && (
                          <> • Usada: {new Date(inv.usedAt).toLocaleDateString("es-ES")}</>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      {inv.invitationLink && !inv.isUsed && (
                        <button
                          onClick={() => copyLink(inv.invitationLink!, inv.token)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            border: "1px solid #007bff",
                            borderRadius: "6px",
                            backgroundColor: copiedLink === inv.token ? "#0056b3" : "#007bff",
                            color: "white",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (copiedLink !== inv.token) {
                              e.currentTarget.style.backgroundColor = "#0056b3";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (copiedLink !== inv.token) {
                              e.currentTarget.style.backgroundColor = "#007bff";
                            }
                          }}
                        >
                          {copiedLink === inv.token ? "✓ Copiado" : "Copiar Link"}
                        </button>
                      )}
                      <button
                        onClick={() => deleteInvitation(inv.id)}
                        disabled={deletingId === inv.id}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          border: "1px solid #dc3545",
                          borderRadius: "6px",
                          backgroundColor: deletingId === inv.id ? "#c82333" : "#dc3545",
                          color: "white",
                          cursor: deletingId === inv.id ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {deletingId === inv.id ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
