import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
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

  // Memoizar eventos por día para optimización
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const eventStart = new Date(event.startDate);
      const eventStartStr = eventStart.toISOString().split("T")[0];
      const eventEndStr = event.endDate
        ? new Date(event.endDate).toISOString().split("T")[0]
        : eventStartStr;
      
      // Agregar evento a todos los días en su rango
      const start = new Date(eventStartStr);
      const end = new Date(eventEndStr);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toISOString().split("T")[0];
        if (!map.has(dayStr)) {
          map.set(dayStr, []);
        }
        map.get(dayStr)!.push(event);
      }
    });
    return map;
  }, [events]);

  // Obtener eventos para un día específico - Optimizado
  const getEventsForDay = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return eventsByDay.get(dateStr) || [];
  }, [eventsByDay]);

  // Memoizar tareas por día para optimización
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      // Priorizar dueDate (fecha límite) sobre startDate
      let targetDate: string | null = null;
      if (task.dueDate) {
        targetDate = new Date(task.dueDate).toISOString().split("T")[0];
      } else if (task.startDate) {
        targetDate = new Date(task.startDate).toISOString().split("T")[0];
      }
      
      if (targetDate) {
        if (!map.has(targetDate)) {
          map.set(targetDate, []);
        }
        map.get(targetDate)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  // Obtener tareas para un día específico - Optimizado
  const getTasksForDay = useCallback((date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasksByDay.get(dateStr) || [];
  }, [tasksByDay]);

  // Determinar si una tarea está vencida o próxima a vencer
  const getTaskStatus = useCallback((task: Task) => {
    if (!task.dueDate) return "normal";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (task.status === "Done") return "completed";
    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "due-today";
    if (diffDays <= 2) return "due-soon";
    return "normal";
  }, []);

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
          <div style={{ 
            display: "flex", 
            gap: "10px", 
            flexWrap: isMobile ? "nowrap" : "wrap",
            overflowX: isMobile ? "auto" : "visible",
            maxWidth: "100%",
          }}>
            <Button 
              variant="secondary" 
              onClick={goToToday}
              style={{ 
                flex: isMobile ? "0 0 auto" : undefined,
                whiteSpace: "nowrap",
              }}
            >
              Hoy
            </Button>
            <Button 
              variant="secondary" 
              onClick={goToPreviousMonth}
              style={{ 
                flex: isMobile ? "0 0 auto" : undefined,
                whiteSpace: "nowrap",
              }}
            >
              ←
            </Button>
            <Button 
              variant="secondary" 
              onClick={goToNextMonth}
              style={{ 
                flex: isMobile ? "0 0 auto" : undefined,
                whiteSpace: "nowrap",
              }}
            >
              →
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                if (isMobile) {
                  navigate("/personal/create-event");
                } else {
                  openCreateEventModal();
                }
              }}
              style={{ 
                flex: isMobile ? "0 0 auto" : undefined,
                whiteSpace: "nowrap",
              }}
            >
              + Nuevo Evento
            </Button>
          </div>
        }
      />

      <div style={{ 
        padding: isMobile ? "12px" : "24px", 
        backgroundColor: "var(--bg-secondary)",
        boxSizing: "border-box",
      }}>
        {loading ? (
          <div className="loading">Cargando calendario...</div>
        ) : isMobile ? (
          // Vista de lista para móvil
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {events.length === 0 ? (
              <Card>
                <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
                  <div style={{ fontSize: "18px", fontWeight: 500 }}>No hay eventos programados</div>
                  <div style={{ fontSize: "14px", marginTop: "8px" }}>
                    Crea tu primer evento haciendo clic en el botón de arriba
                  </div>
                </div>
              </Card>
            ) : (
              events
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((event) => {
                  const startDate = new Date(event.startDate);
                  const endDate = event.endDate ? new Date(event.endDate) : startDate;
                  const isAllDay = event.allDay;
                  
                  return (
                    <Card
                      key={event.id}
                      style={{
                        padding: "16px",
                        borderLeft: `4px solid ${event.color || EVENT_COLORS[0]}`,
                      }}
                    >
                      <div style={{ marginBottom: "12px" }}>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: "18px", 
                          fontWeight: 600, 
                          color: "var(--text-primary)",
                          marginBottom: "8px",
                        }}>
                          {event.title}
                        </h3>
                        <div style={{ 
                          fontSize: "14px", 
                          color: "var(--text-secondary)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>📅</span>
                            <span>
                              {isAllDay 
                                ? startDate.toLocaleDateString("es-ES", { 
                                    weekday: "long", 
                                    year: "numeric", 
                                    month: "long", 
                                    day: "numeric" 
                                  })
                                : startDate.toLocaleDateString("es-ES", { 
                                    weekday: "long", 
                                    year: "numeric", 
                                    month: "long", 
                                    day: "numeric" 
                                  }) + " a las " + startDate.toLocaleTimeString("es-ES", { 
                                    hour: "2-digit", 
                                    minute: "2-digit" 
                                  })
                              }
                            </span>
                          </div>
                          {!isAllDay && event.endDate && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>🕐</span>
                              <span>
                                Hasta: {endDate.toLocaleDateString("es-ES", { 
                                  weekday: "long", 
                                  year: "numeric", 
                                  month: "long", 
                                  day: "numeric" 
                                })} a las {endDate.toLocaleTimeString("es-ES", { 
                                  hour: "2-digit", 
                                  minute: "2-digit" 
                                })}
                              </span>
                            </div>
                          )}
                          {event.type && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>
                                {event.type === "meeting" ? "🤝" : 
                                 event.type === "reminder" ? "⏰" : 
                                 event.type === "task" ? "✓" : 
                                 event.type === "deadline" ? "📌" : "📅"}
                              </span>
                              <span style={{ textTransform: "capitalize" }}>{event.type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {event.description && (
                        <div style={{ 
                          marginBottom: "12px",
                          fontSize: "15px",
                          lineHeight: "1.6",
                          color: "var(--text-secondary)",
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}>
                          {event.description}
                        </div>
                      )}
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "flex-end", 
                        gap: "8px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--border-color)",
                      }}>
                        <button
                          type="button"
                          onClick={() => openEditEventModal(event)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            backgroundColor: "var(--hover-bg)",
                            border: "1px solid var(--border-color)",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "var(--text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEvent(event.id)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            backgroundColor: "var(--hover-bg)",
                            border: "1px solid var(--border-color)",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#dc3545",
                            fontWeight: 500,
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </Card>
                  );
                })
            )}
          </div>
        ) : (
          <Card>
            <div>
              {/* Grid del calendario - Mejorado */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "2px",
                  backgroundColor: "var(--border-color)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
              >
                {/* Headers de días - Mejorados */}
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    style={{
                      padding: "14px 12px",
                      backgroundColor: "var(--bg-tertiary)",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid var(--border-color)",
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
                  
                  // Calcular valores para evitar expresiones ternarias complejas en JSX
                  const maxVisibleEvents = dayTasks.length > 0 ? 2 : 3;
                  const remainingEvents = dayEvents.length - maxVisibleEvents;
                  const remainingEventsText = remainingEvents > 0 
                    ? `+${remainingEvents} ${remainingEvents > 1 ? "eventos" : "evento"} más`
                    : null;

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (isMobile) {
                          navigate(`/personal/create-event?date=${date.toISOString()}`);
                        } else {
                          openCreateEventModal(date);
                        }
                      }}
                      style={{
                        minHeight: "140px",
                        padding: "10px",
                        backgroundColor: isCurrentMonthDate
                          ? "var(--bg-primary)"
                          : "var(--bg-secondary)",
                        cursor: "pointer",
                        border: isTodayDate
                          ? "3px solid var(--primary)"
                          : "1px solid var(--border-color)",
                        borderRadius: isTodayDate ? "6px" : "0",
                        transition: "all 0.2s ease",
                        position: "relative",
                        boxShadow: isTodayDate ? "0 2px 8px rgba(0, 123, 255, 0.2)" : "none",
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
                          fontSize: "15px",
                          fontWeight: isTodayDate ? 700 : isCurrentMonthDate ? 600 : 400,
                          color: isTodayDate
                            ? "var(--primary)"
                            : isCurrentMonthDate
                            ? "var(--text-primary)"
                            : "var(--text-tertiary)",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{date.getDate()}</span>
                        {dayTasks.length > 0 && (
                          <span
                            style={{
                              fontSize: "10px",
                              backgroundColor: dayTasks.some(t => getTaskStatus(t) === "overdue") 
                                ? "#dc3545" 
                                : dayTasks.some(t => getTaskStatus(t) === "due-today")
                                ? "#ffc107"
                                : "#007bff",
                              color: "white",
                              borderRadius: "10px",
                              padding: "2px 6px",
                              fontWeight: 600,
                            }}
                          >
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {/* Eventos del calendario - Mejorados */}
                      {dayEvents.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: dayTasks.length > 0 ? "4px" : "0" }}>
                          {dayEvents.slice(0, dayTasks.length > 0 ? 2 : 3).map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditEventModal(event);
                              }}
                              style={{
                                fontSize: "11px",
                                padding: "3px 7px",
                                borderRadius: "5px",
                                backgroundColor: event.color || EVENT_COLORS[0],
                                color: "white",
                                cursor: "pointer",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontWeight: 500,
                                transition: "all 0.2s ease",
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateX(2px)";
                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateX(0)";
                                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                              }}
                              title={event.title}
                            >
                              <span style={{ marginRight: "4px" }}>{event.allDay ? "📅" : "🕐"}</span>
                              {event.title}
                            </div>
                          ))}
                          {remainingEventsText && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--text-secondary)",
                                fontStyle: "italic",
                                padding: "2px 6px",
                              }}
                            >
                              {remainingEventsText}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tareas - Mejoradas y destacadas */}
                      {dayTasks.length > 0 && (
                        <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {dayTasks.slice(0, 3).map((task) => {
                            const taskStatus = getTaskStatus(task);
                            const statusStyles = {
                              overdue: {
                                backgroundColor: "rgba(220, 53, 69, 0.15)",
                                color: "#dc3545",
                                border: "1.5px solid #dc3545",
                                fontWeight: 700,
                                boxShadow: "0 2px 4px rgba(220, 53, 69, 0.2)",
                              },
                              "due-today": {
                                backgroundColor: "rgba(255, 193, 7, 0.2)",
                                color: "#ffc107",
                                border: "1.5px solid #ffc107",
                                fontWeight: 700,
                                boxShadow: "0 2px 4px rgba(255, 193, 7, 0.3)",
                              },
                              "due-soon": {
                                backgroundColor: "rgba(255, 193, 7, 0.12)",
                                color: "#ff9800",
                                border: "1px solid #ff9800",
                                fontWeight: 600,
                              },
                              completed: {
                                backgroundColor: "rgba(40, 167, 69, 0.1)",
                                color: "#28a745",
                                border: "1px solid rgba(40, 167, 69, 0.3)",
                                textDecoration: "line-through",
                                opacity: 0.7,
                              },
                              normal: {
                                backgroundColor: "rgba(0, 123, 255, 0.12)",
                                color: "#007bff",
                                border: "1px solid rgba(0, 123, 255, 0.3)",
                                fontWeight: 500,
                              },
                            };
                            const style = statusStyles[taskStatus] || statusStyles.normal;
                            
                            return (
                              <div
                                key={task.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task.projectId) {
                                    window.location.href = `/personal/project/${task.projectId}/board`;
                                  }
                                }}
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  ...style,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateX(2px)";
                                  e.currentTarget.style.boxShadow = style.boxShadow || "0 2px 6px rgba(0, 0, 0, 0.15)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateX(0)";
                                  e.currentTarget.style.boxShadow = style.boxShadow || "none";
                                }}
                                title={`${task.title}${task.projectName ? ` - ${task.projectName}` : ""}${task.dueDate ? ` (Vence: ${new Date(task.dueDate).toLocaleDateString("es-ES")})` : ""}`}
                              >
                                <span style={{ marginRight: "4px", fontSize: "12px" }}>
                                  {taskStatus === "overdue" ? "⚠️" : taskStatus === "due-today" ? "🔥" : taskStatus === "due-soon" ? "⏰" : taskStatus === "completed" ? "✅" : "📋"}
                                </span>
                                {task.title}
                              </div>
                            );
                          })}
                          {dayTasks.length > 3 && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--text-secondary)",
                                fontStyle: "italic",
                                padding: "2px 6px",
                                textAlign: "center",
                              }}
                            >
                              +{dayTasks.length - 3} {dayTasks.length - 3 > 1 ? "tareas" : "tarea"} más
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modal de crear/editar evento - Solo en desktop */}
      {showEventModal && !isMobile && (
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
                  placeholder="Ej: Reunión con el equipo"
                  style={{
                    padding: "12px 16px",
                    fontSize: "15px",
                    borderRadius: "12px",
                    border: "2px solid var(--border-color)",
                    transition: "all 0.2s",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
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
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Descripción
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Descripción del evento..."
                  rows={1}
                  style={{
                    padding: "12px 16px",
                    fontSize: "15px",
                    borderRadius: "12px",
                    border: "2px solid var(--border-color)",
                    transition: "all 0.2s",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
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
