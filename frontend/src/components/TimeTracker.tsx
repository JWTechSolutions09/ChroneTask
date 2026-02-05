import React, { useState, useEffect, useCallback } from "react";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";

type TimeTrackerProps = {
  taskId: string;
  projectId: string;
  totalMinutes: number;
  onTimeUpdate: () => void;
};

export default function TimeTracker({
  taskId,
  projectId,
  totalMinutes,
  onTimeUpdate,
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay un timer activo al cargar
    if (projectId && taskId) {
      checkActiveTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, taskId]); // Solo dependemos de los IDs

  useEffect(() => {
    // Si hay un timer activo, iniciar el contador local
    if (isRunning) {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const checkActiveTimer = useCallback(async () => {
    if (!projectId || !taskId) return;
    try {
      const res = await http.get(`/api/projects/${projectId}/tasks/${taskId}/time`);
      const entries = res.data || [];
      const activeEntry = entries.find(
        (e: any) => !e.endedAt && !e.isManual
      );
      if (activeEntry) {
        setIsRunning(true);
        setActiveTimerId(activeEntry.id);
        const startTime = new Date(activeEntry.startedAt).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      }
    } catch (err: any) {
      console.error("Error verificando timer activo:", err);
      setError(err?.response?.data?.message ?? "Error al verificar timer");
    }
  }, [projectId, taskId]);

  const startTimer = async () => {
    setLoading(true);
    setError(null);
    try {
      await http.post(`/api/projects/${projectId}/tasks/${taskId}/time/start`);
      setIsRunning(true);
      setElapsedSeconds(0);
      onTimeUpdate();
      showToast("Timer iniciado", "success");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? "Error al iniciar timer";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    setLoading(true);
    setError(null);
    try {
      await http.post(`/api/projects/${projectId}/tasks/${taskId}/time/stop`);
      setIsRunning(false);
      setElapsedSeconds(0);
      setActiveTimerId(null);
      onTimeUpdate();
      showToast("Timer detenido", "info");
    } catch (ex: any) {
      const errorMsg = ex?.response?.data?.message ?? "Error al detener timer";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTotalTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "8px",
        backgroundColor: isRunning ? "#e7f3ff" : "#f8f9fa",
        borderRadius: "6px",
        border: isRunning ? "1px solid #007bff" : "1px solid #dee2e6",
      }}
    >
      {error && (
        <div
          style={{
            fontSize: "11px",
            color: "#dc3545",
            padding: "4px",
            backgroundColor: "#fee",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {isRunning ? (
          <>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#dc3545",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#007bff",
                fontFamily: "monospace",
              }}
            >
              {formatTime(elapsedSeconds)}
            </span>
            <button
              onClick={stopTimer}
              disabled={loading}
              style={{
                marginLeft: "auto",
                padding: "4px 8px",
                fontSize: "11px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "..." : "⏹ Detener"}
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: "11px", color: "#6c757d" }}>
              ⏱️ {formatTotalTime(totalMinutes)}
            </span>
            <button
              onClick={startTimer}
              disabled={loading}
              style={{
                marginLeft: "auto",
                padding: "4px 8px",
                fontSize: "11px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "..." : "▶ Iniciar"}
            </button>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}
