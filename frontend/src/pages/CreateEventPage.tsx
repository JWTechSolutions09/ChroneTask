import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import Layout from "../components/Layout";

const EVENT_COLORS = [
  "#007bff", "#28a745", "#dc3545", "#ffc107", "#17a2b8",
  "#6f42c1", "#e83e8c", "#fd7e14", "#20c997", "#6c757d"
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0]);
  const [eventType, setEventType] = useState("event");
  const [allDay, setAllDay] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Si hay una fecha en los query params, usarla
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const date = new Date(dateParam);
      const dateStr = date.toISOString().split("T")[0];
      const timeStr = new Date().toTimeString().slice(0, 5);
      setEventStartDate(dateStr);
      setEventStartTime(timeStr);
      setEventEndDate(dateStr);
      setEventEndTime(timeStr);
    } else {
      // Si no, usar fecha actual
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const timeStr = today.toTimeString().slice(0, 5);
      setEventStartDate(dateStr);
      setEventStartTime(timeStr);
      setEventEndDate(dateStr);
      setEventEndTime(timeStr);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setError("El título es requerido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startDateTime = allDay
        ? new Date(eventStartDate + "T00:00:00")
        : new Date(eventStartDate + "T" + eventStartTime);
      const endDateTime = allDay
        ? eventEndDate
          ? new Date(eventEndDate + "T23:59:59")
          : new Date(eventStartDate + "T23:59:59")
        : eventEndDate && eventEndTime
          ? new Date(eventEndDate + "T" + eventEndTime)
          : startDateTime;

      const eventData = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        color: eventColor,
        type: eventType,
        allDay,
        hasReminder,
        reminderMinutesBefore: hasReminder ? reminderMinutes : null,
      };

      await http.post("/api/users/me/calendar-events", eventData);
      showToast("Evento creado exitosamente", "success");

      // Redirigir de vuelta al calendario
      navigate("/personal/calendar");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando evento";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/personal/calendar");
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
    <Layout>
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
              Nuevo Evento
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
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required
                placeholder="Ej: Reunión con el equipo"
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
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={1}
                placeholder="Descripción del evento..."
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

            {/* Fecha de inicio */}
            <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
              <label style={labelStyle}>
                Fecha de inicio <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                required
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

            {/* Hora de inicio */}
            {!allDay && (
              <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
                <label style={labelStyle}>Hora de inicio</label>
                <input
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
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
            )}

            {/* Fecha de fin */}
            <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
              <label style={labelStyle}>Fecha de fin</label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
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

            {/* Hora de fin */}
            {!allDay && (
              <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
                <label style={labelStyle}>Hora de fin</label>
                <input
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
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
            )}

            {/* Todo el día */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "15px", color: "var(--text-primary)" }}>Todo el día</span>
              </label>
            </div>

            {/* Tipo */}
            <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
              <label style={labelStyle}>Tipo</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
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
                <option value="event">📅 Evento</option>
                <option value="meeting">🤝 Reunión</option>
                <option value="reminder">⏰ Recordatorio</option>
                <option value="task">✓ Tarea</option>
                <option value="deadline">📌 Fecha límite</option>
              </select>
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
                {EVENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEventColor(color)}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      border: eventColor === color ? "3px solid var(--primary)" : "2px solid var(--border-color)",
                      backgroundColor: color,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: eventColor === color ? "0 4px 12px rgba(0, 123, 255, 0.3)" : "0 2px 4px rgba(0, 0, 0, 0.1)",
                      transform: eventColor === color ? "scale(1.1)" : "scale(1)",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (eventColor !== color) {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (eventColor !== color) {
                        e.currentTarget.style.transform = "scale(1)";
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Recordatorio */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hasReminder}
                  onChange={(e) => setHasReminder(e.target.checked)}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "15px", color: "var(--text-primary)" }}>Activar recordatorio</span>
              </label>
            </div>

            {/* Recordatorio minutos */}
            {hasReminder && (
              <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" as const }}>
                <label style={labelStyle}>Recordar con anticipación</label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
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
                  <option value={5}>5 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                  <option value={1440}>1 día antes</option>
                  <option value={2880}>2 días antes</option>
                </select>
              </div>
            )}

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
                disabled={loading || !eventTitle.trim()}
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
                  cursor: loading || !eventTitle.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !eventTitle.trim() ? 0.6 : 1,
                  boxSizing: "border-box" as const,
                }}
              >
                {loading ? "Creando..." : "✨ Crear Evento"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
