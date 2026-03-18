import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import SearchBar from "../components/SearchBar";
import AddProjectMemberModal from "../components/AddProjectMemberModal";
import { useToast } from "../contexts/ToastContext";
import { useTerminology } from "../hooks/useTerminology";
import { useUserUsageType } from "../hooks/useUserUsageType";

type Project = {
  id: string;
  name: string;
  description?: string;
  template?: string;
  imageUrl?: string;
  taskCount: number;
  activeTaskCount: number;
  createdAt: string;
};

export default function Projects() {
  const { organizationId } = useParams<{ organizationId?: string }>();
  const location = useLocation();
  const { usageType } = useUserUsageType();
  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;
  const [projects, setProjects] = useState<Project[]>([]);
  const t = useTerminology();
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("");
  const [slaHours, setSlaHours] = useState("");
  const [slaWarningThreshold, setSlaWarningThreshold] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState<{ projectId: string; projectName: string } | null>(null);
  const { showToast } = useToast();

  const loadProjects = useCallback(async () => {
    // En modo personal, usar endpoint diferente (si existe) o no cargar
    if (isPersonalMode || isPersonalRoute) {
      setLoading(true);
      setErr(null);
      try {
        // TODO: Crear endpoint /api/users/me/projects para proyectos personales
        // Por ahora, usar un array vacío o endpoint alternativo
        const res = await http.get("/api/users/me/projects").catch(() => ({ data: [] }));
        const projectsData = res.data || [];
        setProjects(projectsData);
        setFilteredProjects(projectsData);
      } catch (ex: any) {
        // Si el endpoint no existe, simplemente usar array vacío
        setProjects([]);
        setFilteredProjects([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!organizationId) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await http.get(`/api/orgs/${organizationId}/projects`);
      const projectsData = res.data || [];
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error cargando proyectos";
      setErr(errorMsg);
      // Solo mostrar toast si es un error real, no si es redirección
      if (ex?.response?.status !== 401) {
        showToast(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId, isPersonalMode, isPersonalRoute, showToast]);

  useEffect(() => {
    // Cargar proyectos si hay organizationId o si estamos en modo personal
    if (organizationId || isPersonalMode || isPersonalRoute) {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, isPersonalMode, isPersonalRoute]); // Dependemos de organizationId o modo personal

  useEffect(() => {
    let filtered = [...projects];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    if (filterTemplate) {
      filtered = filtered.filter((p) => p.template === filterTemplate);
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, filterTemplate]);

  const createProject = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      setErr("El nombre es requerido");
      return;
    }

    setErr(null);
    setCreating(true);
    try {
      // En modo personal, usar endpoint diferente
      if (isPersonalMode || isPersonalRoute) {
        await http.post("/api/users/me/projects", {
          name: name.trim(),
          description: description.trim() || null,
          template: template.trim() || null,
          imageUrl: null,
          slaHours: slaHours ? parseInt(slaHours) : null,
          slaWarningThreshold: slaWarningThreshold ? parseInt(slaWarningThreshold) : null,
        });
      } else {
        if (!organizationId) {
          setErr(`Se requiere ID de ${t.organizationLower}`);
          setCreating(false);
          return;
        }

        await http.post(`/api/orgs/${organizationId}/projects`, {
          name: name.trim(),
          description: description.trim() || null,
          template: template.trim() || null,
          imageUrl: null,
          slaHours: slaHours ? parseInt(slaHours) : null,
          slaWarningThreshold: slaWarningThreshold ? parseInt(slaWarningThreshold) : null,
        });
      }

      setName("");
      setDescription("");
      setTemplate("");
      setSlaHours("");
      setSlaWarningThreshold("");
      await loadProjects();
      showToast("Proyecto creado exitosamente", "success");

      // Scroll suave hacia arriba para mostrar el nuevo proyecto
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error creando proyecto";
      setErr(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setCreating(false);
    }
  }, [organizationId, name, description, template, slaHours, slaWarningThreshold, loadProjects, showToast, isPersonalMode, isPersonalRoute, t]);

  // En modo personal, no requerir organizationId
  if (!isPersonalMode && !isPersonalRoute && !organizationId) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">Error: No se proporcionó ID de {t.organizationLower}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-secondary)" }}>
        <PageHeader
          title="Proyectos"
          subtitle={`${projects.length} ${projects.length === 1 ? "proyecto" : "proyectos"} en total`}
          breadcrumbs={
            isPersonalMode || isPersonalRoute
              ? [{ label: "Mis Proyectos" }]
              : [
                { label: t.organizations, to: "/org-select" },
                { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
                { label: "Proyectos" },
              ]
          }
          actions={
            !isPersonalMode && !isPersonalRoute && organizationId ? (
              <Link to={`/org/${organizationId}/dashboard`}>
                <Button variant="secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>←</span>
                  <span>Dashboard</span>
                </Button>
              </Link>
            ) : null
          }
        />

        <div style={{ 
          padding: isMobile ? "12px" : "24px", 
          maxWidth: "1400px", 
          margin: "0 auto",
          boxSizing: "border-box",
        }}>
          {/* Search Bar - Arriba */}
          {projects.length > 0 && (
            <Card style={{ marginBottom: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
              <SearchBar
                placeholder="Buscar proyectos por nombre o descripción..."
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery("")}
                debounceMs={300}
                showFilters
                filters={[
                  {
                    label: "Todas las plantillas",
                    value: filterTemplate,
                    options: [
                      { label: "Software", value: "Software" },
                      { label: "Operaciones", value: "Operaciones" },
                      { label: "Soporte", value: "Soporte" },
                      { label: "Marketing", value: "Marketing" },
                      { label: "Ventas", value: "Ventas" },
                      { label: "Diseño", value: "Diseño" },
                      { label: "Producto", value: "Producto" },
                      { label: "Recursos Humanos", value: "Recursos Humanos" },
                      { label: "Finanzas", value: "Finanzas" },
                      { label: "Legal", value: "Legal" },
                      { label: "Investigación", value: "Investigación" },
                      { label: "Eventos", value: "Eventos" },
                      { label: "Capacitación", value: "Capacitación" },
                      { label: "Innovación", value: "Innovación" },
                      { label: "Calidad", value: "Calidad" },
                      { label: "Tareas Personales", value: "Tareas Personales" },
                      { label: "Estudios", value: "Estudios" },
                      { label: "Fitness", value: "Fitness" },
                      { label: "Viajes", value: "Viajes" },
                      { label: "Finanzas Personales", value: "Finanzas Personales" },
                      { label: "Hogar", value: "Hogar" },
                    ],
                    onChange: setFilterTemplate,
                  },
                ]}
              />
              {searchQuery || filterTemplate ? (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "14px",
                    color: "#6c757d",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  <span>📊</span>
                  <span>
                    Mostrando <strong>{filteredProjects.length}</strong> de{" "}
                    <strong>{projects.length}</strong> proyectos
                  </span>
                </div>
              ) : null}
            </Card>
          )}

          {err && <div className="alert alert-error" style={{ marginBottom: "24px", borderRadius: "8px" }}>{err}</div>}

          {/* Projects Grid - Arriba */}
          {loading ? (
            <div className="loading" style={{ textAlign: "center", padding: "60px", fontSize: "16px", color: "var(--text-secondary)" }}>
              Cargando proyectos...
            </div>
          ) : projects.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "60px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>📁</div>
              <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>
                No hay proyectos todavía
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                Crea tu primer proyecto para comenzar a organizar tus tareas
              </p>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "60px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔍</div>
              <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>
                No se encontraron proyectos
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Intenta con otros términos de búsqueda o filtros
              </p>
            </Card>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
                gap: isMobile ? "16px" : "20px",
                marginBottom: isMobile ? "24px" : "32px",
              }}
            >
              {filteredProjects.map((project) => {
                const progress =
                  project.taskCount > 0
                    ? Math.round((project.activeTaskCount / project.taskCount) * 100)
                    : 0;
                const showMembersButton = !isPersonalMode && !isPersonalRoute && !!organizationId;
                return (
                  <Card 
                    key={project.id} 
                    hover 
                    className="hover-lift" 
                    style={{ 
                      position: "relative", 
                      overflow: "hidden",
                      borderRadius: "16px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.3s ease",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    {project.imageUrl && (
                      <div
                        style={{
                          width: "100%",
                          height: "140px",
                          margin: "-20px -20px 20px -20px",
                          backgroundImage: `url(${project.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4))",
                          }}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                    {showMembersButton && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowMemberModal({ projectId: project.id, projectName: project.name });
                        }}
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          padding: isMobile ? "10px 12px" : "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0, 123, 255, 0.3)",
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          color: "#007bff",
                          cursor: "pointer",
                          fontSize: isMobile ? "13px" : "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: 600,
                          transition: "all 0.2s",
                          zIndex: 10,
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                          backdropFilter: "blur(10px)",
                          justifyContent: "center",
                          minHeight: isMobile ? "40px" : undefined,
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e7f3ff";
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 123, 255, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
                        }}
                        title="Gestionar miembros del proyecto"
                      >
                        👥 Miembros
                      </button>
                    )}
                      <Link
                        to={
                          isPersonalMode || isPersonalRoute
                            ? `/personal/project/${project.id}/board`
                            : `/org/${organizationId}/project/${project.id}/board`
                        }
                        style={{
                          textDecoration: "none",
                          color: "inherit",
                          display: "block",
                          width: "100%",
                          flex: "1 1 100%",
                          minWidth: 0,
                        }}
                        className="fade-in"
                      >
                        <div style={{ marginBottom: "16px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: isMobile ? "6px" : "10px",
                              gap: "12px",
                              flexWrap: "nowrap",
                              paddingRight: showMembersButton ? "120px" : undefined,
                            }}
                          >
                            <h3
                              style={{
                                fontSize: "20px",
                                fontWeight: 700,
                                margin: 0,
                                color: "var(--text-primary)",
                                flex: "1 1 auto",
                                minWidth: 0,
                                lineHeight: "1.3",
                              }}
                            >
                              {project.name}
                            </h3>
                          </div>
                          {project.template && (
                            <div style={{ marginBottom: project.description ? "8px" : 0 }}>
                              <span
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  backgroundColor: "#e7f3ff",
                                  color: "#007bff",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 2px 4px rgba(0, 123, 255, 0.1)",
                                }}
                              >
                                {project.template}
                              </span>
                            </div>
                          )}
                          {project.description && (
                            <p
                              style={{
                                fontSize: "14px",
                                color: "var(--text-secondary)",
                                margin: 0,
                                lineHeight: "1.5",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {project.description}
                            </p>
                          )}
                        </div>

                      <div style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>Progreso</span>
                          <span style={{ fontWeight: 600, color: "var(--primary)" }}>{progress}%</span>
                        </div>
                        <div
                          style={{
                            height: "8px",
                            backgroundColor: "var(--bg-tertiary)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${progress}%`,
                              background: `linear-gradient(90deg, var(--primary) 0%, #0056b3 100%)`,
                              transition: "width 0.5s ease",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "14px",
                          color: "var(--text-secondary)",
                          paddingTop: "16px",
                          borderTop: "1px solid var(--border-color)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "18px" }}>📋</span>
                          <span>
                            <strong style={{ color: "var(--text-primary)", fontSize: "16px" }}>{project.activeTaskCount}</strong>{" "}
                            <span style={{ fontSize: "12px" }}>activas</span>
                          </span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "18px" }}>✅</span>
                          <span>
                            <strong style={{ color: "var(--text-primary)", fontSize: "16px" }}>{project.taskCount}</strong>{" "}
                            <span style={{ fontSize: "12px" }}>total</span>
                          </span>
                        </span>
                      </div>
                    </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Create Project Form - Abajo */}
          <Card style={{ borderRadius: "16px", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)", border: "2px dashed var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                backgroundColor: "var(--primary)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "24px",
                boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
              }}>
                ➕
              </div>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Crear Nuevo Proyecto
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                  Comienza un nuevo proyecto y organiza tus tareas
                </p>
              </div>
            </div>
            <form onSubmit={createProject} style={{ display: "grid", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Nombre del proyecto <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  placeholder="Ej: Sistema de gestión"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={creating}
                  required
                  className="input"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid var(--border-color)",
                    fontSize: "15px",
                    transition: "all 0.2s",
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
                    marginBottom: "8px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Descripción
                </label>
                <textarea
                  placeholder="Describe el propósito del proyecto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={creating}
                  rows={3}
                  className="textarea"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid var(--border-color)",
                    fontSize: "15px",
                    transition: "all 0.2s",
                    resize: "vertical",
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
                    marginBottom: "8px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Plantilla
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  disabled={creating}
                  className="select"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid var(--border-color)",
                    fontSize: "15px",
                    transition: "all 0.2s",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
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
                  <option value="">Sin plantilla</option>
                  <optgroup label="💼 Empresarial">
                    <option value="Software">Software</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Soporte">Soporte</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Ventas">Ventas</option>
                    <option value="Producto">Producto</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Finanzas">Finanzas</option>
                    <option value="Legal">Legal</option>
                    <option value="Calidad">Calidad</option>
                  </optgroup>
                  <optgroup label="👥 Equipo">
                    <option value="Diseño">Diseño</option>
                    <option value="Investigación">Investigación</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Capacitación">Capacitación</option>
                    <option value="Innovación">Innovación</option>
                  </optgroup>
                  <optgroup label="👤 Personal">
                    <option value="Tareas Personales">Tareas Personales</option>
                    <option value="Estudios">Estudios</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Viajes">Viajes</option>
                    <option value="Finanzas Personales">Finanzas Personales</option>
                    <option value="Hogar">Hogar</option>
                  </optgroup>
                </select>
              </div>
              <div style={{ 
                borderTop: "2px solid var(--border-color)", 
                paddingTop: "20px", 
                marginTop: "12px",
                borderRadius: "12px",
                backgroundColor: "rgba(0, 123, 255, 0.02)",
                padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "20px" }}>⏱️</span>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    Configuración de SLA (Opcional)
                  </h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      SLA en horas
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 48"
                      value={slaHours}
                      onChange={(e) => setSlaHours(e.target.value)}
                      disabled={creating}
                      min="1"
                      className="input"
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "2px solid var(--border-color)",
                        fontSize: "15px",
                        transition: "all 0.2s",
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
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                      Tiempo máximo para completar tareas
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      Umbral de advertencia (horas)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 38"
                      value={slaWarningThreshold}
                      onChange={(e) => setSlaWarningThreshold(e.target.value)}
                      disabled={creating}
                      min="1"
                      className="input"
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "2px solid var(--border-color)",
                        fontSize: "15px",
                        transition: "all 0.2s",
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
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                      Avisar cuando queden estas horas
                    </div>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!name.trim() || creating}
                loading={creating}
                style={{
                  padding: "14px 24px",
                  fontSize: "16px",
                  fontWeight: 600,
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                {creating ? "Creando..." : "✨ Crear Proyecto"}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Modal de Miembros del Proyecto */}
      {organizationId && showMemberModal && (
        <AddProjectMemberModal
          organizationId={organizationId}
          projectId={showMemberModal.projectId}
          projectName={showMemberModal.projectName}
          isOpen={true}
          onClose={() => setShowMemberModal(null)}
          onMemberAdded={() => {
            // Recargar proyectos si es necesario
          }}
        />
      )}
    </Layout>
  );
}
