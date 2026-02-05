import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import { useToast } from "../contexts/ToastContext";

type Org = {
  id: string;
  name: string;
  slug?: string | null;
  createdAt?: string;
};

export default function OrgSelect() {
  const nav = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await http.get("/api/orgs");
      setOrgs(res.data || []);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando organizaciones";
      setErr(errorMsg);
      console.error("Error cargando organizaciones:", ex);
      // No mostrar toast aquí para evitar spam, pero sí loguear el error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  const selectOrg = (orgId: string) => {
    const selectedOrg = orgs.find((o) => o.id === orgId);
    localStorage.setItem("currentOrgId", orgId);
    if (selectedOrg) {
      showToast(`Organización "${selectedOrg.name}" seleccionada`, "success");
    }
    nav(`/org/${orgId}/dashboard`);
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
          <div className="loading">Cargando organizaciones...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#f8f9fa" }}>
        <PageHeader
          title="Selecciona una organización"
          subtitle={
            orgs.length > 0
              ? `${orgs.length} ${orgs.length === 1 ? "organización disponible" : "organizaciones disponibles"}`
              : "No tienes organizaciones"
          }
          breadcrumbs={[{ label: "Organizaciones" }]}
        />

        <div style={{ padding: "24px" }}>
          {err && <div className="alert alert-error">{err}</div>}

          {orgs.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "60px 40px" }}>
              <div className="empty-state-icon" style={{ fontSize: "64px", marginBottom: "20px" }}>
                🏢
              </div>
              <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#212529", marginBottom: "12px" }}>
                No tienes organizaciones
              </h3>
              <p style={{ fontSize: "16px", color: "#6c757d", marginBottom: "24px" }}>
                Crea tu primera organización para comenzar a gestionar proyectos y tareas
              </p>
              <a
                href="/orgs"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: "#007bff",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#0056b3";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 123, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#007bff";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Crear Organización
              </a>
            </Card>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {orgs.map((org) => (
                <Card
                  key={org.id}
                  hover
                  className="hover-lift fade-in"
                  onClick={() => selectOrg(org.id)}
                  style={{
                    cursor: "pointer",
                    padding: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "28px",
                        fontWeight: 700,
                        flexShrink: 0,
                        boxShadow: "0 4px 6px rgba(0, 123, 255, 0.3)",
                      }}
                    >
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          margin: 0,
                          color: "#212529",
                          marginBottom: "6px",
                          lineHeight: 1.3,
                        }}
                      >
                        {org.name}
                      </h3>
                      {org.slug && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6c757d",
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>🔗</span>
                          <span>{org.slug}</span>
                        </div>
                      )}
                      {org.createdAt && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#adb5bd",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>📅</span>
                          <span>Creado: {new Date(org.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}</span>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        color: "#007bff",
                        opacity: 0.5,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.5";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      →
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
