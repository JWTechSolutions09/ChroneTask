import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { http } from "../api/http";
import { setToken, isAuthed } from "../auth/token";
import { useToast } from "../contexts/ToastContext";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Si ya está autenticado, redirigir a /org-select
  useEffect(() => {
    if (isAuthed()) {
      nav("/org-select", { replace: true });
    }
  }, [nav]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // Validaciones básicas
    if (!email.trim()) {
      setErr("El email es requerido");
      return;
    }

    if (!password.trim()) {
      setErr("La contraseña es requerida");
      return;
    }

    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErr("El email no es válido");
      return;
    }

    setLoading(true);
    try {
      const res = await http.post("/api/auth/login", { email, password });

      const token = res.data?.token;
      if (!token) {
        throw new Error("No se recibió token en la respuesta");
      }

      setToken(token);
      showToast("¡Bienvenido de nuevo!", "success");
      nav("/orgs", { replace: true });
    } catch (ex: any) {
      // Manejo mejorado de errores
      let errorMessage = "Error al iniciar sesión";
      if (ex.response) {
        // Error del servidor
        errorMessage = ex.response.data?.message || ex.response.data?.error || errorMessage;
      } else if (ex.request) {
        // Error de red
        errorMessage = "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
      } else {
        // Otro error
        errorMessage = ex.message || "Error inesperado";
      }
      setErr(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa",
        padding: "20px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "40px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "8px", color: "#212529", fontWeight: 700 }}>
            ChroneTask
          </h1>
          <p style={{ color: "#6c757d", fontSize: "16px" }}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={onLogin} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#495057",
              }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="input"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#495057",
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "8px" }}
          >
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </button>

          {err && <div className="alert alert-error">{err}</div>}

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <span style={{ color: "#6c757d", fontSize: "14px" }}>¿No tienes cuenta? </span>
            <Link
              to="/register"
              style={{
                color: "#007bff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Regístrate aquí
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
