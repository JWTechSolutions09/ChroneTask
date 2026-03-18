import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSupabase, isSupabaseConfigured } from "../api/supabase";
import { http } from "../api/http";
import { setToken } from "../auth/token";
import { useToast } from "../contexts/ToastContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [params] = useSearchParams();

  React.useEffect(() => {
    const run = async () => {
      try {
        if (!isSupabaseConfigured()) {
          showToast("Supabase no está configurado en este deploy. Revisa variables de entorno.", "error");
          navigate("/login", { replace: true });
          return;
        }

        const supabase = getSupabase();
        if (!supabase) {
          showToast("Supabase no está disponible. Revisa la configuración.", "error");
          navigate("/login", { replace: true });
          return;
        }

        // If Supabase sent an error, surface it.
        const errorDesc = params.get("error_description") || params.get("error");
        if (errorDesc) {
          showToast(decodeURIComponent(errorDesc), "error");
          navigate("/login", { replace: true });
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          showToast("Error obteniendo sesión de Google", "error");
          navigate("/login", { replace: true });
          return;
        }

        const accessToken = data.session?.access_token;
        if (!accessToken) {
          showToast("No se recibió sesión. Intenta nuevamente.", "error");
          navigate("/login", { replace: true });
          return;
        }

        // Exchange Supabase token for ChroneTask token
        const res = await http.post("/api/auth/supabase", { accessToken });
        if (res.data?.token) {
          setToken(res.data.token);
          showToast("Inicio de sesión exitoso", "success");
          navigate("/org-select", { replace: true });
          return;
        }

        showToast("No se pudo iniciar sesión. Token no recibido.", "error");
        navigate("/login", { replace: true });
      } catch (ex: any) {
        const msg = ex?.response?.data?.message ?? ex?.message ?? "Error procesando inicio de sesión";
        showToast(msg, "error");
        navigate("/login", { replace: true });
      }
    };

    run();
  }, [navigate, params, showToast]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div>
        <div style={{ fontSize: "42px", marginBottom: "12px" }}>🔐</div>
        <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>Procesando inicio de sesión...</div>
        <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Un momento por favor</div>
      </div>
    </div>
  );
}

