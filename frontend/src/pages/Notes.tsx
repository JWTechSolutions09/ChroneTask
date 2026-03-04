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

type ProjectNote = {
  id: string;
  projectId: string;
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

const NOTE_COLORS = ["#FFE5E5", "#E5F3FF", "#E5FFE5", "#FFF5E5", "#F0E5FF", "#E5FFFF", "#FFE5F0"];

export default function Notes() {
  const { organizationId, projectId } = useParams<{ organizationId?: string; projectId?: string }>();
  const location = useLocation();
  const { usageType } = useUserUsageType();
  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null);
  const t = useTerminology();
  const [isCreating, setIsCreating] = useState(false);
  const [draggedNote, setDraggedNote] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizingNote, setResizingNote] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
      if (isPersonalMode || isPersonalRoute) {
        // Si hay projectId, cargar notas de ese proyecto
        // Si no, cargar todas las notas de todos los proyectos personales
        if (projectId) {
          const res = await http.get(`/api/users/me/projects/${projectId}/notes`);
          setNotes(res.data || []);
        } else {
          // Cargar todas las notas de todos los proyectos personales
          const projectsRes = await http.get("/api/users/me/projects");
          const projects = projectsRes.data || [];
          let allNotes: ProjectNote[] = [];
          for (const project of projects) {
            try {
              const notesRes = await http.get(`/api/users/me/projects/${project.id}/notes`);
              allNotes = [...allNotes, ...(notesRes.data || [])];
            } catch (ex: any) {
              // Silently fail for individual projects
            }
          }
          setNotes(allNotes);
        }
      } else {
        // Modo organizacional
        if (!organizationId) return;
        
        if (projectId) {
          // Si hay projectId, cargar notas de ese proyecto
          const res = await http.get(`/api/orgs/${organizationId}/projects/${projectId}/notes`);
          setNotes(res.data || []);
        } else {
          // Si no hay projectId, cargar todas las notas de todos los proyectos de la organización
          const projectsRes = await http.get(`/api/orgs/${organizationId}/projects`);
          const projects = projectsRes.data || [];
          let allNotes: ProjectNote[] = [];
          for (const project of projects) {
            try {
              const notesRes = await http.get(`/api/orgs/${organizationId}/projects/${project.id}/notes`);
              allNotes = [...allNotes, ...(notesRes.data || [])];
            } catch (ex: any) {
              // Silently fail for individual projects
            }
          }
          setNotes(allNotes);
        }
      }
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando notas";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId, showToast, isPersonalMode, isPersonalRoute]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const createNote = async () => {
    if (!projectId) return;
    try {
      const endpoint = isPersonalMode || isPersonalRoute
        ? `/api/users/me/projects/${projectId}/notes`
        : `/api/orgs/${organizationId}/projects/${projectId}/notes`;
      const res = await http.post(endpoint, {
        title: "Nueva Nota",
        content: "",
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        positionX: Math.random() * 300 + 50,
        positionY: Math.random() * 300 + 50,
        width: 200,
        height: 150,
      });
      await loadNotes();
      setSelectedNote(res.data);
      setIsCreating(false);
      showToast("Nota creada exitosamente", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando nota";
      showToast(errorMsg, "error");
    }
  };

  const updateNote = async (note: ProjectNote) => {
    // En modo personal, usar el projectId de la nota si no hay uno en la URL
    const targetProjectId = projectId || note.projectId;
    
    if (!targetProjectId) {
      showToast("No se puede actualizar la nota: falta projectId", "error");
      return;
    }
    
    if (!isPersonalMode && !isPersonalRoute && !organizationId) {
      showToast("Se requiere una organización", "error");
      return;
    }
    
    try {
      const endpoint = isPersonalMode || isPersonalRoute
        ? `/api/users/me/projects/${targetProjectId}/notes/${note.id}`
        : `/api/orgs/${organizationId}/projects/${targetProjectId}/notes/${note.id}`;
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
      await loadNotes();
    } catch (ex: any) {
      showToast("Error actualizando nota", "error");
    }
  };

  const deleteNote = async (id: string) => {
    // Encontrar la nota para obtener su projectId
    const note = notes.find((n) => n.id === id);
    if (!note) {
      showToast("Nota no encontrada", "error");
      return;
    }
    
    // En modo personal, usar el projectId de la nota
    if (isPersonalMode || isPersonalRoute) {
      const targetProjectId = projectId || note.projectId;
      if (!targetProjectId) {
        showToast("No se puede eliminar la nota: falta projectId", "error");
        return;
      }
      try {
        await http.delete(`/api/users/me/projects/${targetProjectId}/notes/${id}`);
        await loadNotes();
        if (selectedNote?.id === id) {
          setSelectedNote(null);
        }
        showToast("Nota eliminada exitosamente", "success");
      } catch (ex: any) {
        showToast("Error eliminando nota", "error");
      }
      return;
    }
    
    // Modo organizacional: usar el projectId de la nota si no hay uno en la URL
    if (!organizationId) {
      showToast("Se requiere una organización", "error");
      return;
    }
    
    const targetProjectId = projectId || note.projectId;
    if (!targetProjectId) {
      showToast("No se puede eliminar la nota: falta projectId", "error");
      return;
    }
    
    try {
      await http.delete(`/api/orgs/${organizationId}/projects/${targetProjectId}/notes/${id}`);
      await loadNotes();
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      showToast("Nota eliminada exitosamente", "success");
    } catch (ex: any) {
      showToast("Error eliminando nota", "error");
    }
  };

  const handleMouseDown = (e: React.MouseEvent, note: ProjectNote) => {
    // En móvil, no permitir arrastrar
    if (isMobile) return;
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    
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
          positionX: Math.max(0, Math.min(newX, containerRect.width - (note.width || 200))),
          positionY: Math.max(0, Math.min(newY, containerRect.height - (note.height || 150))),
        };
        setNotes(notes.map((n) => (n.id === note.id ? updatedNote : n)));
      }
    }

    if (resizingNote && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(150, resizingNote.startWidth + (e.clientX - resizingNote.startX));
      const newHeight = Math.max(100, resizingNote.startHeight + (e.clientY - resizingNote.startY));

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

  // En modo organizacional, requerimos organizationId
  if (!isPersonalMode && !isPersonalRoute && !organizationId) {
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

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Notas Interactivas"
          subtitle={`${notes.length} notas`}
          breadcrumbs={
            isPersonalMode || isPersonalRoute
              ? [
                  { label: "Notas" },
                ]
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
            projectId ? (
              <Button variant="primary" onClick={createNote}>
                + Nueva Nota
              </Button>
            ) : null
          }
        />

        <div
          ref={containerRef}
          style={{
            position: "relative",
            minHeight: "calc(100vh - 200px)",
            padding: isMobile ? "12px" : "24px",
            backgroundColor: "#f5f5f5",
            backgroundImage: isMobile ? "none" : "radial-gradient(circle, #ddd 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            display: isMobile ? "flex" : "block",
            flexDirection: isMobile ? "column" : "initial",
            gap: isMobile ? "12px" : "0",
          }}
          className={isMobile ? "notes-mobile-container" : ""}
        >
          {loading ? (
            <div className="loading">Cargando notas...</div>
          ) : (
            <>
              {notes.map((note) => (
                <Card
                  key={note.id}
                  style={{
                    position: isMobile ? "relative" : "absolute",
                    left: isMobile ? "auto" : note.positionX || 0,
                    top: isMobile ? "auto" : note.positionY || 0,
                    width: isMobile ? "100%" : note.width || 200,
                    height: isMobile ? "auto" : note.height || 150,
                    minHeight: isMobile ? "120px" : "150px",
                    backgroundColor: note.color || "#FFE5E5",
                    padding: isMobile ? "12px" : "12px",
                    cursor: isMobile ? "default" : (draggedNote?.id === note.id ? "grabbing" : "grab"),
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: isMobile ? "12px" : "0",
                  }}
                  onMouseDown={(e) => handleMouseDown(e, note)}
                  onClick={() => setSelectedNote(note)}
                  className={isMobile ? "note-mobile-card" : ""}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <input
                      value={note.title || ""}
                      onChange={(e) => {
                        const updated = { ...note, title: e.target.value };
                        setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
                      }}
                      onBlur={() => updateNote(note)}
                      placeholder="Título..."
                      style={{
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        flex: 1,
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: "4px" }}>
                      {NOTE_COLORS.map((color) => (
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
                            border: note.color === color ? "2px solid #000" : "1px solid #ccc",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "18px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={note.content || ""}
                    onChange={(e) => {
                      const updated = { ...note, content: e.target.value };
                      setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
                    }}
                    onBlur={() => updateNote(note)}
                    placeholder="Escribe tu nota..."
                    style={{
                      flex: 1,
                      border: "none",
                      backgroundColor: "transparent",
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  {!isMobile && (
                    <div
                      className="resize-handle"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingNote({
                          id: note.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          startWidth: note.width || 200,
                          startHeight: note.height || 150,
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
                        borderTopLeftRadius: "4px",
                      }}
                    />
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
