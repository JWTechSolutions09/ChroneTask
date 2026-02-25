import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import SearchBar from "../components/SearchBar";
import AddProjectMemberModal from "../components/AddProjectMemberModal";
import ImageUpload from "../components/ImageUpload";
import { useToast } from "../contexts/ToastContext";

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
  const { organizationId } = useParams<{ organizationId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState<{ projectId: string; projectName: string } | null>(null);
  const { showToast } = useToast();

  const loadProjects = useCallback(async () => {
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
  }, [organizationId, showToast]);

  useEffect(() => {
    if (organizationId) {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]); // Solo dependemos de organizationId para evitar loops

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
    
    if (!organizationId || !name.trim()) {
      setErr("El nombre es requerido");
      return;
    }

    setErr(null);
    setCreating(true);
    try {
      await http.post(`/api/orgs/${organizationId}/projects`, {
        name: name.trim(),
        description: description.trim() || null,
        template: template.trim() || null,
        imageUrl: imageUrl.trim() || null,
      });
      setName("");
      setDescription("");
      setTemplate("");
      setImageUrl("");
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
  }, [organizationId, name, description, template, loadProjects, showToast]);

  if (!organizationId) {
    return (
      <Layout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="alert alert-error">Error: No se proporcionó ID de organización</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout organizationId={organizationId}>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#f8f9fa" }}>
        <PageHeader
          title="Proyectos"
          subtitle={`${projects.length} ${projects.length === 1 ? "proyecto" : "proyectos"} en total`}
          breadcrumbs={[
            { label: "Organizaciones", to: "/org-select" },
            { label: "Dashboard", to: `/org/${organizationId}/dashboard` },
            { label: "Proyectos" },
          ]}
          actions={
            <Link to={`/org/${organizationId}/dashboard`}>
              <Button variant="secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>←</span>
                <span>Dashboard</span>
              </Button>
            </Link>
          }
        />

        <div style={{ padding: "24px" }}>
          {/* Create Project Form */}
          <Card style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>
              Crear Nuevo Proyecto
            </h2>
            <form onSubmit={createProject} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  Nombre del proyecto *
                </label>
                <input
                  placeholder="Ej: Sistema de gestión"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={creating}
                  required
                  className="input"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
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
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
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
                >
                  <option value="">Sin plantilla</option>
                  <option value="Software">Software</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Soporte">Soporte</option>
                </select>
              </div>
              <ImageUpload
                currentImageUrl={imageUrl || undefined}
                onImageChange={(url) => setImageUrl(url)}
                label="Imagen del Proyecto"
                maxSizeMB={5}
              />
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  O pega una URL de imagen
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={creating}
                  className="input"
                />
              </div>
              <Button
                type="submit"
                variant="success"
                disabled={!name.trim() || creating}
                loading={creating}
              >
                Crear Proyecto
              </Button>
            </form>
          </Card>

          {err && <div className="alert alert-error">{err}</div>}

          {/* Search and Filters */}
          {projects.length > 0 && (
            <Card style={{ marginBottom: "24px" }}>
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

          {loading ? (
            <div className="loading">Cargando proyectos...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <p>No hay proyectos todavía. Crea uno para comenzar.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {filteredProjects.map((project) => {
                const progress =
                  project.taskCount > 0
                    ? Math.round((project.activeTaskCount / project.taskCount) * 100)
                    : 0;
                return (
                    <Card key={project.id} hover className="hover-lift" style={{ position: "relative", overflow: "hidden" }}>
                      {project.imageUrl && (
                        <div
                          style={{
                            width: "100%",
                            height: "120px",
                            margin: "-20px -20px 16px -20px",
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
                              background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))",
                            }}
                          />
                        </div>
                      )}
                      <Link
                        to={`/org/${organizationId}/project/${project.id}/board`}
                        style={{ textDecoration: "none", color: "inherit" }}
                        className="fade-in"
                      >
                      <div style={{ marginBottom: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "18px",
                              fontWeight: 600,
                              margin: 0,
                              color: "var(--text-primary)",
                              flex: 1,
                            }}
                          >
                            {project.name}
                          </h3>
                          {project.template && (
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                backgroundColor: "#e7f3ff",
                                color: "#007bff",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              {project.template}
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text-secondary)",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {project.description}
                          </p>
                        )}
                      </div>

                      <div style={{ marginBottom: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <span>Progreso</span>
                          <span>{progress}%</span>
                        </div>
                        <div
                          style={{
                            height: "6px",
                            backgroundColor: "var(--bg-tertiary)",
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${progress}%`,
                              backgroundColor: "var(--primary)",
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          paddingTop: "12px",
                          borderTop: "1px solid var(--border-color)",
                        }}
                      >
                        <span>
                          <strong style={{ color: "var(--text-primary)" }}>{project.activeTaskCount}</strong> activas
                        </span>
                        <span>
                          <strong style={{ color: "var(--text-primary)" }}>{project.taskCount}</strong> total
                        </span>
                      </div>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowMemberModal({ projectId: project.id, projectName: project.name });
                        }}
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #007bff",
                          backgroundColor: "white",
                          color: "#007bff",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 500,
                          transition: "all 0.2s",
                          zIndex: 10,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e7f3ff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "white";
                        }}
                        title="Gestionar miembros del proyecto"
                      >
                        👥 Miembros
                      </button>
                    </Card>
                );
              })}
            </div>
          )}
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
