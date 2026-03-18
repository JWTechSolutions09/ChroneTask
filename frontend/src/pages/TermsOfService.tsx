import React from "react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(0, 123, 255, 0.16), transparent 60%), radial-gradient(900px 500px at 80% 30%, rgba(111, 66, 193, 0.14), transparent 55%), var(--bg-secondary)",
        color: "var(--text-primary)",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "18px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              padding: "10px 12px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ← Volver
          </button>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Inicio
            </button>
            <button
              onClick={() => navigate("/access")}
              style={{
                background: "var(--primary)",
                border: "1px solid color-mix(in srgb, var(--primary) 60%, transparent)",
                color: "white",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Acceder
            </button>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "22px",
            borderRadius: "16px",
            border: "1px solid var(--border-color)",
            background: "color-mix(in srgb, var(--bg-primary) 92%, transparent)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 900 }}>Términos y Condiciones de Servicio</h1>
          <p style={{ marginTop: "8px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Estos Términos regulan el uso de <strong>ChroneTask</strong> (la “Aplicación”), provista por <strong>JW TECH SOLUTIONS</strong>.
            Al acceder o utilizar la Aplicación, aceptas estos Términos.
          </p>

          <div style={{ marginTop: "18px", display: "grid", gap: "14px" }}>
            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>1. Uso del servicio</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Te otorgamos una licencia limitada, no exclusiva y revocable para usar la Aplicación conforme a estos Términos y a la ley aplicable.
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>2. Cuentas y seguridad</h2>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                <li>Eres responsable de la actividad realizada desde tu cuenta.</li>
                <li>Debes mantener tus credenciales seguras y notificarnos ante accesos no autorizados.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>3. Contenido del usuario</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Conservas la titularidad del contenido que creas (tareas, notas, comentarios, archivos). Nos concedes permisos necesarios para
                alojar, procesar y mostrar ese contenido con el fin de operar la Aplicación.
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>4. Conducta prohibida</h2>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                <li>Uso ilegal, fraudulento o que afecte la disponibilidad del servicio.</li>
                <li>Intentos de acceso no autorizado, scraping o ingeniería inversa fuera de lo permitido por ley.</li>
                <li>Publicación de contenido malicioso, ofensivo o que infrinja derechos de terceros.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>5. Disponibilidad y cambios</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Podemos modificar, suspender o descontinuar partes del servicio. Procuraremos minimizar impactos, pero no garantizamos disponibilidad
                ininterrumpida.
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>6. Limitación de responsabilidad</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                En la máxima medida permitida por la ley, JW TECH SOLUTIONS no será responsable por daños indirectos, incidentales o consecuentes
                derivados del uso o imposibilidad de uso del servicio.
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>7. Terminación</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Podemos suspender o terminar el acceso si se violan estos Términos o si es requerido por ley. También puedes dejar de usar el servicio
                en cualquier momento.
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>8. Contacto</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Para soporte o consultas:{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>support@jwtechsolutions.com</span>
                <span style={{ color: "var(--text-tertiary)" }}> (puedes cambiar este email por el oficial)</span>.
              </p>
            </section>

            <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-tertiary)" }}>
              Última actualización: {new Date().toLocaleDateString("es-ES")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

