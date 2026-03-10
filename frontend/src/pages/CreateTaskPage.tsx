import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Layout from "../components/Layout";

export default function CreateTaskPage() {
  const { projectId, organizationId } = useParams<{ projectId: string; organizationId?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Task");
  const [priority, setPriority] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Si no hay projectId, redirigir
    if (!projectId) {
      showToast("Error: No se encontró el proyecto", "error");
      navigate(-1);
    }
  }, [projectId, navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await http.post(`/api/projects/${projectId}/tasks`, {
        title: title.trim(),
        description: description.trim() || null,
        type,
        priority: priority || null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        startDate: startDate || null,
        dueDate: dueDate || null,
      });
      showToast("Tarea creada exitosamente", "success");
      
      // Redirigir de vuelta al board
      if (organizationId) {
        navigate(`/org/${organizationId}/project/${projectId}/board`);
      } else {
        navigate(`/personal/project/${projectId}/board`);
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando tarea";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (organizationId) {
      navigate(`/org/${organizationId}/project/${projectId}/board`);
    } else {
      navigate(`/personal/project/${projectId}/board`);
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

  if (!projectId) {
    return null;
  }

  return (
    <Layout organizationId={organizationId}>
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
              Nueva Tarea
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
                Título <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ej: Implementar sistema de login"
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

            {/* Descripción */}
            <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
              <label style={labelStyle}>Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={20}
              placeholder="Describe detalladamente la tarea, requisitos, pasos a seguir, etc..."
              className="create-task-textarea"
              style={{
                ...inputStyle,
                resize: "vertical",
                height: "400px",
                minHeight: "400px",
                maxHeight: "700px",
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

            {/* Tipo y Prioridad */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr", 
              gap: "16px",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box" as const,
            }}>
              <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
                <label style={labelStyle}>Tipo</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="Task">📋 Tarea</option>
                  <option value="Bug">🐛 Bug</option>
                  <option value="Story">📖 Historia</option>
                  <option value="Epic">🎯 Épica</option>
                </select>
              </div>

              <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
                <label style={labelStyle}>Prioridad</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="">Sin prioridad</option>
                  <option value="Low">🟢 Baja</option>
                  <option value="Medium">🟡 Media</option>
                  <option value="High">🟠 Alta</option>
                  <option value="Critical">🔴 Crítica</option>
                </select>
              </div>
            </div>

            {/* Tiempo estimado */}
            <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
              <label style={labelStyle}>Tiempo estimado (minutos)</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="Ej: 120 (2 horas)"
                min="0"
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
              <div style={{ 
                fontSize: "13px", 
                color: "var(--text-secondary)", 
                marginTop: "8px",
                lineHeight: "1.4",
              }}>
                Tiempo aproximado que tomará completar esta tarea
              </div>
            </div>

            {/* Fechas */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr", 
              gap: "16px",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box" as const,
            }}>
              <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
                <label style={labelStyle}>Fecha de inicio</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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

              <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
                <label style={labelStyle}>Fecha límite</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                disabled={loading || !title.trim()}
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
                  cursor: loading || !title.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !title.trim() ? 0.6 : 1,
                  boxSizing: "border-box" as const,
                }}
              >
                {loading ? "Creando..." : "✨ Crear Tarea"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
