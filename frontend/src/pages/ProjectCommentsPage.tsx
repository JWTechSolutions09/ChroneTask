import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import Layout from "../components/Layout";
import ProjectCommentsBody from "../components/ProjectCommentsBody";
import { useToast } from "../contexts/ToastContext";
import { useUserUsageType } from "../hooks/useUserUsageType";

export default function ProjectCommentsPage() {
  const { organizationId, projectId } = useParams<{ organizationId?: string; projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usageType } = useUserUsageType();
  const { showToast } = useToast();

  const isPersonalMode = usageType === "personal";
  const isPersonalRoute = location?.pathname?.startsWith("/personal") ?? false;

  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const loadProjectInfo = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = isPersonalMode || isPersonalRoute
        ? await http.get(`/api/users/me/projects/${projectId}`)
        : await http.get(`/api/orgs/${organizationId}/projects/${projectId}`);
      setProjectName(res.data?.name || "");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Error cargando información del proyecto";
      showToast(msg, "error");
    }
  }, [projectId, organizationId, isPersonalMode, isPersonalRoute, showToast]);

  useEffect(() => {
    loadProjectInfo();
  }, [loadProjectInfo]);

  const handleBack = () => {
    if (isPersonalMode || isPersonalRoute) {
      navigate(`/personal/project/${projectId}/board`);
    } else if (organizationId) {
      navigate(`/org/${organizationId}/project/${projectId}/board`);
    } else {
      navigate(-1);
    }
  };

  return (
    <Layout organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "var(--bg-secondary)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-primary)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <div style={{ textAlign: "center", paddingRight: "40px", paddingLeft: "40px" }}>
              <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
                💬 Comentarios
              </h1>
              <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-secondary)" }}>
                {projectName || "Proyecto"}
              </div>
            </div>
            <button
              onClick={handleBack}
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
                position: "absolute",
                right: 0,
                top: 0,
              }}
              title="Volver"
              aria-label="Volver"
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <ProjectCommentsBody
            organizationId={isPersonalMode || isPersonalRoute ? undefined : organizationId}
            projectId={projectId}
            enabled={true}
            contentPadding={16}
            composerPadding={16}
          />
        </div>
      </div>
    </Layout>
  );
}

