import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import InvitationsBody from "../components/InvitationsBody";
import { http } from "../api/http";

export default function InvitationsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = React.useState<string>("Equipo");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!organizationId) return null;

  React.useEffect(() => {
    (async () => {
      try {
        const res = await http.get("/api/orgs");
        const orgs = res.data || [];
        const org = orgs.find((o: any) => o.id === organizationId);
        if (org?.name) setOrganizationName(org.name);
      } catch {
        // ignore
      }
    })();
  }, [organizationId]);

  return (
    <Layout organizationId={organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)", minHeight: "100vh" }}>
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-primary)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>✉️ Invitaciones</div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Link de invitación para tu equipo</div>
            </div>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "var(--hover-bg)",
                border: "1px solid var(--border-color)",
                fontSize: "18px",
                cursor: "pointer",
                color: "var(--text-primary)",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Volver"
              title="Volver"
            >
              ←
            </button>
          </div>
        </div>

        <div style={{ padding: "12px", maxWidth: "900px", margin: "0 auto" }}>
          <InvitationsBody organizationId={organizationId} organizationName={organizationName} />
        </div>
      </div>
    </Layout>
  );
}

