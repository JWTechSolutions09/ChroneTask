import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Determinar sección activa
      const sections = [heroRef, featuresRef, techRef, benefitsRef];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      sections.forEach((ref, index) => {
        if (ref.current) {
          const { offsetTop, offsetHeight } = ref.current;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Ejecutar una vez al montar

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Animaciones de scroll para elementos con Intersection Observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll(".feature-card, .tech-card, .benefit-item");
    elements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`landing-page ${theme}`} data-theme={theme}>
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <img src="/logolanding.png" alt="ChroneTask" />
            <span>ChroneTask</span>
          </div>
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={mobileMenuOpen ? "open" : ""}></span>
            <span className={mobileMenuOpen ? "open" : ""}></span>
            <span className={mobileMenuOpen ? "open" : ""}></span>
          </button>
          <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <button onClick={() => { scrollToSection(heroRef); setMobileMenuOpen(false); }}>Inicio</button>
            <button onClick={() => { scrollToSection(featuresRef); setMobileMenuOpen(false); }}>Características</button>
            <button onClick={() => { scrollToSection(techRef); setMobileMenuOpen(false); }}>Tecnologías</button>
            <button onClick={() => { scrollToSection(benefitsRef); setMobileMenuOpen(false); }}>Ventajas</button>
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "dark" ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>
            <button className="btn-login" onClick={() => navigate("/login")}>
              <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-logo-container">
            <img src="/logolanding.png" alt="ChroneTask Logo" className="hero-logo" />
          </div>
          <h1 className="hero-title">
            <span className="title-line">Gestiona tus proyectos</span>
            <span className="title-line highlight">con inteligencia</span>
          </h1>
          <p className="hero-subtitle">
            La plataforma todo-en-uno para equipos que buscan eficiencia, colaboración y resultados excepcionales
          </p>
          <div className="hero-cta">
            <button className="cta-primary" onClick={() => navigate("/login")}>
              <i className="fas fa-rocket"></i> Comenzar Ahora
            </button>
            <button className="cta-secondary" onClick={() => scrollToSection(featuresRef)}>
              <i className="fas fa-book-open"></i> Conocer Más
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Eficiencia</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Disponible</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Proyectos</div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <div className="mouse"></div>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Características Principales</h2>
            <p className="section-subtitle">
              Todo lo que necesitas para gestionar proyectos exitosos
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card" data-aos="fade-up">
              <div className="feature-icon"><i className="fas fa-chart-line"></i></div>
              <h3>Dashboard Inteligente</h3>
              <p>
                Visualiza el estado de todos tus proyectos en un solo lugar.
                Métricas en tiempo real y análisis profundo de rendimiento.
              </p>
            </div>
            <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
              <div className="feature-icon"><i className="fas fa-users"></i></div>
              <h3>Colaboración en Equipo</h3>
              <p>
                Trabaja junto a tu equipo con comentarios, notificaciones en tiempo real
                y gestión de miembros por proyecto.
              </p>
            </div>
            <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
              <div className="feature-icon"><i className="fas fa-calendar-alt"></i></div>
              <h3>Cronograma Visual</h3>
              <p>
                Planifica y visualiza tus proyectos con vistas tipo Gantt.
                Arrastra tareas, gestiona dependencias y cumple plazos.
              </p>
            </div>
            <div className="feature-card" data-aos="fade-up" data-aos-delay="300">
              <div className="feature-icon"><i className="fas fa-bell"></i></div>
              <h3>Sistema de Notificaciones</h3>
              <p>
                Mantente al día con notificaciones inteligentes sobre cambios,
                comentarios y recordatorios importantes.
              </p>
            </div>
            <div className="feature-card" data-aos="fade-up" data-aos-delay="400">
              <div className="feature-icon"><i className="fas fa-chart-bar"></i></div>
              <h3>Analíticas Avanzadas</h3>
              <p>
                Analiza el rendimiento de tu equipo con métricas detalladas,
                gráficos interactivos y reportes personalizables.
              </p>
            </div>
            <div className="feature-card" data-aos="fade-up" data-aos-delay="500">
              <div className="feature-icon"><i className="fas fa-bolt"></i></div>
              <h3>SLA y Seguimiento</h3>
              <p>
                Configura SLAs por proyecto y recibe alertas cuando se acerquen
                los plazos límite. Cumple siempre a tiempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section ref={techRef} className="tech-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Tecnologías de Vanguardia</h2>
            <p className="section-subtitle">
              Construido con las mejores herramientas modernas
            </p>
          </div>
          <div className="tech-grid">
            <div className="tech-card">
              <div className="tech-icon"><i className="fab fa-react"></i></div>
              <h3>React</h3>
              <p>Interfaz moderna y reactiva</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon"><i className="fab fa-js-square"></i></div>
              <h3>TypeScript</h3>
              <p>Código robusto y escalable</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon"><i className="fas fa-server"></i></div>
              <h3>ASP.NET Core</h3>
              <p>Backend de alto rendimiento</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon"><i className="fas fa-database"></i></div>
              <h3>Entity Framework</h3>
              <p>Gestión eficiente de datos</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon"><i className="fas fa-lock"></i></div>
              <h3>Autenticación Segura</h3>
              <p>JWT y OAuth integrados</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon"><i className="fas fa-cloud"></i></div>
              <h3>Cloud Ready</h3>
              <p>Despliegue en la nube</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="benefits-section">
        <div className="section-container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2 className="section-title">¿Por qué elegir ChroneTask?</h2>
              <div className="benefit-list">
                <div className="benefit-item">
                  <div className="benefit-icon"><i className="fas fa-bullseye"></i></div>
                  <div>
                    <h3>Gestión Centralizada</h3>
                    <p>Todo en un solo lugar: proyectos, tareas, equipos y métricas</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><i className="fas fa-bolt"></i></div>
                  <div>
                    <h3>Colaboración en Tiempo Real</h3>
                    <p>Comentarios, notificaciones y actualizaciones instantáneas</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><i className="fas fa-sync-alt"></i></div>
                  <div>
                    <h3>Flexibilidad Total</h3>
                    <p>Adapta el sistema a tu flujo de trabajo, no al revés</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><i className="fas fa-chart-line"></i></div>
                  <div>
                    <h3>Escalable y Confiable</h3>
                    <p>Crece con tu empresa sin límites de usuarios o proyectos</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><i className="fas fa-sparkles"></i></div>
                  <div>
                    <h3>Interfaz Intuitiva</h3>
                    <p>Diseño moderno y fácil de usar, sin curva de aprendizaje</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon"><i className="fas fa-building"></i></div>
                  <div>
                    <h3>Soporte Multi-Organización</h3>
                    <p>Gestiona múltiples organizaciones desde una sola cuenta</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <div className="floating-card card-1">
                <div className="card-content">
                  <div className="card-icon"><i className="fas fa-chart-bar"></i></div>
                  <div className="card-title">Analíticas</div>
                </div>
              </div>
              <div className="floating-card card-2">
                <div className="card-content">
                  <div className="card-icon"><i className="fas fa-users"></i></div>
                  <div className="card-title">Equipo</div>
                </div>
              </div>
              <div className="floating-card card-3">
                <div className="card-content">
                  <div className="card-icon"><i className="fas fa-bolt"></i></div>
                  <div className="card-title">Rápido</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <div className="cta-gradient"></div>
        </div>
        <div className="section-container">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para transformar tu gestión de proyectos?</h2>
            <p className="cta-subtitle">
              Únete a equipos que ya están aumentando su productividad con ChroneTask
            </p>
            <div className="cta-buttons">
              <button className="cta-primary-large" onClick={() => navigate("/login")}>
                <i className="fas fa-gift"></i> Comenzar Gratis
              </button>
              <button className="cta-secondary-large" onClick={() => scrollToSection(featuresRef)}>
                <i className="fas fa-eye"></i> Ver Demo
              </button>
            </div>
            <div className="cta-footer">
              <p>Desarrollado por <strong>JW TECH SOLUTIONS</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <img src="/logolanding.png" alt="ChroneTask" />
            <span>ChroneTask</span>
          </div>
          <div className="footer-links">
            <a href="#features">Características</a>
            <a href="#tech">Tecnologías</a>
            <a href="#benefits">Ventajas</a>
          </div>
          <div className="footer-copyright">
            <p>© 2024 JW TECH SOLUTIONS. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
