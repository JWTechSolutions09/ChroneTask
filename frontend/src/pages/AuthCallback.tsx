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
  const [step, setStep] = React.useState<
    "init" | "exchange" | "session" | "backend" | "profile" | "done"
  >("init");
  const [subtitle, setSubtitle] = React.useState("Conectando con Google…");

  React.useEffect(() => {
    const run = async () => {
      try {
        setStep("init");
        setSubtitle("Conectando con Google…");

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
          setStep("exchange");
          setSubtitle("Validando credenciales…");
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
        setStep("session");
        setSubtitle("Creando sesión segura…");
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
        setStep("backend");
        setSubtitle("Entrando a ChroneTask…");
        const res = await http.post("/api/auth/supabase", { accessToken });
        if (res.data?.token) {
          setToken(res.data.token);
          showToast("Inicio de sesión exitoso", "success");

          // Decide where to go next:
          // - If user has no usageType yet => onboarding
          // - Otherwise => route by usageType
          try {
            setStep("profile");
            setSubtitle("Cargando tu perfil…");
            const meRes = await http.get("/api/users/me");
            const usageType = (meRes.data?.usageType || meRes.data?.UsageType || null) as
              | "personal"
              | "team"
              | "business"
              | null;

            if (!usageType) {
              setStep("done");
              navigate("/onboarding", { replace: true });
              return;
            }

            if (usageType === "personal") {
              setStep("done");
              navigate("/personal/projects", { replace: true });
              return;
            }

            if (usageType === "team") {
              setStep("done");
              navigate("/teams", { replace: true });
              return;
            }

            setStep("done");
            navigate("/org-select", { replace: true });
            return;
          } catch {
            // Fallback: if /me fails, send to onboarding as safest first-time flow
            setStep("done");
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

  const steps = [
    { key: "exchange", label: "Validación" },
    { key: "session", label: "Sesión" },
    { key: "backend", label: "Acceso" },
    { key: "profile", label: "Perfil" },
  ] as const;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(0, 123, 255, 0.18), transparent 60%), radial-gradient(900px 500px at 80% 30%, rgba(111, 66, 193, 0.18), transparent 55%), var(--bg-secondary)",
        color: "var(--text-primary)",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "520px",
          width: "100%",
          padding: "24px",
          borderRadius: "18px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
          border: "1px solid var(--border-color)",
          background: "color-mix(in srgb, var(--bg-primary) 92%, transparent)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            margin: "0 auto 14px auto",
            display: "grid",
            placeItems: "center",
            background: "color-mix(in srgb, var(--primary) 16%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary) 28%, transparent)",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "3px solid color-mix(in srgb, var(--primary) 25%, transparent)",
              borderTopColor: "var(--primary)",
              animation: "authSpin 0.9s linear infinite",
            }}
          />
        </div>

        <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>
          Iniciando sesión…
        </div>
        <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          {subtitle}
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          {steps.map((s) => {
            const order = ["init", "exchange", "session", "backend", "profile", "done"] as const;
            const currentIdx = order.indexOf(step);
            const sIdx = order.indexOf(s.key as any);
            const active = currentIdx >= sIdx;
            return (
              <div
                key={s.key}
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "1px solid var(--border-color)",
                  background: active ? "color-mix(in srgb, var(--primary) 18%, transparent)" : "var(--bg-secondary)",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: active ? "var(--primary)" : "var(--border-color)",
                  }}
                />
                {s.label}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "18px", fontSize: "12px", color: "var(--text-tertiary)" }}>
          Si esto tarda más de 10 segundos,{" "}
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: "var(--primary)",
              cursor: "pointer",
              fontWeight: 700,
              textDecoration: "underline",
            }}
          >
            vuelve al login
          </button>
          .
        </div>

        <style>{`
          @keyframes authSpin { 
            from { transform: rotate(0deg); } 
            to { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    </div>
  );
}

