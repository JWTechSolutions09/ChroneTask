import React from "react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
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
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 900 }}>Política de Privacidad</h1>
          <p style={{ marginTop: "8px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Esta Política de Privacidad describe cómo <strong>JW TECH SOLUTIONS</strong> (“nosotros”) recopila, utiliza y protege la información
            cuando utilizas <strong>ChroneTask</strong> (la “Aplicación”).
          </p>

          <div style={{ marginTop: "18px", display: "grid", gap: "14px" }}>
            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>1. Información que recopilamos</h2>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                <li><strong>Datos de cuenta</strong>: nombre, correo electrónico y foto/URL de avatar (si aplica).</li>
                <li><strong>Datos de uso</strong>: actividad dentro de la app (p. ej., creación/edición de proyectos, tareas, notas, eventos).</li>
                <li><strong>Contenido</strong>: proyectos, tareas, comentarios, notas, archivos o enlaces que el usuario ingrese voluntariamente.</li>
                <li><strong>Datos técnicos</strong>: información mínima necesaria para operar la app (p. ej., IP, navegador, timestamps de acceso).</li>
              </ul>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>2. Cómo usamos tu información</h2>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                <li>Proveer y mantener la Aplicación (autenticación, sesiones, seguridad).</li>
                <li>Operar funcionalidades (tableros, time tracking, invitaciones, notificaciones, reportes).</li>
                <li>Mejorar desempeño y experiencia (errores, métricas internas).</li>
                <li>Soporte y comunicación operativa relacionada al servicio.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>3. Compartición de datos</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                No vendemos tus datos. Podemos compartir información solo cuando sea necesario para operar el servicio (por ejemplo,
                proveedores de infraestructura/autenticación) o por requerimiento legal.
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>4. Seguridad</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Implementamos medidas razonables para proteger la información. Sin embargo, ningún sistema es 100% infalible. Recomendamos
                usar contraseñas robustas y mantener tus credenciales seguras.
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>5. Retención y eliminación</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Conservamos la información mientras sea necesaria para proveer el servicio o cumplir obligaciones legales. Puedes solicitar
                eliminación de tu cuenta y/o datos (según aplique).
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>6. Tus derechos</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Dependiendo de tu jurisdicción, puedes tener derechos de acceso, rectificación y eliminación. Para solicitudes, contáctanos.
              </p>
            </section>

            <section>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>7. Contacto</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Responsable: <strong>JW TECH SOLUTIONS</strong>. Para asuntos de privacidad, escribe a:{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>jwtechdr@gmail.com</span>
                <span style={{ color: "var(--text-tertiary)" }}> (Estamos para servirte)</span>.
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

