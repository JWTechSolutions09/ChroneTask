import { useState, useEffect } from "react";
import { http } from "../api/http";
import { isAuthed } from "../auth/token";

export type UsageType = "personal" | "team" | "business" | null;

export function useUserUsageType() {
  const [usageType, setUsageType] = useState<UsageType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsageType = async () => {
      try {
        // Evitar llamadas 401 cuando el usuario no está autenticado
        if (!isAuthed()) {
          setUsageType(null);
          return;
        }
        const res = await http.get("/api/users/me");
        // El backend devuelve UsageType en el perfil (puede ser camelCase o PascalCase dependiendo de la configuración)
        setUsageType(res.data?.usageType || res.data?.UsageType || null);
      } catch (error: any) {
        // Si es un error 401, el interceptor ya maneja la redirección
        // No hacer nada más aquí para evitar loops
        if (error?.response?.status !== 401) {
          console.error("Error loading usage type:", error);
        }
        setUsageType(null);
      } finally {
        setLoading(false);
      }
    };

    loadUsageType();
  }, []);

  return { usageType, loading };
}
