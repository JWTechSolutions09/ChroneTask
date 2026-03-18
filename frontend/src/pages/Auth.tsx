import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import { setToken, isAuthed } from "../auth/token";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";
import { useUserUsageType } from "../hooks/useUserUsageType";
import { getSupabase, isSupabaseConfigured } from "../api/supabase";
import "../styles/auth.css";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [isRegisterMode, setIsRegisterMode] = useState(location.pathname === "/register");

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const { theme } = useTheme();

  const { usageType, loading: loadingUsageType } = useUserUsageType();

  // Si ya está autenticado, redirigir según el tipo de uso
  useEffect(() => {
    if (isAuthed() && !loadingUsageType) {
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
    }
  }, [navigate, usageType, loadingUsageType]);

  // Obtener token de invitación de la URL
  useEffect(() => {
    const invite = searchParams.get("invite");
    if (invite) {
      setInvitationToken(invite);
    }
  }, [searchParams]);

  // Actualizar modo cuando cambie la ruta
  useEffect(() => {
    setIsRegisterMode(location.pathname === "/register");
  }, [location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!email.trim()) {
      setErr("El email es requerido");
      return;
    }

    if (!password.trim()) {
      setErr("La contraseña es requerida");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErr("Email inválido");
      return;
    }

    setLoading(true);
    try {
      const res = await http.post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (res.data?.token) {
        setToken(res.data.token);
        showToast("Inicio de sesión exitoso", "success");
        // Redirigir según el tipo de uso (se cargará después del login)
        // Por ahora redirigir a onboarding si no tiene tipo, o según el tipo
        setTimeout(() => {
          // El hook useUserUsageType se actualizará después del login
          // Por ahora redirigir a org-select como default
          navigate("/org-select", { replace: true });
        }, 100);
      } else {
        setErr("Token no recibido del servidor");
      }
    } catch (ex: any) {
      const errorMsg =
        ex?.response?.data?.message ?? ex.message ?? "Error al iniciar sesión";
      setErr(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!fullName.trim()) {
      setErr("El nombre completo es requerido");
      return;
    }

    if (!email.trim()) {
      setErr("El email es requerido");
      return;
    }

    if (!password.trim()) {
      setErr("La contraseña es requerida");
      return;
    }

    if (password.length < 6) {
      setErr("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Las contraseñas no coinciden");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErr("Email inválido");
      return;
    }

    setLoading(true);
    try {
      await http.post("/api/auth/register", {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        invitationToken: invitationToken || null,
      });

      // Después de registrarse, hacer login automático
      const loginRes = await http.post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (loginRes.data?.token) {
        setToken(loginRes.data.token);
        showToast("Registro exitoso. ¡Bienvenido!", "success");
        // Redirigir a onboarding para nuevos usuarios
        // Pequeño delay para asegurar que el token se guarde
        setTimeout(() => {
          navigate("/onboarding", { replace: true });
        }, 100);
      } else {
        setErr("Token no recibido del servidor");
        showToast("Registro exitoso, pero no se pudo iniciar sesión automáticamente", "warning");
      }
    } catch (ex: any) {
      let errorMsg = "Error al registrarse";

      // Manejar error 409 (Conflict) - Email ya registrado
      if (ex?.response?.status === 409) {
        errorMsg = "Este email ya está registrado. Por favor, inicia sesión o usa otro email.";
        setErr(errorMsg);
        showToast(errorMsg, "error");
        // Sugerir cambiar a modo login
        setTimeout(() => {
          if (window.confirm("¿Deseas iniciar sesión en su lugar?")) {
            setIsRegisterMode(false);
            setEmail(email.trim().toLowerCase());
          }
        }, 1000);
      } else {
        // Otros errores
        errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error al registrarse";
        setErr(errorMsg);
        showToast(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErr(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErr(null);

      if (!isSupabaseConfigured()) {
        const msg =
          "Google (Supabase) no está configurado. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY y vuelve a desplegar.";
        setErr(msg);
        showToast(msg, "error");
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      if (!supabase) {
        const msg = "Supabase no está disponible. Revisa la configuración.";
        setErr(msg);
        showToast(msg, "error");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const msg = error?.message ?? "No se pudo iniciar sesión con Google";
        setErr(msg);
        showToast(msg, "error");
        setLoading(false);
      }
    } catch (error: any) {
      const msg = error?.message ?? "Error al iniciar sesión con Google. Usa email y contraseña.";
      showToast(msg, "error");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper" data-theme={theme}>
      <div className="jw-tech-signature">
        <span>JW TECH SOLUTIONS</span>
      </div>
      <div className={`auth-wrapper ${isRegisterMode ? "panel-active" : ""}`} id="authWrapper">
        {/* Register Form */}
        <div className="auth-form-box register-form-box">
          <form onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <div className="social-links">
              <a href="#" aria-label="Google" onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }} className="google-btn">
                <i className="fab fa-google"></i>
              </a>
            </div>
            <span>or use your email for registration</span>
            {err && <div className="auth-error">{err}</div>}
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
            <div className="mobile-switch">
              <p>Already have an account?</p>
              <button type="button" onClick={toggleMode} className="mobile-switch-btn">
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* Login Form */}
        <div className="auth-form-box login-form-box">
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <div className="social-links">
              <a href="#" aria-label="Google" onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }} className="google-btn">
                <i className="fab fa-google"></i>
              </a>
            </div>
            <span>or use your account</span>
            {err && <div className="auth-error">{err}</div>}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <a href="#" onClick={(e) => e.preventDefault()}>
              Forgot your password?
            </a>
            <button type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
            <div className="mobile-switch">
              <p>Don't have an account?</p>
              <button type="button" onClick={toggleMode} className="mobile-switch-btn">
                Sign Up
              </button>
            </div>
          </form>
        </div>

        {/* Slide Panel */}
        <div className="slide-panel-wrapper">
          <div className="slide-panel">
            <div className="panel-content panel-content-left">
              <div
                className="auth-logo-container"
                style={{
                  width: "160px",
                  height: "160px",
                  marginBottom: "24px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                  backdropFilter: "blur(10px)",
                  overflow: "hidden",
                  maxWidth: "100%",
                  margin: "0 auto 24px auto",
                }}
              >
                <img
                  src="/logolanding.png"
                  alt="ChroneTask Logo"
                  className="auth-logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    filter: "brightness(1.1)",
                  }}
                />
              </div>
              <h1>Welcome Back!</h1>
              <p>
                Stay connected by logging in with your credentials and continue your experience
              </p>
              <button type="button" className="transparent-btn" onClick={toggleMode}>
                Sign In
              </button>
            </div>
            <div className="panel-content panel-content-right">
              <div
                className="auth-logo-container"
                style={{
                  width: "160px",
                  height: "160px",
                  marginBottom: "24px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                  backdropFilter: "blur(10px)",
                  overflow: "hidden",
                  maxWidth: "100%",
                  margin: "0 auto 24px auto",
                }}
              >
                <img
                  src="/logolanding.png"
                  alt="ChroneTask Logo"
                  className="auth-logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    filter: "brightness(1.1)",
                  }}
                />
              </div>
              <h1>Hey There!</h1>
              <p>Begin your amazing journey by creating an account with us today</p>
              <button type="button" className="transparent-btn" onClick={toggleMode}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
