import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/access.css";

export default function Access() {
  const navigate = useNavigate();

  useEffect(() => {
    // Forzar modo oscuro siempre
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
    
    // Scroll al inicio de la página cuando se monta
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="access-page dark" data-theme="dark">
      {/* Navigation Bar */}
      <nav className="access-nav">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate("/")}>
            <img src="/logolanding.png" alt="ChroneTask" />
            <span>ChroneTask</span>
          </div>
          <button
            className="btn-back"
            onClick={() => navigate("/")}
          >
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="access-hero">
        <div className="access-hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>
        <div className="access-hero-content">
          <div className="access-hero-main">
            <div className="access-logo-container">
              <img src="/logolanding.png" alt="ChroneTask Logo" className="access-logo" />
            </div>
            <h1 className="access-title">
              Bienvenido a tu plataforma de gestión
            </h1>
            <p className="access-subtitle">
              Accede a un entorno profesional diseñado para ayudarte a organizar proyectos, gestionar equipos y alcanzar resultados excepcionales.
            </p>
            <button className="access-cta-primary" onClick={() => navigate("/login")}>
              <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
            </button>
          </div>
          <div className="access-hero-image">
            <img src="/Accesimage.png" alt="ChroneTask Platform" className="access-feature-image" />
          </div>
        </div>
      </section>

      {/* Quick Benefits Section */}
      <section className="access-benefits">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Todo lo que necesitas en un solo lugar</h2>
            <p className="section-subtitle">
              Una plataforma completa para gestionar tu trabajo de forma eficiente
            </p>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">📋</div>
              <h3>Organización Clara</h3>
              <p>Mantén todos tus proyectos y tareas organizados de forma intuitiva. Encuentra lo que necesitas en segundos.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📊</div>
              <h3>Mejor Control</h3>
              <p>Visualiza el progreso de tus proyectos en tiempo real. Toma decisiones informadas con datos claros.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">👁️</div>
              <h3>Seguimiento Fácil</h3>
              <p>Monitorea el avance de cada tarea y proyecto. Nunca pierdas de vista lo importante.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⏱️</div>
              <h3>Ahorro de Tiempo</h3>
              <p>Automatiza procesos repetitivos y centraliza tu información. Trabaja más rápido y con menos esfuerzo.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🗂️</div>
              <h3>Centralización</h3>
              <p>Todo en un solo lugar: proyectos, equipos, comunicaciones y métricas. Sin cambiar entre múltiples herramientas.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <h3>Colaboración Eficiente</h3>
              <p>Trabaja junto a tu equipo de forma fluida. Comunicación clara y trabajo sincronizado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Do Section */}
      <section className="access-features">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Qué puedes hacer en la plataforma</h2>
            <p className="section-subtitle">
              Herramientas poderosas al alcance de tu mano
            </p>
          </div>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-item-icon">📁</div>
              <div className="feature-item-content">
                <h3>Gestionar Proyectos y Tareas</h3>
                <p>Crea proyectos, organiza tareas, establece prioridades y gestiona plazos. Todo desde una interfaz intuitiva y fácil de usar.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-item-icon">📊</div>
              <div className="feature-item-content">
                <h3>Visualizar Información Importante</h3>
                <p>Accede a dashboards claros con métricas clave, gráficos interactivos y reportes que te ayudan a entender el estado de tus proyectos.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-item-icon">📅</div>
              <div className="feature-item-content">
                <h3>Dar Seguimiento al Trabajo</h3>
                <p>Monitorea el progreso de cada proyecto, revisa el estado de las tareas y mantén el control total de tu flujo operativo.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-item-icon">⚙️</div>
              <div className="feature-item-content">
                <h3>Mantener el Control del Flujo</h3>
                <p>Gestiona dependencias entre tareas, configura alertas automáticas y asegúrate de que todo fluya según lo planeado.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-item-icon">🏠</div>
              <div className="feature-item-content">
                <h3>Acceder a Herramientas Clave</h3>
                <p>Todo desde un solo lugar: proyectos, calendarios, notas, analíticas y más. Sin necesidad de cambiar entre aplicaciones.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="access-security">
        <div className="section-container">
          <div className="security-content">
            <div className="security-visual">
              <div className="security-icon-large">🛡️</div>
            </div>
            <div className="security-text">
              <h2 className="section-title">Acceso Seguro y Confiable</h2>
              <p className="security-intro">
                Tu información está protegida en un entorno profesional diseñado para brindarte tranquilidad y confianza.
              </p>
              <div className="security-features">
                <div className="security-feature">
                  <span>🔒</span>
                  <span>Acceso seguro con autenticación protegida</span>
                </div>
                <div className="security-feature">
                  <span>✅</span>
                  <span>Entorno confiable y estable para tu trabajo</span>
                </div>
                <div className="security-feature">
                  <span>🔐</span>
                  <span>Información organizada y protegida</span>
                </div>
                <div className="security-feature">
                  <span>🛡️</span>
                  <span>Plataforma profesional y segura</span>
                </div>
                <div className="security-feature">
                  <span>✨</span>
                  <span>Experiencia estable y confiable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="access-cta">
        <div className="access-cta-background">
          <div className="cta-gradient"></div>
        </div>
        <div className="section-container">
          <div className="access-cta-content">
            <h2 className="cta-title">¿Listo para comenzar?</h2>
            <p className="cta-subtitle">
              Accede ahora y descubre cómo podemos ayudarte a gestionar tus proyectos de forma más eficiente
            </p>
            <button className="cta-primary-large" onClick={() => navigate("/login")}>
              <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
            </button>
            <div className="cta-footer">
              <p>¿No tienes cuenta? <a href="/register" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>Regístrate gratis</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="access-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <img src="/logolanding.png" alt="ChroneTask" />
            <span>ChroneTask</span>
          </div>
          <div className="footer-copyright">
            <p>© 2024 JW TECH SOLUTIONS. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
