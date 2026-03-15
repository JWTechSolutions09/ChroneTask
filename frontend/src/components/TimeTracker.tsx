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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "8px" : "8px",
        padding: isMobile ? "8px" : "8px",
        backgroundColor: isRunning ? "rgba(0, 123, 255, 0.1)" : "var(--bg-secondary)",
        borderRadius: "8px",
        border: isRunning ? "1px solid #007bff" : "1px solid #dee2e6",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        margin: 0,
      }}
    >
      {error && (
        <div
          style={{
            fontSize: isMobile ? "12px" : "11px",
            color: "#dc3545",
            padding: isMobile ? "8px" : "4px",
            backgroundColor: "#fee",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: isMobile ? "8px" : "8px",
        flexWrap: isMobile ? "wrap" : "nowrap",
        width: "100%",
        minWidth: 0,
        margin: 0,
      }}>
        {isRunning ? (
          <>
            <div
              style={{
                width: isMobile ? "10px" : "8px",
                height: isMobile ? "10px" : "8px",
                borderRadius: "50%",
                backgroundColor: "#dc3545",
                animation: "pulse 2s infinite",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: isMobile ? "14px" : "12px",
                fontWeight: 600,
                color: "#007bff",
                fontFamily: "monospace",
                flex: isMobile ? "1 1 auto" : "0 0 auto",
              }}
            >
              {formatTime(elapsedSeconds)}
            </span>
            <button
              onClick={stopTimer}
              disabled={loading}
              style={{
                marginLeft: isMobile ? "0" : "auto",
                padding: isMobile ? "10px 14px" : "4px 8px",
                fontSize: isMobile ? "13px" : "11px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                minHeight: isMobile ? "40px" : "auto",
                width: isMobile ? "100%" : "auto",
                flex: isMobile ? "1 1 100%" : "0 0 auto",
                boxSizing: "border-box",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              {loading ? "..." : "⏹ Detener"}
            </button>
          </>
        ) : (
          <>
            <span style={{ 
              fontSize: isMobile ? "13px" : "11px", 
              color: "var(--text-secondary)",
              flex: isMobile ? "1 1 auto" : "0 0 auto",
            }}>
              ⏱️ {formatTotalTime(totalMinutes)}
            </span>
            <button
              onClick={startTimer}
              disabled={loading}
              style={{
                marginLeft: isMobile ? "0" : "auto",
                padding: isMobile ? "10px 14px" : "4px 8px",
                fontSize: isMobile ? "13px" : "11px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                minHeight: isMobile ? "40px" : "auto",
                width: isMobile ? "100%" : "auto",
                flex: isMobile ? "1 1 100%" : "0 0 auto",
                boxSizing: "border-box",
                whiteSpace: "nowrap",
                margin: 0,
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
