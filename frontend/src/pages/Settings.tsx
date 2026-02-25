import React, { useState, useEffect, useCallback } from "react";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";

type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  createdAt: string;
  organizations: Array<{
    organizationId: string;
    organizationName: string;
    role: string;
    joinedAt: string;
  }>;
};

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "organizations">("profile");
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { showToast } = useToast();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get("/api/users/me");
      setProfile(res.data);
      setFullName(res.data.fullName || "");
      setProfilePictureUrl(res.data.profilePictureUrl || "");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando perfil";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await http.patch("/api/users/me", {
        fullName: fullName.trim(),
        profilePictureUrl: profilePictureUrl.trim() || null,
      });
      await loadProfile();
      showToast("Perfil actualizado exitosamente", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error actualizando perfil";
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    setChangingPassword(true);
    try {
      await http.patch("/api/users/me/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Contraseña cambiada exitosamente", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cambiando contraseña";
      showToast(errorMsg, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      org_admin: "Administrador",
      pm: "Project Manager",
      member: "Miembro",
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
          <div className="loading">Cargando perfil...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#f8f9fa" }}>
        <PageHeader
          title="Configuración"
          subtitle="Gestiona tu perfil y preferencias"
          breadcrumbs={[
            { label: "Organizaciones", to: "/org-select" },
            { label: "Configuración" },
          ]}
        />

        <div style={{ padding: "24px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "2px solid #dee2e6" }}>
            <button
              onClick={() => setActiveTab("profile")}
              style={{
                padding: "12px 20px",
                border: "none",
                borderBottom: activeTab === "profile" ? "3px solid #007bff" : "3px solid transparent",
                backgroundColor: "transparent",
                color: activeTab === "profile" ? "#007bff" : "#6c757d",
                cursor: "pointer",
                fontWeight: activeTab === "profile" ? 600 : 400,
                fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              👤 Perfil
            </button>
            <button
              onClick={() => setActiveTab("password")}
              style={{
                padding: "12px 20px",
                border: "none",
                borderBottom: activeTab === "password" ? "3px solid #007bff" : "3px solid transparent",
                backgroundColor: "transparent",
                color: activeTab === "password" ? "#007bff" : "#6c757d",
                cursor: "pointer",
                fontWeight: activeTab === "password" ? 600 : 400,
                fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              🔒 Contraseña
            </button>
            <button
              onClick={() => setActiveTab("organizations")}
              style={{
                padding: "12px 20px",
                border: "none",
                borderBottom: activeTab === "organizations" ? "3px solid #007bff" : "3px solid transparent",
                backgroundColor: "transparent",
                color: activeTab === "organizations" ? "#007bff" : "#6c757d",
                cursor: "pointer",
                fontWeight: activeTab === "organizations" ? 600 : 400,
                fontSize: "14px",
                transition: "all 0.2s",
              }}
            >
              🏢 Organizaciones
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "#212529" }}>
                Información del Perfil
              </h2>
              <form onSubmit={handleSaveProfile} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#495057" }}>
                    Foto de Perfil (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    disabled={saving}
                    className="input"
                  />
                  {profilePictureUrl && (
                    <div style={{ marginTop: "12px" }}>
                      <img
                        src={profilePictureUrl}
                        alt="Preview"
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #dee2e6",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#495057" }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#495057" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="input"
                    style={{ backgroundColor: "#f8f9fa", color: "#6c757d" }}
                  />
                  <p style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                    El email no se puede cambiar
                  </p>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#495057" }}>
                    Miembro desde
                  </label>
                  <input
                    type="text"
                    value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) : ""}
                    disabled
                    className="input"
                    style={{ backgroundColor: "#f8f9fa", color: "#6c757d" }}
                  />
                </div>
                <Button type="submit" variant="primary" disabled={saving} loading={saving}>
                  Guardar Cambios
                </Button>
              </form>
            </Card>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <Card>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "#212529" }}>
                Cambiar Contraseña
              </h2>
              <form onSubmit={handleChangePassword} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#495057" }}>
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    placeholder="Ingresa tu contraseña actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={changingPassword}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#495057" }}>
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changingPassword}
                    required
                    minLength={6}
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500, color: "#495057" }}>
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={changingPassword}
                    required
                    minLength={6}
                    className="input"
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ color: "#dc3545", fontSize: "12px", marginTop: "4px" }}>
                      Las contraseñas no coinciden
                    </p>
                  )}
                </div>
                <Button type="submit" variant="primary" disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword} loading={changingPassword}>
                  Cambiar Contraseña
                </Button>
              </form>
            </Card>
          )}

          {/* Organizations Tab */}
          {activeTab === "organizations" && (
            <Card>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "#212529" }}>
                Mis Organizaciones
              </h2>
              {profile?.organizations && profile.organizations.length > 0 ? (
                <div style={{ display: "grid", gap: "12px" }}>
                  {profile.organizations.map((org) => (
                    <div
                      key={org.organizationId}
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
                        <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#212529" }}>
                          {org.organizationName}
                        </h3>
                        <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px", color: "#6c757d" }}>
                          <span>Rol: <strong>{getRoleLabel(org.role)}</strong></span>
                          <span>•</span>
                          <span>Unido: {new Date(org.joinedAt).toLocaleDateString("es-ES")}</span>
                        </div>
                      </div>
                      <a
                        href={`/org/${org.organizationId}/dashboard`}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#007bff",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        Ir a Dashboard
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No perteneces a ninguna organización todavía.</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
