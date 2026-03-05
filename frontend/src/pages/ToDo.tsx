import React, { useState, useEffect, useCallback, useMemo } from "react";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";

type TodoItem = {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  priority?: string;
  color?: string;
  order: number;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#dc3545",
  medium: "#ffc107",
  low: "#28a745",
};

const PRIORITY_ICONS: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
  low: "🟢",
};

export default function ToDo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "today" | "completed" | "pending">("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoDueDate, setNewTodoTodoDueDate] = useState<string>("");
  const [newTodoPriority, setNewTodoPriority] = useState<string>("medium");
  const [newTodoColor, setNewTodoColor] = useState<string>("#007bff");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "today") {
        params.append("dueDate", selectedDate);
      } else if (filter === "completed") {
        params.append("completed", "true");
      } else if (filter === "pending") {
        params.append("completed", "false");
      }

      const res = await http.get(`/api/users/me/todo-items?${params.toString()}`);
      setTodos(res.data || []);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando tareas";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [filter, selectedDate, showToast]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) {
      showToast("El título es requerido", "error");
      return;
    }

    try {
      const todoData: any = {
        title: newTodoTitle.trim(),
        description: newTodoDescription.trim() || null,
        priority: newTodoPriority || null,
        color: newTodoColor || null,
      };

      if (newTodoDueDate) {
        todoData.dueDate = new Date(newTodoDueDate + "T00:00:00").toISOString();
      }

      await http.post("/api/users/me/todo-items", todoData);
      showToast("Tarea creada exitosamente", "success");
      setNewTodoTitle("");
      setNewTodoDescription("");
      setNewTodoTodoDueDate("");
      setNewTodoPriority("medium");
      setNewTodoColor("#007bff");
      setShowAddForm(false);
      await loadTodos();
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando tarea";
      showToast(errorMsg, "error");
    }
  };

  const toggleComplete = async (todo: TodoItem) => {
    try {
      await http.patch(`/api/users/me/todo-items/${todo.id}`, {
        isCompleted: !todo.isCompleted,
      });
      await loadTodos();
      if (!todo.isCompleted) {
        showToast("¡Tarea completada! 🎉", "success");
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error actualizando tarea";
      showToast(errorMsg, "error");
    }
  };

  const deleteTodo = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    try {
      await http.delete(`/api/users/me/todo-items/${id}`);
      showToast("Tarea eliminada", "success");
      await loadTodos();
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error eliminando tarea";
      showToast(errorMsg, "error");
    }
  };

  const updateTodo = async (todo: TodoItem, updates: Partial<TodoItem>) => {
    try {
      await http.patch(`/api/users/me/todo-items/${todo.id}`, updates);
      await loadTodos();
      setEditingId(null);
      showToast("Tarea actualizada", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error actualizando tarea";
      showToast(errorMsg, "error");
    }
  };

  const filteredTodos = useMemo(() => {
    let filtered = [...todos];

    if (filter === "today") {
      const todayStr = selectedDate;
      filtered = filtered.filter(
        (t) => t.dueDate && new Date(t.dueDate).toISOString().split("T")[0] === todayStr
      );
    }

    // Ordenar: pendientes primero, luego completadas
    filtered.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // Luego por orden
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      // Finalmente por fecha de creación
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return filtered;
  }, [todos, filter, selectedDate]);

  const pendingCount = todos.filter((t) => !t.isCompleted).length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const todayCount = todos.filter(
    (t) => t.dueDate && new Date(t.dueDate).toISOString().split("T")[0] === selectedDate
  ).length;

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isDueToday = (dueDate?: string) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  };

  return (
    <Layout>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="To Do"
          subtitle={`${pendingCount} pendientes • ${completedCount} completadas`}
          breadcrumbs={[{ label: "To Do" }]}
          actions={
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Button
                variant={filter === "all" ? "primary" : "secondary"}
                onClick={() => setFilter("all")}
              >
                Todas ({todos.length})
              </Button>
              <Button
                variant={filter === "today" ? "primary" : "secondary"}
                onClick={() => setFilter("today")}
              >
                Hoy ({todayCount})
              </Button>
              <Button
                variant={filter === "pending" ? "primary" : "secondary"}
                onClick={() => setFilter("pending")}
              >
                Pendientes ({pendingCount})
              </Button>
              <Button
                variant={filter === "completed" ? "primary" : "secondary"}
                onClick={() => setFilter("completed")}
              >
                Completadas ({completedCount})
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? "✕ Cancelar" : "+ Nueva Tarea"}
              </Button>
            </div>
          }
        />

        <div style={{ padding: "24px" }}>
          {/* Filtro de fecha para "Hoy" */}
          {filter === "today" && (
            <Card style={{ marginBottom: "24px", padding: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                Seleccionar fecha:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  width: "100%",
                  maxWidth: "300px",
                }}
              />
            </Card>
          )}

          {/* Formulario de nueva tarea */}
          {showAddForm && (
            <Card
              style={{
                marginBottom: "24px",
                padding: "24px",
                animation: "slideDown 0.3s ease-out",
              }}
            >
              <form onSubmit={createTodo} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Título <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    placeholder="Ej: Comprar víveres"
                    required
                    style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      width: "100%",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Descripción
                  </label>
                  <textarea
                    value={newTodoDescription}
                    onChange={(e) => setNewTodoDescription(e.target.value)}
                    placeholder="Descripción opcional..."
                    rows={3}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      width: "100%",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Fecha límite
                    </label>
                    <input
                      type="date"
                      value={newTodoDueDate}
                      onChange={(e) => setNewTodoTodoDueDate(e.target.value)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-primary)",
                        fontSize: "15px",
                        width: "100%",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Prioridad
                    </label>
                    <select
                      value={newTodoPriority}
                      onChange={(e) => setNewTodoPriority(e.target.value)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-primary)",
                        fontSize: "15px",
                        width: "100%",
                      }}
                    >
                      <option value="low">🟢 Baja</option>
                      <option value="medium">🟡 Media</option>
                      <option value="high">🔴 Alta</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary">
                    Crear Tarea
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Lista de tareas */}
          {loading ? (
            <div className="loading">Cargando tareas...</div>
          ) : filteredTodos.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.3 }}>✅</div>
              <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
                {filter === "completed" ? "No hay tareas completadas" : filter === "pending" ? "No hay tareas pendientes" : "No hay tareas"}
              </h3>
              <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                {filter === "completed"
                  ? "Completa algunas tareas para verlas aquí"
                  : "Crea tu primera tarea para comenzar"}
              </p>
              {filter !== "completed" && (
                <Button variant="primary" onClick={() => setShowAddForm(true)}>
                  + Crear Primera Tarea
                </Button>
              )}
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredTodos.map((todo, index) => {
                const overdue = isOverdue(todo.dueDate);
                const dueToday = isDueToday(todo.dueDate);
                const isEditing = editingId === todo.id;

                return (
                  <Card
                    key={todo.id}
                    style={{
                      padding: "20px",
                      borderLeft: `4px solid ${todo.color || PRIORITY_COLORS[todo.priority || "medium"] || "#007bff"}`,
                      backgroundColor: todo.isCompleted ? "var(--bg-secondary)" : "var(--bg-primary)",
                      opacity: todo.isCompleted ? 0.85 : 1,
                      transition: "all 0.3s ease",
                      animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Efecto de subrayado animado cuando se completa */}
                    {todo.isCompleted && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          right: 0,
                          height: "2px",
                          backgroundColor: "var(--text-primary)",
                          opacity: 0.6,
                          transform: "translateY(-50%)",
                          animation: "strikethrough 0.5s ease-out",
                        }}
                      />
                    )}

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                      {/* Checkbox animado */}
                      <button
                        onClick={() => toggleComplete(todo)}
                        style={{
                          width: "28px",
                          height: "28px",
                          minWidth: "28px",
                          borderRadius: "6px",
                          border: `2px solid ${todo.isCompleted ? "#28a745" : "var(--border-color)"}`,
                          backgroundColor: todo.isCompleted ? "#28a745" : "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          position: "relative",
                          marginTop: "2px",
                        }}
                        onMouseEnter={(e) => {
                          if (!todo.isCompleted) {
                            e.currentTarget.style.borderColor = "#28a745";
                            e.currentTarget.style.backgroundColor = "rgba(40, 167, 69, 0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!todo.isCompleted) {
                            e.currentTarget.style.borderColor = "var(--border-color)";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        {todo.isCompleted && (
                          <span
                            style={{
                              color: "white",
                              fontSize: "18px",
                              animation: "checkmark 0.4s ease-out",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>

                      {/* Contenido de la tarea */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <input
                              type="text"
                              defaultValue={todo.title}
                              onBlur={(e) => {
                                if (e.target.value.trim() && e.target.value.trim() !== todo.title) {
                                  updateTodo(todo, { title: e.target.value.trim() });
                                } else {
                                  setEditingId(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                } else if (e.key === "Escape") {
                                  setEditingId(null);
                                }
                              }}
                              autoFocus
                              style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "2px solid var(--primary)",
                                backgroundColor: "var(--bg-primary)",
                                color: "var(--text-primary)",
                                fontSize: "16px",
                                fontWeight: 600,
                                width: "100%",
                              }}
                            />
                            <textarea
                              defaultValue={todo.description || ""}
                              onBlur={(e) => {
                                if (e.target.value.trim() !== (todo.description || "")) {
                                  updateTodo(todo, { description: e.target.value.trim() || null });
                                }
                              }}
                              placeholder="Descripción..."
                              rows={2}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-color)",
                                backgroundColor: "var(--bg-primary)",
                                color: "var(--text-primary)",
                                fontSize: "14px",
                                width: "100%",
                                resize: "vertical",
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <div
                              onClick={() => setEditingId(todo.id)}
                              style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: todo.isCompleted ? "var(--text-secondary)" : "var(--text-primary)",
                                marginBottom: todo.description ? "8px" : "0",
                                cursor: "pointer",
                                textDecoration: todo.isCompleted ? "line-through" : "none",
                                transition: "all 0.3s ease",
                                wordBreak: "break-word",
                              }}
                              onMouseEnter={(e) => {
                                if (!todo.isCompleted) {
                                  e.currentTarget.style.color = "var(--primary)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!todo.isCompleted) {
                                  e.currentTarget.style.color = "var(--text-primary)";
                                }
                              }}
                            >
                              {todo.title}
                            </div>
                            {todo.description && (
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "var(--text-secondary)",
                                  marginBottom: "12px",
                                  wordBreak: "break-word",
                                  opacity: todo.isCompleted ? 0.7 : 1,
                                }}
                              >
                                {todo.description}
                              </div>
                            )}
                          </>
                        )}

                        {/* Metadata */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
                          {todo.priority && (
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: PRIORITY_COLORS[todo.priority] || "var(--text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {PRIORITY_ICONS[todo.priority] || "•"}
                              {todo.priority === "high" ? "Alta" : todo.priority === "medium" ? "Media" : "Baja"}
                            </span>
                          )}
                          {todo.dueDate && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: overdue
                                  ? "#dc3545"
                                  : dueToday
                                  ? "#ffc107"
                                  : "var(--text-secondary)",
                                fontWeight: overdue || dueToday ? 600 : 400,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              📅 {new Date(todo.dueDate).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: new Date(todo.dueDate).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                              })}
                              {overdue && !todo.isCompleted && " ⚠️ Vencida"}
                              {dueToday && !todo.isCompleted && " 🔥 Hoy"}
                            </span>
                          )}
                          {todo.isCompleted && todo.completedAt && (
                            <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                              Completada: {new Date(todo.completedAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        {!isEditing && (
                          <button
                            onClick={() => setEditingId(todo.id)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              backgroundColor: "var(--bg-primary)",
                              color: "var(--text-primary)",
                              cursor: "pointer",
                              fontSize: "12px",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                              e.currentTarget.style.borderColor = "var(--primary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                              e.currentTarget.style.borderColor = "var(--border-color)";
                            }}
                          >
                            ✏️ Editar
                          </button>
                        )}
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--bg-primary)",
                            color: "#dc3545",
                            cursor: "pointer",
                            fontSize: "12px",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
                            e.currentTarget.style.borderColor = "#dc3545";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                            e.currentTarget.style.borderColor = "var(--border-color)";
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes strikethrough {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes checkmark {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(-45deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </Layout>
  );
}
