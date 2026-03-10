import React, { useState, useEffect } from "react";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";

type CreateTaskModalProps = {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateTaskModal({
  projectId,
  onClose,
  onSuccess,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Task");
  const [priority, setPriority] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return true;
  });
  const { showToast } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

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
      onSuccess();
      onClose();
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando tarea";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Estilos base para inputs
  const inputStyle = {
    padding: isMobile && isPortrait ? "12px" : isMobile ? "14px" : "14px 16px",
    fontSize: isMobile && isPortrait ? "16px" : isMobile ? "16px" : "15px",
    borderRadius: "10px",
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
    marginBottom: isMobile && isPortrait ? "8px" : isMobile ? "10px" : "10px",
    fontSize: isMobile && isPortrait ? "14px" : isMobile ? "15px" : "15px",
    fontWeight: 600,
    color: "var(--text-primary)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      className="create-task-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
        overflowY: isMobile ? "auto" : "hidden",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
      onClick={onClose}
    >
      <div
        className="create-task-modal-content"
        style={{
          width: isMobile ? "100vw" : "95%",
          maxWidth: isMobile ? "100vw" : "700px",
          minWidth: isMobile ? "100vw" : "auto",
          minHeight: isMobile && isPortrait ? "100dvh" : isMobile ? "100vh" : "auto",
          maxHeight: isMobile && isPortrait ? "100dvh" : isMobile ? "100vh" : "95vh",
          height: isMobile && isPortrait ? "100dvh" : isMobile ? "100vh" : "auto",
          overflowY: "auto",
          overflowX: "hidden",
          borderRadius: isMobile ? "0" : "16px",
          boxShadow: isMobile ? "none" : "0 20px 60px rgba(0, 0, 0, 0.3)",
          border: isMobile ? "none" : "1px solid rgba(0, 0, 0, 0.1)",
          padding: isMobile && isPortrait ? "16px 12px" : isMobile ? "20px 16px" : "32px",
          margin: 0,
          backgroundColor: "var(--bg-primary)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box" as const,
          WebkitOverflowScrolling: "touch",
          // Forzar ancho completo en móvil
          ...(isMobile && {
            width: "100vw",
            maxWidth: "100vw",
            minWidth: "100vw",
          }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: isMobile && isPortrait ? "16px" : isMobile ? "20px" : "28px",
            paddingBottom: isMobile && isPortrait ? "12px" : isMobile ? "16px" : "20px",
            borderBottom: "2px solid var(--border-color)",
            position: "relative",
            boxSizing: "border-box" as const,
            flexShrink: 0,
          }}
        >
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile && isPortrait ? "20px" : isMobile ? "22px" : "28px", 
            fontWeight: 700, 
            color: "var(--text-primary)",
            textAlign: "center",
            width: "100%",
            paddingRight: isMobile ? "40px" : "0",
            boxSizing: "border-box" as const,
          }}>
            Nueva Tarea
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "var(--hover-bg)",
              border: "1px solid var(--border-color)",
              fontSize: isMobile && isPortrait ? "20px" : "24px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              width: isMobile && isPortrait ? "32px" : isMobile ? "36px" : "40px",
              height: isMobile && isPortrait ? "32px" : isMobile ? "36px" : "40px",
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
            title="Cerrar"
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
            gap: isMobile && isPortrait ? "16px" : isMobile ? "18px" : "20px",
            margin: 0,
            padding: 0,
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
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
              rows={isMobile && isPortrait ? 3 : isMobile ? 4 : 5}
              placeholder="Describe detalladamente la tarea, requisitos, pasos a seguir, etc..."
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: isMobile && isPortrait ? "80px" : isMobile ? "100px" : "120px",
                fontFamily: "inherit",
                lineHeight: "1.6",
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
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
            gap: isMobile && isPortrait ? "16px" : isMobile ? "18px" : "16px",
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
              fontSize: isMobile && isPortrait ? "12px" : "13px", 
              color: "var(--text-secondary)", 
              marginTop: isMobile && isPortrait ? "6px" : "8px",
              lineHeight: "1.4",
            }}>
              Tiempo aproximado que tomará completar esta tarea
            </div>
          </div>

          {/* Fechas */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
            gap: isMobile && isPortrait ? "16px" : isMobile ? "18px" : "16px",
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
            flexDirection: isMobile ? "column-reverse" : "row",
            gap: isMobile && isPortrait ? "10px" : "12px", 
            justifyContent: "flex-end", 
            marginTop: isMobile && isPortrait ? "4px" : "8px",
            paddingTop: isMobile && isPortrait ? "16px" : "20px",
            borderTop: "2px solid var(--border-color)",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box" as const,
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: isMobile && isPortrait ? "14px" : isMobile ? "16px" : "12px 24px",
                fontSize: isMobile && isPortrait ? "14px" : "15px",
                fontWeight: 600,
                borderRadius: "10px",
                border: "2px solid var(--border-color)",
                transition: "all 0.2s",
                width: isMobile ? "100%" : "auto",
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
                padding: isMobile && isPortrait ? "14px" : isMobile ? "16px" : "12px 24px",
                fontSize: isMobile && isPortrait ? "14px" : "15px",
                fontWeight: 600,
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
                transition: "all 0.2s",
                width: isMobile ? "100%" : "auto",
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
  );
}
