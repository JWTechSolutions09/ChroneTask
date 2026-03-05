import React, { useState, useEffect, useCallback, useMemo } from "react";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";

type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  color?: string;
  type?: string;
  allDay: boolean;
  hasReminder: boolean;
  reminderMinutesBefore?: number;
  relatedTaskId?: string;
  relatedProjectId?: string;
};

type Task = {
  id: string;
  title: string;
  startDate?: string;
  dueDate?: string;
  status: string;
  projectId?: string;
  projectName?: string;
};

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const EVENT_COLORS = [
  "#007bff", "#28a745", "#dc3545", "#ffc107", "#17a2b8",
  "#6f42c1", "#e83e8c", "#fd7e14", "#20c997", "#6c757d"
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const { showToast } = useToast();

  // Form state
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
  const [saving, setSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calcular el primer día del mes y cuántos días tiene
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Cargar eventos del calendario
  const loadCalendarEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
      
      const res = await http.get("/api/users/me/calendar-events", {
        params: {
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        },
      });
      setEvents(res.data || []);
    } catch (ex: any) {
      console.error("Error cargando eventos:", ex);
      showToast("Error cargando eventos del calendario", "error");
    } finally {
      setLoading(false);
    }
  }, [year, month, showToast]);

  // Cargar tareas con fechas
  const loadTasks = useCallback(async () => {
    try {
      const res = await http.get("/api/users/me/projects");
      const projects = res.data || [];
      
      let allTasks: Task[] = [];
      for (const project of projects) {
        try {
          const tasksRes = await http.get(`/api/projects/${project.id}/tasks`);
          const projectTasks = (tasksRes.data || []).map((t: any) => ({
            ...t,
            projectId: project.id,
            projectName: project.name,
          }));
          allTasks = [...allTasks, ...projectTasks];
        } catch (ex: any) {
          // Silently fail for individual projects
        }
      }
      
      // Filtrar solo tareas con fechas
      const tasksWithDates = allTasks.filter(
        (t) => t.startDate || t.dueDate
      );
      setTasks(tasksWithDates);
    } catch (ex: any) {
      console.error("Error cargando tareas:", ex);
    }
  }, []);

  useEffect(() => {
    loadCalendarEvents();
    loadTasks();
  }, [loadCalendarEvents, loadTasks]);

  // Obtener eventos para un día específico
  const getEventsForDay = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventStartStr = eventStart.toISOString().split("T")[0];
      const eventEndStr = event.endDate
        ? new Date(event.endDate).toISOString().split("T")[0]
        : eventStartStr;
      return dateStr >= eventStartStr && dateStr <= eventEndStr;
    });
  }, [events]);

  // Obtener tareas para un día específico
  const getTasksForDay = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => {
      if (task.startDate) {
        const taskStart = new Date(task.startDate).toISOString().split("T")[0];
        if (taskStart === dateStr) return true;
      }
      if (task.dueDate) {
        const taskDue = new Date(task.dueDate).toISOString().split("T")[0];
        if (taskDue === dateStr) return true;
      }
      return false;
    });
  }, [tasks]);

  // Navegar meses
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Abrir modal para crear evento
  const openCreateEventModal = (date?: Date) => {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split("T")[0];
    const timeStr = new Date().toTimeString().slice(0, 5);
    
    setSelectedDate(targetDate);
    setSelectedEvent(null);
    setEventTitle("");
    setEventDescription("");
    setEventStartDate(dateStr);
    setEventStartTime(timeStr);
    setEventEndDate(dateStr);
    setEventEndTime(timeStr);
    setEventColor(EVENT_COLORS[0]);
    setEventType("event");
    setAllDay(false);
    setHasReminder(false);
    setReminderMinutes(15);
    setShowEventModal(true);
  };

  // Abrir modal para editar evento
  const openEditEventModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;
    
    setEventTitle(event.title);
    setEventDescription(event.description || "");
    setEventStartDate(startDate.toISOString().split("T")[0]);
    setEventStartTime(event.allDay ? "" : startDate.toTimeString().slice(0, 5));
    setEventEndDate(endDate.toISOString().split("T")[0]);
    setEventEndTime(event.allDay ? "" : endDate.toTimeString().slice(0, 5));
    setEventColor(event.color || EVENT_COLORS[0]);
    setEventType(event.type || "event");
    setAllDay(event.allDay);
    setHasReminder(event.hasReminder);
    setReminderMinutes(event.reminderMinutesBefore || 15);
    setShowEventModal(true);
  };

  // Guardar evento
  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      showToast("El título es requerido", "error");
      return;
    }

    setSaving(true);
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

      if (selectedEvent) {
        await http.patch(`/api/users/me/calendar-events/${selectedEvent.id}`, eventData);
        showToast("Evento actualizado exitosamente", "success");
      } else {
        await http.post("/api/users/me/calendar-events", eventData);
        showToast("Evento creado exitosamente", "success");
      }

      setShowEventModal(false);
      await loadCalendarEvents();
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error guardando evento";
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar evento
  const deleteEvent = async (eventId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este evento?")) return;

    try {
      await http.delete(`/api/users/me/calendar-events/${eventId}`);
      showToast("Evento eliminado exitosamente", "success");
      await loadCalendarEvents();
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error eliminando evento";
      showToast(errorMsg, "error");
    }
  };

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    
    // Días del mes anterior (para completar la primera semana)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(date);
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // Días del mes siguiente (para completar la última semana)
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }
    
    return days;
  }, [year, month, daysInMonth, startingDayOfWeek]);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date | null) => {
    if (!date) return false;
    return date.getMonth() === month && date.getFullYear() === year;
  };

  return (
    <Layout>
      <PageHeader
        title="Calendario"
        subtitle={`${MONTHS[month]} ${year}`}
        breadcrumbs={[{ label: "Calendario" }]}
        actions={
          <>
            <Button variant="secondary" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="secondary" onClick={goToPreviousMonth}>
              ←
            </Button>
            <Button variant="secondary" onClick={goToNextMonth}>
              →
            </Button>
            <Button variant="primary" onClick={() => openCreateEventModal()}>
              + Nuevo Evento
            </Button>
          </>
        }
      />

      <div style={{ padding: "24px", backgroundColor: "var(--bg-secondary)" }}>
        <Card>
          {loading ? (
            <div className="loading">Cargando calendario...</div>
          ) : (
            <div>
              {/* Grid del calendario */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "1px",
                  backgroundColor: "var(--border-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Headers de días */}
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    style={{
                      padding: "12px",
                      backgroundColor: "var(--bg-tertiary)",
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "var(--text-primary)",
                    }}
                  >
                    {day}
                  </div>
                ))}

                {/* Días del calendario */}
                {calendarDays.map((date, index) => {
                  if (!date) return null;
                  
                  const dayEvents = getEventsForDay(date);
                  const dayTasks = getTasksForDay(date);
                  const isTodayDate = isToday(date);
                  const isCurrentMonthDate = isCurrentMonth(date);

                  return (
                    <div
                      key={index}
                      onClick={() => openCreateEventModal(date)}
                      style={{
                        minHeight: "120px",
                        padding: "8px",
                        backgroundColor: isCurrentMonthDate
                          ? "var(--bg-primary)"
                          : "var(--bg-secondary)",
                        cursor: "pointer",
                        border: isTodayDate
                          ? "2px solid var(--primary)"
                          : "none",
                        borderRadius: isTodayDate ? "4px" : "0",
                        transition: "all 0.2s",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isCurrentMonthDate
                          ? "var(--hover-bg)"
                          : "var(--bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isCurrentMonthDate
                          ? "var(--bg-primary)"
                          : "var(--bg-secondary)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: isTodayDate ? 700 : isCurrentMonthDate ? 500 : 400,
                          color: isTodayDate
                            ? "var(--primary)"
                            : isCurrentMonthDate
                            ? "var(--text-primary)"
                            : "var(--text-tertiary)",
                          marginBottom: "4px",
                        }}
                      >
                        {date.getDate()}
                      </div>

                      {/* Eventos del calendario */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditEventModal(event);
                            }}
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: event.color || EVENT_COLORS[0],
                              color: "white",
                              cursor: "pointer",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: 500,
                            }}
                            title={event.title}
                          >
                            {event.allDay ? "📅" : "🕐"} {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "var(--text-secondary)",
                              fontStyle: "italic",
                            }}
                          >
                            +{dayEvents.length - 3} más
                          </div>
                        )}
                      </div>

                      {/* Tareas */}
                      {dayTasks.length > 0 && (
                        <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              style={{
                                fontSize: "10px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(0, 123, 255, 0.1)",
                                color: "var(--primary)",
                                border: "1px solid rgba(0, 123, 255, 0.3)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={`Tarea: ${task.title}`}
                            >
                              ✓ {task.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de crear/editar evento */}
      {showEventModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowEventModal(false)}
        >
          <Card
            style={{
              maxWidth: "600px",
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              padding: "32px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                paddingBottom: "20px",
                borderBottom: "2px solid var(--border-color)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                {selectedEvent ? "Editar Evento" : "Nuevo Evento"}
              </h2>
              <button
                onClick={() => setShowEventModal(false)}
                style={{
                  background: "var(--hover-bg)",
                  border: "1px solid var(--border-color)",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveEvent} style={{ display: "grid", gap: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Título <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  className="input"
                  placeholder="Ej: Reunión con el equipo"
                  style={{ padding: "12px 16px", fontSize: "15px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Descripción
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="textarea"
                  rows={3}
                  placeholder="Descripción del evento..."
                  style={{ padding: "12px 16px", fontSize: "15px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Fecha de inicio <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    required
                    className="input"
                    style={{ padding: "12px 16px", fontSize: "15px" }}
                  />
                </div>
                {!allDay && (
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Hora de inicio
                    </label>
                    <input
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="input"
                      style={{ padding: "12px 16px", fontSize: "15px" }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="input"
                    style={{ padding: "12px 16px", fontSize: "15px" }}
                  />
                </div>
                {!allDay && (
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Hora de fin
                    </label>
                    <input
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="input"
                      style={{ padding: "12px 16px", fontSize: "15px" }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>Todo el día</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Tipo
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="select"
                    style={{ padding: "12px 16px", fontSize: "15px" }}
                  >
                    <option value="event">📅 Evento</option>
                    <option value="meeting">🤝 Reunión</option>
                    <option value="reminder">⏰ Recordatorio</option>
                    <option value="task">✓ Tarea</option>
                    <option value="deadline">📌 Fecha límite</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Color
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {EVENT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEventColor(color)}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "8px",
                          backgroundColor: color,
                          border: eventColor === color ? "3px solid var(--text-primary)" : "2px solid var(--border-color)",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={hasReminder}
                    onChange={(e) => setHasReminder(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>Activar recordatorio</span>
                </label>
              </div>

              {hasReminder && (
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Recordar con anticipación
                  </label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
                    className="select"
                    style={{ padding: "12px 16px", fontSize: "15px" }}
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

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px", paddingTop: "20px", borderTop: "2px solid var(--border-color)" }}>
                {selectedEvent && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      deleteEvent(selectedEvent.id);
                      setShowEventModal(false);
                    }}
                    disabled={saving}
                  >
                    Eliminar
                  </Button>
                )}
                <Button type="button" variant="secondary" onClick={() => setShowEventModal(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={saving || !eventTitle.trim()}>
                  {saving ? "Guardando..." : selectedEvent ? "Actualizar" : "Crear Evento"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Layout>
  );
}
