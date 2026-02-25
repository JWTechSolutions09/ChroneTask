import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

type QuickSearchProps = {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
};

export default function QuickSearch({ isOpen, onClose, organizationId }: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Toggle search
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 2000,
        paddingTop: "100px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          width: "90%",
          maxWidth: "600px",
          padding: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar proyectos, tareas, miembros... (Presiona ESC para cerrar)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
          style={{
            fontSize: "18px",
            padding: "16px",
            marginBottom: "16px",
          }}
        />
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          Presiona Ctrl+K o Cmd+K para abrir esta búsqueda rápida
        </div>
      </div>
    </div>
  );
}
