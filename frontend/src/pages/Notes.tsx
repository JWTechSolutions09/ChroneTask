import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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

const NOTE_COLORS = [
  "#FFE5E5", "#E5F3FF", "#E5FFE5", "#FFF5E5", "#F0E5FF",
  "#E5FFFF", "#FFE5F0", "#FFE5D9", "#E5E5FF", "#FFE5B4",
  "#D4E5FF", "#E5FFE5", "#FFE5CC", "#E5E5FF", "#FFCCE5",
  "#CCE5FF", "#E5FFCC", "#FFCCCC", "#CCFFE5", "#E5CCFF",
  "#FFD9E5", "#D9E5FF", "#E5FFD9", "#FFE5D9", "#D9FFE5",
  "#E5D9FF", "#FFE5E5", "#E5E5FF", "#E5FFE5", "#FFF5E5"
];

// Función para determinar si un color es claro u oscuro
const isLightColor = (color: string): boolean => {
  if (!color) return true; // Por defecto, asumimos que es claro
  
  // Convertir hex a RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcular luminosidad relativa
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Si la luminosidad es mayor a 0.5, es un color claro
  return luminance > 0.5;
};

// Función para obtener el color de texto apropiado según el fondo
const getTextColor = (backgroundColor: string): string => {
  if (!backgroundColor) {
    // Si no hay color, usar el color de texto primario del tema
    return "var(--text-primary)";
  }
  
  if (isLightColor(backgroundColor)) {
    // Para fondos claros, siempre usar texto oscuro (negro) para buen contraste
    return "#212529"; // Negro oscuro que se ve bien en fondos claros
  } else {
    // Para fondos oscuros, siempre usar texto claro (blanco) para buen contraste
    return "#ffffff"; // Blanco que se ve bien en fondos oscuros
  }
};

export default function Notes() {
  const { organizationId, projectId } = useParams<{ organizationId?: string; projectId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return true;
  });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<{ noteId: string; enabled: boolean }>({ noteId: "", enabled: false });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const { showToast } = useToast();

  // Detectar si estamos en móvil y orientación
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

  // Cerrar selector de colores al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showColorPicker && !(e.target as HTMLElement).closest('.note-controls')) {
        setShowColorPicker(null);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

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

  // Manejo de touch para móvil
  const [touchStart, setTouchStart] = useState<{ noteId: string; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, note: Note) => {
    if (!isMobile) return;
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    if ((e.target as HTMLElement).tagName === "CANVAS") return;
    if ((e.target as HTMLElement).closest(".note-controls")) return;
    if ((e.target as HTMLElement).closest(".note-content")) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTouchStart({
      noteId: note.id,
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !touchStart || !containerRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = touch.clientX - containerRect.left - touchStart.offsetX;
    const newY = touch.clientY - containerRect.top - touchStart.offsetY;

    const note = notes.find((n) => n.id === touchStart.noteId);
    if (note) {
      const updatedNote = {
        ...note,
        positionX: Math.max(0, Math.min(newX, containerRect.width - (note.width || 280))),
        positionY: Math.max(0, Math.min(newY, containerRect.height - (note.height || 200))),
      };
      setNotes(notes.map((n) => (n.id === note.id ? updatedNote : n)));
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !touchStart) return;
    const note = notes.find((n) => n.id === touchStart.noteId);
    if (note) {
      updateNote(note);
    }
    setTouchStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent, note: Note) => {
    if (isMobile) return;
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    if ((e.target as HTMLElement).tagName === "CANVAS") return;
    if ((e.target as HTMLElement).closest(".note-controls")) return;
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      // Permitir arrastre desde el drag handle
    } else if ((e.target as HTMLElement).closest(".note-content")) {
      // No arrastrar desde el contenido
      return;
    }

    e.preventDefault();
    setIsDragging(true);
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
      setIsDragging(false);
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

  // Manejar touch events para móvil
  useEffect(() => {
    if (touchStart && isMobile) {
      const handleTouchMoveGlobal = (e: TouchEvent) => {
        e.preventDefault();
        if (containerRef.current) {
          const touch = e.touches[0];
          const containerRect = containerRef.current.getBoundingClientRect();
          const newX = touch.clientX - containerRect.left - touchStart.offsetX;
          const newY = touch.clientY - containerRect.top - touchStart.offsetY;

          const note = notes.find((n) => n.id === touchStart.noteId);
          if (note) {
            const updatedNote = {
              ...note,
              positionX: Math.max(0, Math.min(newX, containerRect.width - (note.width || 280))),
              positionY: Math.max(0, Math.min(newY, containerRect.height - (note.height || 200))),
            };
            setNotes(notes.map((n) => (n.id === note.id ? updatedNote : n)));
          }
        }
      };

      const handleTouchEndGlobal = () => {
        const note = notes.find((n) => n.id === touchStart.noteId);
        if (note) {
          updateNote(note);
        }
        setTouchStart(null);
      };

      document.addEventListener("touchmove", handleTouchMoveGlobal, { passive: false });
      document.addEventListener("touchend", handleTouchEndGlobal);
      return () => {
        document.removeEventListener("touchmove", handleTouchMoveGlobal);
        document.removeEventListener("touchend", handleTouchEndGlobal);
      };
    }
  }, [touchStart, isMobile, notes]);

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

  const pageTitle = isPersonalNotes ? "Notas Personales" : "Notas del Proyecto";

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
            <Button 
              variant="primary" 
              onClick={() => {
                if (isMobile) {
                  // En móvil, redirigir a la página de crear nota
                  if (isPersonalNotes || isPersonalMode || isPersonalRoute) {
                    navigate("/personal/create-note");
                  } else if (organizationId && projectId) {
                    navigate(`/org/${organizationId}/project/${projectId}/create-note`);
                  } else if (organizationId) {
                    navigate(`/org/${organizationId}/create-note`);
                  }
                } else {
                  // En desktop, crear nota directamente
                  createNote();
                }
              }}
            >
              + Nueva Nota
            </Button>
          }
        />

        <div
          ref={containerRef}
          style={{
            position: "relative",
            minHeight: isMobile ? "calc(100dvh - 180px)" : "calc(100vh - 200px)",
            padding: isMobile ? "16px" : "24px",
            backgroundColor: "#f5f7fa",
            backgroundImage: isMobile ? "none" : `
              linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px),
              linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
              radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: isMobile ? "auto" : "50px 50px, 50px 50px, 25px 25px",
            display: isMobile ? "flex" : "block",
            flexDirection: isMobile ? "column" : "initial",
            gap: isMobile ? "16px" : "0",
            overflow: isMobile ? "auto" : "hidden",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
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
              {notes.map((note) => 
                isMobile ? (
                  // Vista de lista simple para móvil
                  <div
                    key={note.id}
                    style={{
                      width: "100%",
                      backgroundColor: note.color || "#FFE5E5",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "16px",
                      boxSizing: "border-box" as const,
                    }}
                  >
                    {/* Título */}
                    <div style={{ marginBottom: "12px" }}>
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
                          color: getTextColor(note.color || "#FFE5E5"),
                          width: "100%",
                          outline: editingNoteId === note.id ? "2px solid rgba(0, 123, 255, 0.5)" : "none",
                          borderRadius: "4px",
                          padding: "4px 0",
                          boxSizing: "border-box" as const,
                        }}
                      />
                    </div>

                    {/* Contenido */}
                    {editingNoteId === note.id ? (
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
                        placeholder="Escribe tu nota..."
                        style={{
                          width: "100%",
                          border: "none",
                          backgroundColor: "transparent",
                          fontSize: "15px",
                          lineHeight: "1.6",
                          color: getTextColor(note.color || "#FFE5E5"),
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                          resize: "vertical",
                          minHeight: "100px",
                          padding: "8px",
                          borderRadius: "8px",
                          outline: "2px solid rgba(0, 123, 255, 0.3)",
                          fontFamily: "inherit",
                          marginBottom: "12px",
                          boxSizing: "border-box" as const,
                        }}
                      />
                    ) : (
                      note.content && (
                        <div style={{ 
                          marginBottom: "12px",
                          fontSize: "15px",
                          lineHeight: "1.6",
                          color: getTextColor(note.color || "#FFE5E5"),
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}>
                          {note.content}
                        </div>
                      )
                    )}

                    {/* Imagen si existe */}
                    {note.imageUrl && (
                      <div style={{ marginBottom: "12px", borderRadius: "8px", overflow: "hidden" }}>
                        <img
                          src={note.imageUrl}
                          alt="Nota"
                          style={{
                            width: "100%",
                            height: "auto",
                            maxHeight: "300px",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    )}

                    {/* Controles */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "flex-end", 
                      gap: "8px",
                      paddingTop: "12px",
                      borderTop: isLightColor(note.color || "#FFE5E5")
                        ? "1px solid rgba(0, 0, 0, 0.1)"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                    }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNoteId(editingNoteId === note.id ? null : note.id);
                        }}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: isLightColor(note.color || "#FFE5E5")
                            ? "rgba(255, 255, 255, 0.7)"
                            : "rgba(0, 0, 0, 0.2)",
                          border: isLightColor(note.color || "#FFE5E5")
                            ? "1px solid rgba(0, 0, 0, 0.1)"
                            : "1px solid rgba(255, 255, 255, 0.2)",
                          cursor: "pointer",
                          fontSize: "18px",
                          color: getTextColor(note.color || "#FFE5E5"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={editingNoteId === note.id ? "Guardar" : "Editar"}
                      >
                        {editingNoteId === note.id ? "✓" : "✏️"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowColorPicker(showColorPicker === note.id ? null : note.id);
                        }}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: note.color || "#FFE5E5",
                          border: isLightColor(note.color || "#FFE5E5")
                            ? "2px solid rgba(0, 0, 0, 0.2)"
                            : "2px solid rgba(255, 255, 255, 0.5)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                        }}
                        title="Cambiar color"
                      >
                        🎨
                      </button>
                      {showColorPicker === note.id && (
                        <div
                          style={{
                            position: "absolute",
                            backgroundColor: "var(--bg-primary)",
                            borderRadius: "12px",
                            padding: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            zIndex: 1001,
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "40px",
                            border: "1px solid var(--border-color)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {NOTE_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = { ...note, color };
                                setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
                                updateNote(updated);
                                setShowColorPicker(null);
                              }}
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                backgroundColor: color,
                                border: note.color === color ? "3px solid var(--primary)" : "2px solid var(--border-color)",
                                cursor: "pointer",
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
                            deleteNote(note.id);
                          }
                        }}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: isLightColor(note.color || "#FFE5E5")
                            ? "rgba(255, 255, 255, 0.7)"
                            : "rgba(0, 0, 0, 0.2)",
                          border: isLightColor(note.color || "#FFE5E5")
                            ? "1px solid rgba(0, 0, 0, 0.1)"
                            : "1px solid rgba(255, 255, 255, 0.2)",
                          cursor: "pointer",
                          fontSize: "20px",
                          color: "#dc3545",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Eliminar nota"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  // Vista desktop con cards animadas
                  <Card
                    key={note.id}
                    style={{
                      position: "absolute",
                      left: note.positionX || 0,
                      top: note.positionY || 0,
                      width: note.width || 300,
                      height: note.height || 220,
                      minHeight: "220px",
                      backgroundColor: note.color || "#FFE5E5",
                      padding: "0",
                      cursor: draggedNote?.id === note.id ? "grabbing" : "default",
                      boxShadow: draggedNote?.id === note.id
                        ? "0 12px 40px rgba(0, 0, 0, 0.25), 0 6px 12px rgba(0, 0, 0, 0.15)"
                        : "0 8px 24px rgba(0, 0, 0, 0.15), 0 3px 8px rgba(0, 0, 0, 0.1)",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "16px",
                      border: draggedNote?.id === note.id
                        ? "2px solid rgba(0, 123, 255, 0.5)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                      transition: draggedNote?.id === note.id
                        ? "none"
                        : "box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease",
                      transform: draggedNote?.id === note.id
                        ? "scale(1.02) rotate(1deg)"
                        : "scale(1)",
                      zIndex: draggedNote?.id === note.id ? 1000 : 1,
                      overflow: "hidden",
                      boxSizing: "border-box" as const,
                    }}
                    onMouseEnter={(e) => {
                      if (draggedNote?.id !== note.id) {
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.12)";
                        e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
                        e.currentTarget.style.borderColor = "rgba(0, 123, 255, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (draggedNote?.id !== note.id) {
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15), 0 3px 8px rgba(0, 0, 0, 0.1)";
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
                      }
                    }}
                  >
                  {/* Drag Handle */}
                  {!isMobile && (
                    <div
                      className="drag-handle"
                      onMouseDown={(e) => handleMouseDown(e, note)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: isLightColor(note.color || "#FFE5E5") 
                          ? "rgba(255, 255, 255, 0.3)" 
                          : "rgba(0, 0, 0, 0.2)",
                        borderBottom: isLightColor(note.color || "#FFE5E5")
                          ? "1px solid rgba(0, 0, 0, 0.1)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                        cursor: draggedNote?.id === note.id ? "grabbing" : "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                        <div style={{
                          display: "flex",
                          gap: "4px",
                          opacity: 0.5,
                          color: getTextColor(note.color || "#FFE5E5"),
                        }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "currentColor" }} />
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "currentColor" }} />
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "currentColor" }} />
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "currentColor" }} />
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "currentColor" }} />
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "currentColor" }} />
                        </div>
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
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            border: "none",
                            backgroundColor: "transparent",
                            fontSize: "16px",
                            fontWeight: 600,
                            color: getTextColor(note.color || "#FFE5E5"),
                            flex: 1,
                            outline: editingNoteId === note.id ? "2px solid rgba(0, 123, 255, 0.4)" : "none",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "text",
                            width: "100%",
                            boxSizing: "border-box" as const,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Contenido de la nota */}
                  <div className="note-content" style={{ 
                    padding: isMobile ? "16px" : "16px", 
                    flex: 1, 
                    display: "flex", 
                    flexDirection: "column",
                    overflow: "visible",
                    minHeight: isMobile ? "auto" : 0,
                    width: "100%",
                    boxSizing: "border-box" as const,
                  }}>
                    {/* Header con título y controles - Solo título en móvil */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: isMobile ? "space-between" : "flex-end", 
                      alignItems: isMobile ? "flex-start" : "center", 
                      marginBottom: isMobile ? "16px" : "12px", 
                      gap: "8px",
                      flexDirection: isMobile ? "column" : "row",
                    }}>
                      {isMobile && (
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
                            fontSize: "20px",
                            fontWeight: 600,
                            color: getTextColor(note.color || "#FFE5E5"),
                            flex: 1,
                            outline: editingNoteId === note.id ? "2px solid rgba(0, 123, 255, 0.3)" : "none",
                            borderRadius: "4px",
                            padding: "8px 0",
                            margin: "0",
                            width: "100%",
                            boxSizing: "border-box" as const,
                          }}
                        />
                      )}
                      <div className="note-controls" style={{ 
                        display: "flex", 
                        gap: isMobile ? "6px" : "8px", 
                        alignItems: "center", 
                        flexShrink: 0,
                        flexWrap: isMobile ? "wrap" : "nowrap",
                        justifyContent: isMobile ? "flex-end" : "flex-start",
                      }}>
                        {/* Selector de color mejorado */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowColorPicker(showColorPicker === note.id ? null : note.id);
                            }}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              backgroundColor: note.color || "#FFE5E5",
                              border: "2px solid rgba(255, 255, 255, 0.8)",
                              cursor: "pointer",
                              transition: "transform 0.2s, box-shadow 0.2s",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.1)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
                            }}
                            title="Cambiar color"
                          >
                            🎨
                          </button>
                          {showColorPicker === note.id && (
                            <div
                              style={{
                                position: "absolute",
                                top: "40px",
                                right: "0",
                                backgroundColor: "var(--bg-primary)",
                                borderRadius: "12px",
                                padding: "12px",
                                boxShadow: "var(--shadow-lg)",
                                zIndex: 1001,
                                display: "grid",
                                gridTemplateColumns: "repeat(6, 1fr)",
                                gap: "8px",
                                minWidth: "200px",
                                border: "1px solid var(--border-color)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {NOTE_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = { ...note, color };
                                    setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
                                    updateNote(updated);
                                    setShowColorPicker(null);
                                  }}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    backgroundColor: color,
                                    border: note.color === color ? "3px solid #000" : "2px solid rgba(255, 255, 255, 0.8)",
                                    cursor: "pointer",
                                    transition: "transform 0.15s, box-shadow 0.15s",
                                    boxShadow: note.color === color
                                      ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                                      : "0 2px 6px rgba(0, 0, 0, 0.15)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.15)";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.25)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = note.color === color
                                      ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                                      : "0 2px 6px rgba(0, 0, 0, 0.15)";
                                  }}
                                  title={color}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Botón de imagen */}
                        <label
                          style={{
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                            border: "1px solid rgba(0,0,0,0.1)",
                            fontSize: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            transition: "all 0.2s",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
                          }}
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
                            padding: "8px",
                            borderRadius: "8px",
                            backgroundColor: drawingMode.noteId === note.id && drawingMode.enabled
                              ? "rgba(0, 123, 255, 0.25)"
                              : "rgba(255, 255, 255, 0.7)",
                            border: "1px solid rgba(0,0,0,0.1)",
                            fontSize: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            transition: "all 0.2s",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
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
                            background: "rgba(255, 255, 255, 0.7)",
                            border: "1px solid rgba(0,0,0,0.1)",
                            cursor: "pointer",
                            fontSize: "20px",
                            color: "var(--text-secondary)",
                            padding: "8px",
                            borderRadius: "8px",
                            transition: "all 0.2s",
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.15)";
                            e.currentTarget.style.color = "#dc3545";
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 53, 69, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
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
                      <div style={{ marginBottom: "12px", borderRadius: "8px", overflow: "hidden", border: "2px solid rgba(0, 123, 255, 0.3)", backgroundColor: "var(--bg-primary)" }}>
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
                      onClick={(e) => e.stopPropagation()}
                      rows={isMobile ? 10 : 6}
                      style={{
                        flex: 1,
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: isMobile ? "16px" : "14px",
                        color: getTextColor(note.color || "#FFE5E5"),
                        resize: isMobile ? "vertical" : "none",
                        outline: editingNoteId === note.id ? "2px solid rgba(0, 123, 255, 0.4)" : "none",
                        borderRadius: "8px",
                        padding: isMobile ? "12px" : "8px",
                        minHeight: isMobile ? "180px" : "100px",
                        fontFamily: "inherit",
                        lineHeight: "1.7",
                        cursor: "text",
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box" as const,
                        overflowY: "auto",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}
                    />
                  </div>

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
                          startWidth: note.width || 300,
                          startHeight: note.height || 220,
                        });
                      }}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: "24px",
                        height: "24px",
                        cursor: "nwse-resize",
                        backgroundColor: "rgba(0, 0, 0, 0.08)",
                        borderTopLeftRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(0, 123, 255, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.08)";
                      }}
                    >
                      <div style={{
                        width: "12px",
                        height: "12px",
                        borderRight: "2px solid rgba(0,0,0,0.4)",
                        borderBottom: "2px solid rgba(0,0,0,0.4)",
                        borderRadius: "0 0 8px 0",
                      }} />
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
