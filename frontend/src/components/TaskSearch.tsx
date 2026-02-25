import React, { useState, useEffect } from "react";
import { http } from "../api/http";

type TaskSearchProps = {
  organizationId: string;
  projectId?: string;
  onTaskSelect?: (taskId: string) => void;
};

export default function TaskSearch({ organizationId, projectId, onTaskSelect }: TaskSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchTasks = async () => {
      setLoading(true);
      try {
        const url = projectId
          ? `/api/projects/${projectId}/tasks`
          : `/api/orgs/${organizationId}/projects`;
        const res = await http.get(url);
        
        const allTasks = projectId
          ? res.data || []
          : (res.data || []).flatMap((p: any) => p.tasks || []);

        const filtered = allTasks.filter((task: any) =>
          task.title?.toLowerCase().includes(query.toLowerCase()) ||
          task.description?.toLowerCase().includes(query.toLowerCase())
        );

        setResults(filtered.slice(0, 10));
      } catch (error) {
        console.error("Error buscando tareas:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchTasks, 300);
    return () => clearTimeout(timer);
  }, [query, organizationId, projectId]);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Buscar tareas... (Ctrl+K)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input"
        style={{ paddingLeft: "40px" }}
      />
      <span
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "18px",
          color: "var(--text-secondary)",
        }}
      >
        🔍
      </span>
      
      {query && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            boxShadow: "var(--shadow-lg)",
            zIndex: 1000,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {results.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                onTaskSelect?.(task.id);
                setQuery("");
              }}
              style={{
                padding: "12px",
                borderBottom: "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hover-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                {task.title}
              </div>
              {task.description && (
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {task.description.substring(0, 60)}...
                </div>
              )}
              <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                Estado: {task.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
