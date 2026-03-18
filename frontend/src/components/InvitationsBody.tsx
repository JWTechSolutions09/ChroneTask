import React, { useCallback, useEffect, useState } from "react";
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

type InvitationsBodyProps = {
  organizationId: string;
  organizationName: string;
  enabled?: boolean;
};

export default function InvitationsBody({ organizationId, organizationName, enabled = true }: InvitationsBodyProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadInvitations = useCallback(async () => {
    if (!enabled) return;

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
  }, [enabled, organizationId, showToast]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

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

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Invitar Miembros</h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>{organizationName}</p>
      </div>

      {/* Create */}
      <Card style={{ backgroundColor: "var(--bg-secondary)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
          Crear Nueva Invitación
        </h3>
        <form onSubmit={createInvitation} style={{ display: "grid", gap: "12px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-secondary)",
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
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Si no especificas un email, cualquiera podrá usar este link
            </p>
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              Rol
            </label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} disabled={creating} className="input">
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

      {/* List */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary)" }}>
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
                  backgroundColor: inv.isUsed ? "var(--bg-tertiary)" : "var(--bg-primary)",
                  border: isExpired(inv.expiresAt) ? "2px solid #ffc107" : "1px solid var(--border-color)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {inv.email ? inv.email : "Link público"}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {inv.role}
                      </span>
                      {inv.isUsed && (
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>✅ Usada</span>
                      )}
                      {isExpired(inv.expiresAt) && (
                        <span style={{ fontSize: "12px", color: "#ffc107", fontWeight: 700 }}>⏳ Expirada</span>
                      )}
                    </div>
                    {inv.invitationLink && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => copyLink(inv.invitationLink!, inv.token)}
                          style={{ flex: "1 1 180px" }}
                        >
                          {copiedLink === inv.token ? "✅ Copiado" : "📋 Copiar link"}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => deleteInvitation(inv.id)}
                          disabled={deletingId === inv.id}
                          loading={deletingId === inv.id}
                          style={{ flex: "0 0 auto" }}
                        >
                          🗑️
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

