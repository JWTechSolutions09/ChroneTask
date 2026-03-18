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

        // Supabase OAuth (PKCE) returns ?code=... and requires exchanging it for a session.
        const code = params.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            showToast("Error procesando callback de Google (exchange).", "error");
            navigate("/login", { replace: true });
            return;
          }

          // Clean URL (remove code) to avoid re-exchange on refresh.
          try {
            window.history.replaceState({}, document.title, "/auth/callback");
          } catch {
            // ignore
          }
        }

        // Read session (sometimes needs a brief delay after exchange in some browsers)
        const readSession = async () => {
          const { data, error } = await supabase.auth.getSession();
          return { data, error };
        };

        let { data, error } = await readSession();

        // Retry once if session is not yet available
        if (!data.session && !error) {
          await new Promise((r) => setTimeout(r, 250));
          ({ data, error } = await readSession());
        }

        // If still missing, attempt refresh (handles some edge cases)
        if (!data.session && !error) {
          try {
            await supabase.auth.refreshSession();
            ({ data, error } = await readSession());
          } catch {
            // ignore
          }
        }

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

          // Decide where to go next:
          // - If user has no usageType yet => onboarding
          // - Otherwise => route by usageType
          try {
            const meRes = await http.get("/api/users/me");
            const usageType = (meRes.data?.usageType || meRes.data?.UsageType || null) as
              | "personal"
              | "team"
              | "business"
              | null;

            if (!usageType) {
              navigate("/onboarding", { replace: true });
              return;
            }

            if (usageType === "personal") {
              navigate("/personal/projects", { replace: true });
              return;
            }

            if (usageType === "team") {
              navigate("/teams", { replace: true });
              return;
            }

            navigate("/org-select", { replace: true });
            return;
          } catch {
            // Fallback: if /me fails, send to onboarding as safest first-time flow
            navigate("/onboarding", { replace: true });
            return;
          }
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

