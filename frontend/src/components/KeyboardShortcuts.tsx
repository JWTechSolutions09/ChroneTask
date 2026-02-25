import React, { useEffect } from "react";

type KeyboardShortcutsProps = {
  onNewTask?: () => void;
  onSearch?: () => void;
  onSave?: () => void;
};

export default function KeyboardShortcuts({ onNewTask, onSearch, onSave }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K para búsqueda
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onSearch?.();
      }
      
      // Ctrl/Cmd + N para nueva tarea
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        onNewTask?.();
      }
      
      // Ctrl/Cmd + S para guardar
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewTask, onSearch, onSave]);

  return null;
}
