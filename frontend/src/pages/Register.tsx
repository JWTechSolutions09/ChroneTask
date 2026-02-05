import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { http } from "../api/http";
import { setToken, isAuthed } from "../auth/token";
import { useToast } from "../contexts/ToastContext";

export default function Register() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Si ya está autenticado, redirigir a /orgs
  useEffect(() => {
    if (isAuthed()) {
      nav("/org-select", { replace: true });
    }
  }, [nav]);

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // Validaciones básicas
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

    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErr("El email no es válido");
      return;
    }

    setLoading(true);
    try {
      await http.post("/api/auth/register", {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      // Después de registrarse, hacer login automático
      const loginRes = await http.post("/api/auth/login", { email, password });
      const token = loginRes.data?.token;
      
      if (!token) {
        throw new Error("No se recibió token en la respuesta");
      }

      setToken(token);
      nav("/orgs", { replace: true });
    } catch (ex: any) {
      // Manejo mejorado de errores
      if (ex.response) {
        // Error del servidor
        const message = ex.response.data?.message || ex.response.data?.error || "Error al registrarse";
        setErr(message);
      } else if (ex.request) {
        // Error de red
        setErr("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
      } else {
        // Otro error
        setErr(ex.message || "Error inesperado");
      }
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
          <p style={{ color: "#6c757d", fontSize: "16px" }}>Crea una cuenta para comenzar</p>
        </div>

        <form onSubmit={onRegister} style={{ display: "grid", gap: "16px" }}>
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
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
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
              Confirmar contraseña
            </label>
            <input
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
              className="input"
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p style={{ color: "#dc3545", fontSize: "12px", marginTop: "4px" }}>
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !fullName.trim() ||
              !email.trim() ||
              !password.trim() ||
              !confirmPassword.trim() ||
              password !== confirmPassword
            }
            className="btn btn-success"
            style={{ width: "100%", marginTop: "8px" }}
          >
            {loading ? "Registrando..." : "Crear Cuenta"}
          </button>

          {err && <div className="alert alert-error">{err}</div>}

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <span style={{ color: "#6c757d", fontSize: "14px" }}>¿Ya tienes cuenta? </span>
            <Link
              to="/login"
              style={{
                color: "#007bff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
