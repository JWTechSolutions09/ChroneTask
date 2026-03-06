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
  const { showToast } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
        overflowY: isMobile ? "auto" : "hidden",
        WebkitOverflowScrolling: "touch",
      }}
      onClick={onClose}
    >
      <div
        className="create-task-modal-content"
        style={{
          maxWidth: isMobile ? "100vw" : "700px",
          width: isMobile ? "100vw" : "95%",
          minWidth: isMobile ? "100vw" : "auto",
          minHeight: isMobile ? "100vh" : "auto",
          maxHeight: isMobile ? "100vh" : "95vh",
          height: isMobile ? "100vh" : "auto",
          overflowY: "auto",
          borderRadius: isMobile ? "0" : "16px",
          boxShadow: isMobile ? "none" : "0 20px 60px rgba(0, 0, 0, 0.3)",
          border: isMobile ? "none" : "1px solid rgba(0, 0, 0, 0.1)",
          padding: isMobile ? "20px 16px" : "32px",
          margin: isMobile ? "0" : "auto",
          backgroundColor: "var(--bg-primary)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          flex: isMobile ? "1 1 100%" : "0 1 auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isMobile ? "20px" : "28px",
            paddingBottom: isMobile ? "16px" : "20px",
            borderBottom: "2px solid var(--border-color)",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "var(--text-primary)", marginBottom: isMobile ? "2px" : "4px" }}>
              Nueva Tarea
            </h2>
            {!isMobile && (
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                Completa los detalles de la nueva tarea
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--hover-bg)",
              border: "1px solid var(--border-color)",
              fontSize: isMobile ? "28px" : "24px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              width: isMobile ? "36px" : "40px",
              height: isMobile ? "36px" : "40px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              flexShrink: 0,
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

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: isMobile ? "16px" : "20px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: isMobile ? "8px" : "10px",
                fontSize: isMobile ? "14px" : "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Título <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input"
              placeholder="Ej: Implementar sistema de login"
              style={{
                padding: isMobile ? "12px 14px" : "14px 16px",
                fontSize: isMobile ? "16px" : "15px",
                borderRadius: "10px",
                border: "2px solid var(--border-color)",
                transition: "all 0.2s",
                width: "100%",
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

          <div>
            <label
              style={{
                display: "block",
                marginBottom: isMobile ? "8px" : "10px",
                fontSize: isMobile ? "14px" : "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea"
              rows={isMobile ? 4 : 5}
              placeholder="Describe detalladamente la tarea, requisitos, pasos a seguir, etc..."
              style={{
                padding: isMobile ? "12px 14px" : "14px 16px",
                fontSize: isMobile ? "16px" : "15px",
                borderRadius: "10px",
                border: "2px solid var(--border-color)",
                transition: "all 0.2s",
                resize: "vertical",
                minHeight: isMobile ? "100px" : "120px",
                fontFamily: "inherit",
                lineHeight: "1.6",
                width: "100%",
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

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "16px" : "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: isMobile ? "8px" : "10px",
                  fontSize: isMobile ? "14px" : "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Tipo
              </label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)} 
                className="select"
                style={{
                  padding: isMobile ? "12px 14px" : "14px 16px",
                  fontSize: isMobile ? "16px" : "15px",
                  borderRadius: "10px",
                  border: "2px solid var(--border-color)",
                  transition: "all 0.2s",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  width: "100%",
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

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: isMobile ? "8px" : "10px",
                  fontSize: isMobile ? "14px" : "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="select"
                style={{
                  padding: isMobile ? "12px 14px" : "14px 16px",
                  fontSize: isMobile ? "16px" : "15px",
                  borderRadius: "10px",
                  border: "2px solid var(--border-color)",
                  transition: "all 0.2s",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  width: "100%",
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

          <div>
            <label
              style={{
                display: "block",
                marginBottom: isMobile ? "8px" : "10px",
                fontSize: isMobile ? "14px" : "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Tiempo estimado (minutos)
            </label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="input"
              placeholder="Ej: 120 (2 horas)"
              min="0"
              style={{
                padding: isMobile ? "12px 14px" : "14px 16px",
                fontSize: isMobile ? "16px" : "15px",
                borderRadius: "10px",
                border: "2px solid var(--border-color)",
                transition: "all 0.2s",
                width: "100%",
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
            <div style={{ fontSize: isMobile ? "12px" : "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Tiempo aproximado que tomará completar esta tarea
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "16px" : "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: isMobile ? "8px" : "10px",
                  fontSize: isMobile ? "14px" : "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Fecha de inicio
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                style={{
                  padding: isMobile ? "12px 14px" : "14px 16px",
                  fontSize: isMobile ? "16px" : "15px",
                  borderRadius: "10px",
                  border: "2px solid var(--border-color)",
                  transition: "all 0.2s",
                  width: "100%",
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

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: isMobile ? "8px" : "10px",
                  fontSize: isMobile ? "14px" : "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Fecha límite
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
                style={{
                  padding: isMobile ? "12px 14px" : "14px 16px",
                  fontSize: isMobile ? "16px" : "15px",
                  borderRadius: "10px",
                  border: "2px solid var(--border-color)",
                  transition: "all 0.2s",
                  width: "100%",
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
          </div>

          {error && (
            <div 
              className="alert alert-error" 
              style={{ 
                padding: isMobile ? "12px 14px" : "14px 16px", 
                borderRadius: "10px",
                fontSize: isMobile ? "13px" : "14px",
                marginTop: "8px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ 
            display: "flex", 
            flexDirection: isMobile ? "column-reverse" : "row",
            gap: isMobile ? "12px" : "12px", 
            justifyContent: "flex-end", 
            marginTop: "8px",
            paddingTop: isMobile ? "16px" : "20px",
            borderTop: "2px solid var(--border-color)",
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
              style={{
                padding: isMobile ? "14px 20px" : "12px 24px",
                fontSize: isMobile ? "15px" : "15px",
                fontWeight: 600,
                borderRadius: "10px",
                border: "2px solid var(--border-color)",
                transition: "all 0.2s",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !title.trim()}
              style={{
                padding: isMobile ? "14px 20px" : "12px 24px",
                fontSize: isMobile ? "15px" : "15px",
                fontWeight: 600,
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
                transition: "all 0.2s",
                width: isMobile ? "100%" : "auto",
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
