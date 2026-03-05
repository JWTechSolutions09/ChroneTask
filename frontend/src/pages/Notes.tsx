import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../contexts/ToastContext";
import { useTerminology } from "../hooks/useTerminology";
import { useUserUsageType } from "../hooks/useUserUsageType";

type Note = {
  id: string;
  projectId?: string; // Solo para notas de proyecto
  userId: string;
  userName: string;
  userAvatar?: string;
  title?: string;
  content?: string;
  color?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  canvasData?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
};

const NOTE_COLORS = ["#FFE5E5", "#E5F3FF", "#E5FFE5", "#FFF5E5", "#F0E5FF", "#E5FFFF", "#FFE5F0", "#FFE5D9", "#E5E5FF"];

export default function Notes() {
  const { organizationId, projectId } = useParams<{ organizationId?: string; projectId?: string }>();
  const location = useLocation();
  const { usageType } = useUserUsageType();
  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;
  
  // Determinar si son notas personales (sin projectId) o de proyecto (con projectId)
  const isPersonalNotes = !projectId;
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const t = useTerminology();
  const [draggedNote, setDraggedNote] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizingNote, setResizingNote] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<{ noteId: string; enabled: boolean }>({ noteId: "", enabled: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const { showToast } = useToast();

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      if (isPersonalNotes) {
        // Notas personales: usar el endpoint de notas personales
        const res = await http.get("/api/users/me/personal-notes");
        setNotes(res.data || []);
      } else {
        // Notas de proyecto
        if (isPersonalMode || isPersonalRoute) {
          const res = await http.get(`/api/users/me/projects/${projectId}/notes`);
          setNotes(res.data || []);
        } else {
          if (!organizationId) return;
          const res = await http.get(`/api/orgs/${organizationId}/projects/${projectId}/notes`);
          setNotes(res.data || []);
        }
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando notas";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, showToast, isPersonalMode, isPersonalRoute, isPersonalNotes]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Inicializar canvas cuando se carga una nota con canvasData o cuando se activa el modo dibujo
  useEffect(() => {
    notes.forEach(note => {
      const canvas = canvasRefs.current[note.id];
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Cargar imagen guardada si existe
          if (note.canvasData) {
            try {
              const image = new Image();
              image.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0);
              };
              image.src = note.canvasData;
            } catch (e) {
              console.error('Error loading canvas data:', e);
            }
          } else {
            // Limpiar canvas si no hay datos
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }
    });
  }, [notes, drawingMode]);

  const createNote = async () => {
    try {
      let res;
      if (isPersonalNotes) {
        // Crear nota personal
        res = await http.post("/api/users/me/personal-notes", {
          title: "Nueva Nota",
          content: "",
          color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
          positionX: Math.random() * 300 + 50,
          positionY: Math.random() * 300 + 50,
          width: 280,
          height: 200,
        });
      } else {
        // Crear nota de proyecto
        const endpoint = isPersonalMode || isPersonalRoute
          ? `/api/users/me/projects/${projectId}/notes`
          : `/api/orgs/${organizationId}/projects/${projectId}/notes`;
        res = await http.post(endpoint, {
          title: "Nueva Nota",
          content: "",
          color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
          positionX: Math.random() * 300 + 50,
          positionY: Math.random() * 300 + 50,
          width: 280,
          height: 200,
        });
      }
      await loadNotes();
      setSelectedNote(res.data);
      showToast("Nota creada exitosamente", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando nota";
      showToast(errorMsg, "error");
    }
  };

  const updateNote = async (note: Note) => {
    try {
      if (isPersonalNotes) {
        await http.patch(`/api/users/me/personal-notes/${note.id}`, {
          title: note.title,
          content: note.content,
          color: note.color,
          positionX: note.positionX,
          positionY: note.positionY,
          width: note.width,
          height: note.height,
          canvasData: note.canvasData,
          imageUrl: note.imageUrl,
        });
      } else {
        const endpoint = isPersonalMode || isPersonalRoute
          ? `/api/users/me/projects/${projectId}/notes/${note.id}`
          : `/api/orgs/${organizationId}/projects/${projectId}/notes/${note.id}`;
        await http.patch(endpoint, {
          title: note.title,
          content: note.content,
          color: note.color,
          positionX: note.positionX,
          positionY: note.positionY,
          width: note.width,
          height: note.height,
          canvasData: note.canvasData,
          imageUrl: note.imageUrl,
        });
      }
      await loadNotes();
    } catch (ex: any) {
      showToast("Error actualizando nota", "error");
    }
  };

  const deleteNote = async (id: string) => {
    try {
      if (isPersonalNotes) {
        await http.delete(`/api/users/me/personal-notes/${id}`);
      } else {
        const endpoint = isPersonalMode || isPersonalRoute
          ? `/api/users/me/projects/${projectId}/notes/${id}`
          : `/api/orgs/${organizationId}/projects/${projectId}/notes/${id}`;
        await http.delete(endpoint);
      }
      await loadNotes();
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      showToast("Nota eliminada exitosamente", "success");
    } catch (ex: any) {
      showToast("Error eliminando nota", "error");
    }
  };

  const handleImageUpload = async (note: Note, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Aquí deberías tener un endpoint para subir imágenes
      // Por ahora, convertimos a base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const updated = { ...note, imageUrl: base64 };
        setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
        await updateNote(updated);
      };
      reader.readAsDataURL(file);
    } catch (ex: any) {
      showToast("Error subiendo imagen", "error");
    }
  };

  const handleMouseDown = (e: React.MouseEvent, note: Note) => {
    if (isMobile) return;
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    if ((e.target as HTMLElement).tagName === "CANVAS") return;
    if ((e.target as HTMLElement).closest(".note-controls")) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggedNote({
      id: note.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggedNote && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - draggedNote.offsetX;
      const newY = e.clientY - containerRect.top - draggedNote.offsetY;

      const note = notes.find((n) => n.id === draggedNote.id);
      if (note) {
        const updatedNote = {
          ...note,
          positionX: Math.max(0, Math.min(newX, containerRect.width - (note.width || 280))),
          positionY: Math.max(0, Math.min(newY, containerRect.height - (note.height || 200))),
        };
        setNotes(notes.map((n) => (n.id === note.id ? updatedNote : n)));
      }
    }

    if (resizingNote && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(200, resizingNote.startWidth + (e.clientX - resizingNote.startX));
      const newHeight = Math.max(150, resizingNote.startHeight + (e.clientY - resizingNote.startY));

      const note = notes.find((n) => n.id === resizingNote.id);
      if (note) {
        const updatedNote = {
          ...note,
          width: newWidth,
          height: newHeight,
        };
        setNotes(notes.map((n) => (n.id === note.id ? updatedNote : n)));
      }
    }
  };

  const handleMouseUp = () => {
    if (draggedNote) {
      const note = notes.find((n) => n.id === draggedNote.id);
      if (note) {
        updateNote(note);
      }
      setDraggedNote(null);
    }
    if (resizingNote) {
      const note = notes.find((n) => n.id === resizingNote.id);
      if (note) {
        updateNote(note);
      }
      setResizingNote(null);
    }
  };

  useEffect(() => {
    if (draggedNote || resizingNote) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedNote, resizingNote, notes]);

  // Inicializar eventos de dibujo en canvas
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    notes.forEach(note => {
      const canvas = canvasRefs.current[note.id];
      if (!canvas || drawingMode.noteId !== note.id || !drawingMode.enabled) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;

      const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        lastX = clientX - rect.left;
        lastY = clientY - rect.top;
      };

      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const currentX = clientX - rect.left;
        const currentY = clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();

        lastX = currentX;
        lastY = currentY;
      };

      const stopDrawing = () => {
        if (isDrawing) {
          isDrawing = false;
          // Guardar el canvas como imagen
          const canvasData = canvas.toDataURL();
          const currentNote = notes.find(n => n.id === note.id);
          if (currentNote) {
            const updated = { ...currentNote, canvasData };
            setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
            // Guardar después de un pequeño delay para evitar demasiadas llamadas
            setTimeout(() => updateNote(updated), 500);
          }
        }
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);

      cleanupFunctions.push(() => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      });
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [notes, drawingMode]);

  if (!isPersonalMode && !isPersonalRoute && !organizationId && !isPersonalNotes) {
    return (
      <Layout organizationId={organizationId}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">
            Error: Falta parámetro requerido (Organization ID)
          </div>
        </div>
      </Layout>
    );
  }

  const pageTitle = isPersonalNotes ? "Notas Interactivas Personales" : "Notas del Proyecto";

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute || isPersonalNotes ? undefined : organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title={pageTitle}
          subtitle={`${notes.length} notas`}
          breadcrumbs={
            isPersonalMode || isPersonalRoute || isPersonalNotes
              ? [{ label: "Notas" }]
              : projectId
              ? [
                  { label: t.organizations, to: "/org-select" },
                  { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
                  { label: "Proyectos", to: `/org/${organizationId}/projects` },
                  { label: "Notas" },
                ]
              : [
                  { label: t.organizations, to: "/org-select" },
                  { label: "Notas" },
                ]
          }
          actions={
            <Button variant="primary" onClick={createNote}>
              + Nueva Nota
            </Button>
          }
        />

        <div
          ref={containerRef}
          style={{
            position: "relative",
            minHeight: "calc(100vh - 200px)",
            padding: isMobile ? "12px" : "24px",
            backgroundColor: "#f8f9fa",
            backgroundImage: isMobile ? "none" : "radial-gradient(circle, #e0e0e0 1px, transparent 1px)",
            backgroundSize: "25px 25px",
            display: isMobile ? "flex" : "block",
            flexDirection: isMobile ? "column" : "initial",
            gap: isMobile ? "12px" : "0",
          }}
          className={isMobile ? "notes-mobile-container" : ""}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              Cargando notas...
            </div>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
              <div style={{ fontSize: "18px", fontWeight: 500 }}>No hay notas aún</div>
              <div style={{ fontSize: "14px", marginTop: "8px" }}>
                {isPersonalNotes 
                  ? "Crea tu primera nota personal haciendo clic en el botón de arriba"
                  : "Crea tu primera nota del proyecto haciendo clic en el botón de arriba"}
              </div>
            </div>
          ) : (
            <>
              {notes.map((note) => (
                <Card
                  key={note.id}
                  style={{
                    position: isMobile ? "relative" : "absolute",
                    left: isMobile ? "auto" : note.positionX || 0,
                    top: isMobile ? "auto" : note.positionY || 0,
                    width: isMobile ? "100%" : note.width || 280,
                    height: isMobile ? "auto" : note.height || 200,
                    minHeight: isMobile ? "200px" : "200px",
                    backgroundColor: note.color || "#FFE5E5",
                    padding: "16px",
                    cursor: isMobile ? "default" : (draggedNote?.id === note.id ? "grabbing" : "grab"),
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: isMobile ? "12px" : "0",
                    borderRadius: "12px",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                  onMouseDown={(e) => handleMouseDown(e, note)}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.16), 0 4px 8px rgba(0, 0, 0, 0.12)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                  className={isMobile ? "note-mobile-card" : ""}
                >
                  {/* Header con controles */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px", gap: "8px" }}>
                    <input
                      value={note.title || ""}
                      onChange={(e) => {
                        const updated = { ...note, title: e.target.value };
                        setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
                      }}
                      onBlur={() => {
                        updateNote(note);
                        setEditingNoteId(null);
                      }}
                      onFocus={() => setEditingNoteId(note.id)}
                      placeholder="Título..."
                      style={{
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        flex: 1,
                        outline: editingNoteId === note.id ? "2px solid rgba(0, 123, 255, 0.3)" : "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        margin: "-4px -8px",
                      }}
                    />
                    <div className="note-controls" style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                      {/* Selector de color */}
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "140px" }}>
                        {NOTE_COLORS.slice(0, 6).map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = { ...note, color };
                              setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
                              updateNote(updated);
                            }}
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              backgroundColor: color,
                              border: note.color === color ? "2px solid #000" : "1px solid rgba(0,0,0,0.2)",
                              cursor: "pointer",
                              transition: "transform 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            title="Cambiar color"
                          />
                        ))}
                      </div>
                      {/* Botón de imagen */}
                      <label
                        style={{
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255, 255, 255, 0.6)",
                          border: "1px solid rgba(0,0,0,0.1)",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title="Agregar imagen"
                      >
                        📷
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(note, file);
                            }
                          }}
                        />
                      </label>
                      {/* Botón de dibujo */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrawingMode({
                            noteId: note.id,
                            enabled: !(drawingMode.noteId === note.id && drawingMode.enabled),
                          });
                          if (drawingMode.noteId === note.id && drawingMode.enabled) {
                            // Guardar canvas
                            const canvas = canvasRefs.current[note.id];
                            if (canvas) {
                              const canvasData = canvas.toDataURL();
                              const updated = { ...note, canvasData };
                              setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
                              updateNote(updated);
                            }
                          }
                        }}
                        style={{
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          backgroundColor: drawingMode.noteId === note.id && drawingMode.enabled ? "rgba(0, 123, 255, 0.2)" : "rgba(255, 255, 255, 0.6)",
                          border: "1px solid rgba(0,0,0,0.1)",
                          fontSize: "16px",
                        }}
                        title={drawingMode.noteId === note.id && drawingMode.enabled ? "Desactivar dibujo" : "Activar dibujo"}
                      >
                        ✏️
                      </button>
                      {/* Botón eliminar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
                            deleteNote(note.id);
                          }
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "18px",
                          color: "var(--text-secondary)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
                          e.currentTarget.style.color = "#dc3545";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                        title="Eliminar nota"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Imagen si existe */}
                  {note.imageUrl && (
                    <div style={{ marginBottom: "12px", borderRadius: "8px", overflow: "hidden" }}>
                      <img
                        src={note.imageUrl}
                        alt="Nota"
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: "200px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  )}

                  {/* Canvas de dibujo */}
                  {drawingMode.noteId === note.id && (
                    <div style={{ marginBottom: "12px", borderRadius: "8px", overflow: "hidden", border: "2px solid rgba(0, 123, 255, 0.3)", backgroundColor: "#fff" }}>
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[note.id] = el;
                          if (el) {
                            const rect = el.getBoundingClientRect();
                            el.width = rect.width;
                            el.height = 200;
                            const ctx = el.getContext('2d');
                            if (ctx && note.canvasData) {
                              const img = new Image();
                              img.onload = () => {
                                ctx.clearRect(0, 0, el.width, el.height);
                                ctx.drawImage(img, 0, 0);
                              };
                              img.src = note.canvasData;
                            }
                          }
                        }}
                        style={{
                          width: "100%",
                          height: "200px",
                          cursor: drawingMode.enabled ? "crosshair" : "default",
                          display: "block",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Contenido de texto */}
                  <textarea
                    value={note.content || ""}
                    onChange={(e) => {
                      const updated = { ...note, content: e.target.value };
                      setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
                    }}
                    onBlur={() => {
                      updateNote(note);
                      setEditingNoteId(null);
                    }}
                    onFocus={() => setEditingNoteId(note.id)}
                    placeholder="Escribe tu nota..."
                    style={{
                      flex: 1,
                      border: "none",
                      backgroundColor: "transparent",
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      resize: "none",
                      outline: editingNoteId === note.id ? "2px solid rgba(0, 123, 255, 0.3)" : "none",
                      borderRadius: "4px",
                      padding: "8px",
                      margin: "-8px",
                      minHeight: "80px",
                      fontFamily: "inherit",
                      lineHeight: "1.5",
                    }}
                  />

                  {/* Resize handle */}
                  {!isMobile && (
                    <div
                      className="resize-handle"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingNote({
                          id: note.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          startWidth: note.width || 280,
                          startHeight: note.height || 200,
                        });
                      }}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: "20px",
                        height: "20px",
                        cursor: "nwse-resize",
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        borderTopLeftRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ width: "8px", height: "8px", borderRight: "2px solid rgba(0,0,0,0.3)", borderBottom: "2px solid rgba(0,0,0,0.3)" }} />
                    </div>
                  )}
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
