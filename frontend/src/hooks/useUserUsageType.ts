import { useState, useEffect } from "react";
import { http } from "../api/http";

export type UsageType = "personal" | "team" | "business" | null;

export function useUserUsageType() {
  const [usageType, setUsageType] = useState<UsageType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsageType = async () => {
      try {
        const res = await http.get("/api/users/me");
        // El backend devuelve UsageType en el perfil (puede ser camelCase o PascalCase dependiendo de la configuración)
        setUsageType(res.data?.usageType || res.data?.UsageType || null);
      } catch (error) {
        console.error("Error loading usage type:", error);
        setUsageType(null);
      } finally {
        setLoading(false);
      }
    };

    loadUsageType();
  }, []);

  return { usageType, loading };
}
