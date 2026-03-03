import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserUsageType } from "../hooks/useUserUsageType";
import { isAuthed } from "../auth/token";

/**
 * Componente helper para redirigir usuarios autenticados según su tipo de uso
 */
export function RedirectHelper() {
  const navigate = useNavigate();
  const { usageType, loading } = useUserUsageType();

  useEffect(() => {
    if (!isAuthed() || loading) return;

    // Redirigir según el tipo de uso
    switch (usageType) {
      case "personal":
        navigate("/personal/projects", { replace: true });
        break;
      case "team":
        navigate("/teams", { replace: true });
        break;
      case "business":
      default:
        navigate("/org-select", { replace: true });
        break;
    }
  }, [usageType, loading, navigate]);

  return null;
}
