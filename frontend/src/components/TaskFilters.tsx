import React from "react";
import Card from "./Card";

type TaskFiltersProps = {
  onFilterChange: (filters: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
  }) => void;
  projectMembers: Array<{ userId: string; userName: string }>;
};

export default function TaskFilters({ onFilterChange, projectMembers }: TaskFiltersProps) {
  const [status, setStatus] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    onFilterChange({ status, priority, assignedTo, search });
  }, [status, priority, assignedTo, search, onFilterChange]);

  return (
    <Card style={{ marginBottom: "16px", padding: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select"
            style={{ fontSize: "13px" }}
          >
            <option value="">Todos</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Review">Review</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Prioridad
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="select"
            style={{ fontSize: "13px" }}
          >
            <option value="">Todas</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Asignado a
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="select"
            style={{ fontSize: "13px" }}
          >
            <option value="">Todos</option>
            {projectMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.userName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Buscar
          </label>
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ fontSize: "13px" }}
          />
        </div>
      </div>
      {(status || priority || assignedTo || search) && (
        <button
          onClick={() => {
            setStatus("");
            setPriority("");
            setAssignedTo("");
            setSearch("");
          }}
          style={{
            marginTop: "12px",
            padding: "6px 12px",
            fontSize: "12px",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          Limpiar filtros
        </button>
      )}
    </Card>
  );
}
