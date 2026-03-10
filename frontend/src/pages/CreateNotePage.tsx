import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Layout from "../components/Layout";
import { useUserUsageType } from "../hooks/useUserUsageType";
import { useLocation } from "react-router-dom";

const NOTE_COLORS = [
  "#FFE5E5", "#FFE5F1", "#F0E5FF", "#E5F0FF", "#E5FFF0",
  "#FFF5E5", "#FFE5E5", "#E5FFE5", "#E5E5FF", "#FFE5FF"
];

export default function CreateNotePage() {
  const { projectId, organizationId } = useParams<{ projectId?: string; organizationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usageType } = useUserUsageType();
  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;
  const isPersonalNotes = !projectId;
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      let res;
      if (isPersonalNotes) {
        // Crear nota personal
        res = await http.post("/api/users/me/personal-notes", {
          title: title.trim() || "Nueva Nota",
          content: content.trim() || "",
          color: color,
          positionX: 50,
          positionY: 50,
          width: 280,
          height: 200,
        });
      } else {
        // Crear nota de proyecto
        const endpoint = isPersonalMode || isPersonalRoute
          ? `/api/users/me/projects/${projectId}/notes`
          : `/api/orgs/${organizationId}/projects/${projectId}/notes`;
        res = await http.post(endpoint, {
          title: title.trim() || "Nueva Nota",
          content: content.trim() || "",
          color: color,
          positionX: 50,
          positionY: 50,
          width: 280,
          height: 200,
        });
      }
      
      showToast("Nota creada exitosamente", "success");
      
      // Redirigir de vuelta a notas
      if (isPersonalNotes || isPersonalMode || isPersonalRoute) {
        navigate("/personal/notes");
      } else if (organizationId && projectId) {
        navigate(`/org/${organizationId}/project/${projectId}/notes`);
      } else {
        navigate(-1);
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando nota";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isPersonalNotes || isPersonalMode || isPersonalRoute) {
      navigate("/personal/notes");
    } else if (organizationId && projectId) {
      navigate(`/org/${organizationId}/project/${projectId}/notes`);
    } else {
      navigate(-1);
    }
  };

  // Estilos optimizados para móvil
  const inputStyle = {
    padding: "16px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "2px solid var(--border-color)",
    transition: "all 0.2s",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box" as const,
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--text-primary)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute || isPersonalNotes ? undefined : organizationId}>
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        backgroundColor: "var(--bg-secondary)",
        minHeight: "100vh",
      }}>
        <div style={{
          maxWidth: "100%",
          width: "100%",
          padding: "16px",
          boxSizing: "border-box" as const,
        }}>
          {/* Header */}
          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "2px solid var(--border-color)",
              position: "relative",
              boxSizing: "border-box" as const,
            }}
          >
            <h1 style={{ 
              margin: 0, 
              fontSize: "24px", 
              fontWeight: 700, 
              color: "var(--text-primary)",
              textAlign: "center",
              width: "100%",
              paddingRight: "40px",
              boxSizing: "border-box" as const,
            }}>
              Nueva Nota
            </h1>
            <button
              onClick={handleCancel}
              style={{
                background: "var(--hover-bg)",
                border: "1px solid var(--border-color)",
                fontSize: "24px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
                position: "absolute",
                right: 0,
                top: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              title="Volver"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form 
            onSubmit={handleSubmit} 
            style={{ 
              width: "100%", 
              maxWidth: "100%", 
              boxSizing: "border-box" as const,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              margin: 0,
              padding: 0,
            }}
          >
            {/* Título */}
            <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
              <label style={labelStyle}>
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la nota..."
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-color)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Contenido */}
            <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
              <label style={labelStyle}>Contenido</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={25}
                placeholder="Escribe el contenido de tu nota..."
                className="create-note-textarea"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  height: "450px",
                  minHeight: "450px",
                  maxHeight: "800px",
                  fontFamily: "inherit",
                  lineHeight: "1.8",
                  fontSize: "16px",
                  padding: "18px",
                  width: "100%",
                  boxSizing: "border-box" as const,
                  display: "block",
                  overflowY: "auto",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-color)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Color */}
            <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
              <label style={labelStyle}>Color</label>
              <div style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                gap: "12px",
                width: "100%",
                justifyContent: "flex-start",
                alignItems: "center",
                overflowX: "auto",
                paddingBottom: "4px",
              }}>
                {NOTE_COLORS.map((noteColor) => (
                  <button
                    key={noteColor}
                    type="button"
                    onClick={() => setColor(noteColor)}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      border: color === noteColor ? "3px solid var(--primary)" : "2px solid var(--border-color)",
                      backgroundColor: noteColor,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: color === noteColor ? "0 4px 12px rgba(0, 123, 255, 0.3)" : "0 2px 4px rgba(0, 0, 0, 0.1)",
                      transform: color === noteColor ? "scale(1.1)" : "scale(1)",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (color !== noteColor) {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (color !== noteColor) {
                        e.currentTarget.style.transform = "scale(1)";
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div 
                className="alert alert-error" 
                style={{ 
                  padding: "14px", 
                  borderRadius: "10px",
                  fontSize: "14px",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box" as const,
                }}
              >
                {error}
              </div>
            )}

            {/* Botones */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column-reverse",
              gap: "12px", 
              justifyContent: "flex-end", 
              marginTop: "8px",
              paddingTop: "20px",
              borderTop: "2px solid var(--border-color)",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box" as const,
            }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  padding: "16px",
                  fontSize: "15px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  border: "2px solid var(--border-color)",
                  transition: "all 0.2s",
                  width: "100%",
                  backgroundColor: "var(--hover-bg)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  boxSizing: "border-box" as const,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "16px",
                  fontSize: "15px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
                  transition: "all 0.2s",
                  width: "100%",
                  backgroundColor: "var(--primary)",
                  color: "white",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  boxSizing: "border-box" as const,
                }}
              >
                {loading ? "Creando..." : "✨ Crear Nota"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
