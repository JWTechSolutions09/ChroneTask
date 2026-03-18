import { useEffect, useState, useCallback } from "react";
import { http } from "../api/http";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import InvitationsModal from "../components/InvitationsModal";
import { useToast } from "../contexts/ToastContext";
import { useTerminology } from "../hooks/useTerminology";

type Org = {
  id: string;
  name: string;
  slug?: string | null;
  createdAt?: string;
};

export default function Orgs() {
  const nav = useNavigate();
  const [items, setItems] = useState<Org[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [invitationsModalOrg, setInvitationsModalOrg] = useState<{ id: string; name: string } | null>(null);
  const { showToast } = useToast();
  const t = useTerminology();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth <= 768;
    return false;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await http.get("/api/orgs");
      setItems(res.data || []);
    } catch (ex: any) {
      let errorMessage = t.errorLoadingOrganizations;
      if (ex.response) {
        errorMessage = ex.response.data?.message || errorMessage;
      } else if (ex.request) {
        errorMessage = "No se pudo conectar con el servidor";
      } else {
        errorMessage = ex.message || errorMessage;
      }
      setErr(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const createOrg = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!name.trim()) {
      setErr("El nombre es requerido");
      return;
    }

    setErr(null);
    setCreating(true);
    try {
      await http.post("/api/orgs", { name: name.trim(), slug: slug.trim() || null });
      setName("");
      setSlug("");
      await load();
      showToast(t.organizationCreated, "success");
      // Redirigir a selección después de crear
      nav("/org-select");
    } catch (ex: any) {
      let errorMessage = t.errorCreatingOrganization;
      if (ex.response) {
        errorMessage = ex.response.data?.message || errorMessage;
      } else if (ex.request) {
        errorMessage = "No se pudo conectar con el servidor";
      } else {
        errorMessage = ex.message || errorMessage;
      }
      setErr(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (orgId: string, orgName: string) => {
    setConfirmDelete(orgId);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    setDeletingId(confirmDelete);
    setErr(null);
    try {
      await http.delete(`/api/orgs/${confirmDelete}`);
      showToast(t.organizationDeleted, "success");
      await load();
      
      // Si era la actual, redirigir a selección
      const currentOrgId = localStorage.getItem("currentOrgId");
      if (currentOrgId === confirmDelete) {
        localStorage.removeItem("currentOrgId");
        nav("/org-select", { replace: true });
      }
    } catch (ex: any) {
      let errorMessage = t.errorDeletingOrganization;
      if (ex.response) {
        errorMessage = ex.response.data?.message || errorMessage;
      } else if (ex.request) {
        errorMessage = "No se pudo conectar con el servidor";
      } else {
        errorMessage = ex.message || errorMessage;
      }
      setErr(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  return (
    <Layout>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title={t.organizations}
          subtitle={t.manageOrganizations}
          breadcrumbs={[{ label: t.organizations }]}
        />

        <div style={{ padding: "24px" }}>
          {/* Create Org Form */}
          <Card style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
              {t.createOrganization}
            </h2>
            <form onSubmit={createOrg} style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                    }}
                  >
                    Nombre *
                  </label>
                  <input
                    placeholder="Ej: Mi Empresa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={creating}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                    }}
                  >
                    Slug (opcional)
                  </label>
                  <input
                    placeholder="mi-empresa"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={creating}
                    className="input"
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!name.trim() || creating}
                loading={creating}
              >
                {t.createFirstOrganization}
              </Button>
            </form>
          </Card>

          {err && <div className="alert alert-error">{err}</div>}

          {loading ? (
            <div className="loading">{t.loadingOrganizations}</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <p>No hay {t.organizationsLower} todavía. Crea una para comenzar.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {items.map((o) => (
                <Card
                  key={o.id}
                  hover
                  className="hover-lift fade-in"
                  style={{ position: "relative" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <Link
                      to={`/org/${o.id}/dashboard`}
                      style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            margin: 0,
                            color: "var(--text-primary)",
                            marginBottom: "6px",
                            lineHeight: 1.3,
                          }}
                        >
                          {o.name}
                        </h3>
                        {o.slug && (
                          <div
                            style={{
                              fontSize: "13px",
                              color: "var(--text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>🔗</span>
                            <span>{o.slug}</span>
                          </div>
                        )}
                      </div>
                      {o.createdAt && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-tertiary)",
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>📅</span>
                          <span>Creado: {new Date(o.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}</span>
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isMobile) {
                          nav(`/org/${o.id}/invitations`);
                        } else {
                          setInvitationsModalOrg({ id: o.id, name: o.name });
                        }
                      }}
                      style={{
                        background: "none",
                        border: "1px solid var(--primary)",
                        cursor: "pointer",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        color: "var(--primary)",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        flexShrink: 0,
                        minWidth: "40px",
                        minHeight: "40px",
                      }}
                      title="Invitar miembros"
                      aria-label="Invitar miembros"
                      onMouseEnter={(e) => {
                        if (!isMobile) e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      ✉️
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(o.id, o.name);
                      }}
                      disabled={deletingId === o.id}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: deletingId === o.id ? "not-allowed" : "pointer",
                        padding: "8px",
                        borderRadius: "6px",
                        color: "#dc3545",
                        fontSize: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: deletingId === o.id ? 0.5 : 1,
                        transition: "all 0.2s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        if (deletingId !== o.id) {
                          e.currentTarget.style.backgroundColor = "#fee";
                          e.currentTarget.style.transform = "scale(1.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title={t.deleteOrganization}
                    >
                      {deletingId === o.id ? "⏳" : "🗑️"}
                    </button>
                  </div>

                  {/* Confirmación de eliminación */}
                  {confirmDelete === o.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(255, 255, 255, 0.98)",
                        borderRadius: "12px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "16px",
                        zIndex: 10,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        border: "2px solid #dc3545",
                      }}
                    >
                      <div style={{ fontSize: "48px" }}>⚠️</div>
                      <div style={{ textAlign: "center" }}>
                        <h4
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "8px",
                          }}
                        >
                          {t.deleteOrganizationConfirm}
                        </h4>
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
                          Esta acción no se puede deshacer. Se eliminarán todos los proyectos y tareas asociados.
                        </p>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#dc3545",
                            marginTop: "12px",
                          }}
                        >
                          {o.name}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                        <Button
                          variant="danger"
                          onClick={handleDeleteConfirm}
                          disabled={deletingId === o.id}
                          loading={deletingId === o.id}
                          style={{ flex: 1 }}
                        >
                          Eliminar
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleDeleteCancel}
                          disabled={deletingId === o.id}
                          style={{ flex: 1 }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Invitaciones */}
      {invitationsModalOrg && (
        <InvitationsModal
          organizationId={invitationsModalOrg.id}
          organizationName={invitationsModalOrg.name}
          isOpen={true}
          onClose={() => setInvitationsModalOrg(null)}
        />
      )}
    </Layout>
  );
}
