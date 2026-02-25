import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import { setToken, isAuthed } from "../auth/token";
import { useToast } from "../contexts/ToastContext";
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

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthed()) {
      navigate("/org-select", { replace: true });
    }
  }, [navigate]);

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
        navigate("/org-select", { replace: true });
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
        navigate("/org-select", { replace: true });
      } else {
        setErr("Token no recibido del servidor");
        showToast("Registro exitoso, pero no se pudo iniciar sesión automáticamente", "warning");
      }
    } catch (ex: any) {
      const errorMsg =
        ex?.response?.data?.message ?? ex.message ?? "Error al registrarse";
      setErr(errorMsg);
      showToast(errorMsg, "error");
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
      
      // Verificar si Google está disponible
      if (!window.google) {
        showToast("Google Sign-In no está disponible. Por favor, usa email y contraseña.", "info");
        setLoading(false);
        return;
      }

      // Usar Google Identity Services
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        callback: async (response: any) => {
          try {
            // Decodificar el token JWT de Google
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            // Enviar el token al backend
            const res = await http.post("/api/auth/google", {
              idToken: response.credential,
              email: payload.email,
              fullName: payload.name,
              profilePictureUrl: payload.picture,
            });

            if (res.data?.token) {
              setToken(res.data.token);
              showToast("Inicio de sesión con Google exitoso", "success");
              navigate("/org-select", { replace: true });
            }
          } catch (ex: any) {
            const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error al iniciar sesión con Google";
            setErr(errorMsg);
            showToast(errorMsg, "error");
          } finally {
            setLoading(false);
          }
        },
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Si no se muestra el prompt, usar popup manual
          window.google?.accounts.oauth2.initTokenClient({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
            scope: "email profile",
            callback: async (tokenResponse: any) => {
              try {
                const userInfo = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`);
                const userData = await userInfo.json();
                
                const res = await http.post("/api/auth/google", {
                  idToken: tokenResponse.access_token,
                  email: userData.email,
                  fullName: userData.name,
                  profilePictureUrl: userData.picture,
                });

                if (res.data?.token) {
                  setToken(res.data.token);
                  showToast("Inicio de sesión con Google exitoso", "success");
                  navigate("/org-select", { replace: true });
                }
              } catch (ex: any) {
                const errorMsg = ex?.response?.data?.message ?? ex.message ?? "Error al iniciar sesión con Google";
                setErr(errorMsg);
                showToast(errorMsg, "error");
              } finally {
                setLoading(false);
              }
            },
          }).requestAccessToken();
        }
      });
    } catch (error: any) {
      showToast("Error al iniciar sesión con Google. Usa email y contraseña.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
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
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
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
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
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
              <img 
                src="/logo.png" 
                alt="ChroneTask Logo" 
                className="auth-logo"
                style={{
                  width: "80px",
                  height: "80px",
                  marginBottom: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              />
              <h1>Welcome Back!</h1>
              <p>
                Stay connected by logging in with your credentials and continue your experience
              </p>
              <button type="button" className="transparent-btn" onClick={toggleMode}>
                Sign In
              </button>
            </div>
            <div className="panel-content panel-content-right">
              <img 
                src="/logo.png" 
                alt="ChroneTask Logo" 
                className="auth-logo"
                style={{
                  width: "80px",
                  height: "80px",
                  marginBottom: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              />
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
