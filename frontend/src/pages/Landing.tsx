import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Forzar modo oscuro siempre
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
    
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Determinar sección activa
      const sections = [heroRef, featuresRef, benefitsRef, howItWorksRef];
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
    handleScroll();

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

    const elements = document.querySelectorAll(".feature-card, .benefit-item, .step-card, .detailed-feature-item");
    elements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page dark" data-theme="dark">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        {mobileMenuOpen && (
          <div
            className="landing-mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
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
          <div
            className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={(e) => {
              e.stopPropagation();
              scrollToSection(heroRef);
              setMobileMenuOpen(false);
            }}>Inicio</button>
            <button onClick={(e) => {
              e.stopPropagation();
              scrollToSection(featuresRef);
              setMobileMenuOpen(false);
            }}>Características</button>
            <button onClick={(e) => {
              e.stopPropagation();
              scrollToSection(benefitsRef);
              setMobileMenuOpen(false);
            }}>Beneficios</button>
            <button onClick={(e) => {
              e.stopPropagation();
              scrollToSection(howItWorksRef);
              setMobileMenuOpen(false);
            }}>Cómo Funciona</button>
            <button
              className="btn-login"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/access");
              }}
            >
              <i className="fas fa-sign-in-alt"></i> Acceder
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
          <div className="hero-badge">
            <i className="fas fa-star"></i>
            <span>La solución #1 para gestión de proyectos</span>
          </div>
          <h1 className="hero-title">
            <span className="title-line">Organiza tu equipo,</span>
            <span className="title-line highlight">cumple tus objetivos</span>
          </h1>
          <p className="hero-subtitle">
            Simplifica la gestión de proyectos, mejora la colaboración de tu equipo y alcanza resultados excepcionales. Todo en una plataforma intuitiva y poderosa.
          </p>
          <div className="hero-cta">
            <button className="cta-primary" onClick={() => navigate("/access")}>
              <i className="fas fa-rocket"></i> Comenzar Gratis
            </button>
            <button className="cta-secondary" onClick={() => scrollToSection(featuresRef)}>
              <i className="fas fa-info-circle"></i> Conocer Más
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Más Productividad</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Disponible</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Equipos Activos</div>
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
            <h2 className="section-title">Todo lo que necesitas para triunfar</h2>
            <p className="section-subtitle">
              Herramientas poderosas diseñadas para equipos que buscan resultados reales
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Vista General Inteligente</h3>
              <p>
                Monitorea el progreso de todos tus proyectos desde un solo lugar. Toma decisiones informadas con datos en tiempo real y métricas claras.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Colaboración en Equipo</h3>
              <p>
                Trabaja junto a tu equipo sin fricciones. Comentarios instantáneos, notificaciones inteligentes y comunicación fluida en cada proyecto.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Planificación Visual</h3>
              <p>
                Organiza tus proyectos con vistas claras y cronogramas visuales. Gestiona plazos, dependencias y recursos de forma intuitiva.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Notificaciones Inteligentes</h3>
              <p>
                Mantente al día con alertas personalizadas sobre cambios importantes, comentarios y recordatorios. Nunca pierdas información relevante.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Análisis de Rendimiento</h3>
              <p>
                Descubre insights valiosos sobre el rendimiento de tu equipo. Gráficos claros y reportes que te ayudan a mejorar continuamente.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>Cumplimiento de Plazos</h3>
              <p>
                Configura alertas automáticas y recibe avisos cuando se acerquen los plazos límite. Cumple siempre a tiempo con tus compromisos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="benefits-section">
        <div className="section-container">
          <div className="benefits-header-text">
            <h2 className="section-title">¿Por qué miles de equipos eligen ChroneTask?</h2>
            <p className="benefits-intro">
              No es solo una herramienta, es tu aliado para alcanzar el éxito en cada proyecto.
            </p>
          </div>
          <div className="benefits-content">
            <div className="benefits-visual-image">
              <img src="/LandingImage.png" alt="ChroneTask Dashboard" className="landing-feature-image" />
            </div>
            <div className="benefits-text">
              <div className="benefit-list">
                <div className="benefit-item">
                  <div className="benefit-icon">📦</div>
                  <div>
                    <h3>Todo en un Solo Lugar</h3>
                    <p>Proyectos, tareas, equipos y métricas centralizados. Olvídate de cambiar entre múltiples herramientas.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">⚡</div>
                  <div>
                    <h3>Colaboración en Tiempo Real</h3>
                    <p>Comunicación instantánea, actualizaciones en vivo y trabajo sincronizado. Tu equipo siempre en la misma página.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🎛️</div>
                  <div>
                    <h3>Se Adapta a Tu Flujo</h3>
                    <p>Personaliza el sistema según tus necesidades. No cambies tu forma de trabajar, adapta la herramienta a ti.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">📈</div>
                  <div>
                    <h3>Crece Sin Límites</h3>
                    <p>Escalable para equipos pequeños y grandes empresas. Sin restricciones de usuarios o proyectos.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">✨</div>
                  <div>
                    <h3>Fácil de Usar</h3>
                    <p>Interfaz intuitiva que cualquiera puede dominar en minutos. Sin curva de aprendizaje complicada.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🏢</div>
                  <div>
                    <h3>Múltiples Organizaciones</h3>
                    <p>Gestiona varios equipos o empresas desde una sola cuenta. Perfecto para consultores y freelancers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Showcase Section */}
      <section className="detailed-features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Descubre todas nuestras funcionalidades</h2>
            <p className="section-subtitle">
              Herramientas diseñadas para potenciar la productividad de tu equipo
            </p>
          </div>
          
          <div className="detailed-features-grid">
            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Calendario.png" alt="Calendario" />
              </div>
              <div className="detailed-feature-content">
                <h3>Calendario Inteligente</h3>
                <p>
                  Visualiza y gestiona todos tus eventos, reuniones y plazos en un calendario intuitivo. 
                  Sincroniza con tus proyectos y nunca pierdas una fecha importante. Organiza tu tiempo 
                  de manera eficiente y mantén a tu equipo siempre alineado.
                </p>
              </div>
            </div>

            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Gestiondetareas.png" alt="Gestión de Tareas" />
              </div>
              <div className="detailed-feature-content">
                <h3>Gestión de Tareas Avanzada</h3>
                <p>
                  Crea, asigna y rastrea tareas con facilidad. Organiza tus proyectos con listas, 
                  etiquetas y prioridades. Visualiza el progreso en tiempo real y asegúrate de que 
                  cada miembro del equipo sepa exactamente qué hacer y cuándo hacerlo.
                </p>
              </div>
            </div>

            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Gestiondemiembros.png" alt="Gestión de Miembros" />
              </div>
              <div className="detailed-feature-content">
                <h3>Gestión de Miembros</h3>
                <p>
                  Administra tu equipo con herramientas poderosas. Asigna roles, gestiona permisos 
                  y mantén un control total sobre quién puede acceder a qué. Facilita la colaboración 
                  mientras mantienes la seguridad y organización de tu proyecto.
                </p>
              </div>
            </div>

            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Invitacion de miembros .png" alt="Invitación de Miembros" />
              </div>
              <div className="detailed-feature-content">
                <h3>Invitación de Miembros</h3>
                <p>
                  Invita a nuevos miembros a tu equipo con un solo clic. El proceso es rápido, 
                  seguro y personalizable. Define roles desde el inicio y haz que la incorporación 
                  de nuevos colaboradores sea tan simple como enviar un enlace.
                </p>
              </div>
            </div>

            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Comentariosinteractivosenlastareas.png" alt="Comentarios Interactivos" />
              </div>
              <div className="detailed-feature-content">
                <h3>Comentarios Interactivos en las Tareas</h3>
                <p>
                  Fomenta la comunicación directa en cada tarea. Comenta, menciona miembros, 
                  adjunta archivos y mantén conversaciones contextualizadas. Toda la información 
                  relevante queda registrada donde realmente importa.
                </p>
              </div>
            </div>

            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Resumenyanaliticas.png" alt="Resumen y Analíticas" />
              </div>
              <div className="detailed-feature-content">
                <h3>Resumen y Analíticas</h3>
                <p>
                  Toma decisiones basadas en datos reales. Visualiza el rendimiento de tu equipo, 
                  identifica cuellos de botella y celebra los logros. Gráficos claros y reportes 
                  detallados te ayudan a optimizar continuamente tu flujo de trabajo.
                </p>
              </div>
            </div>

            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Notasdelproyecto.png" alt="Notas del Proyecto" />
              </div>
              <div className="detailed-feature-content">
                <h3>Notas del Proyecto</h3>
                <p>
                  Documenta ideas, decisiones y contexto importante directamente en tus proyectos. 
                  Mantén toda la información relevante organizada y accesible para todo el equipo. 
                  Las notas colaborativas hacen que el conocimiento fluya sin fricciones.
                </p>
              </div>
            </div>

            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Notaspersonales.png" alt="Notas Personales" />
              </div>
              <div className="detailed-feature-content">
                <h3>Notas Personales</h3>
                <p>
                  Organiza tus pensamientos, recordatorios y tareas personales en un espacio privado. 
                  Mantén tus notas personales separadas pero accesibles, y gestiona tanto tu trabajo 
                  en equipo como tus responsabilidades individuales desde un solo lugar.
                </p>
              </div>
            </div>

            <div className="detailed-feature-item">
              <div className="detailed-feature-image">
                <img src="/Panelnotificaciones.png" alt="Panel de Notificaciones" />
              </div>
              <div className="detailed-feature-content">
                <h3>Panel de Notificaciones</h3>
                <p>
                  Mantente al día con todo lo que importa. Recibe alertas personalizadas sobre 
                  cambios, comentarios, asignaciones y recordatorios. Un centro de notificaciones 
                  inteligente que te ayuda a priorizar y no perderte nada importante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Comienza en minutos, no en días</h2>
            <p className="section-subtitle">
              Configura tu equipo y empieza a trabajar de inmediato
            </p>
          </div>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">👤</div>
              <h3>Crea tu Cuenta</h3>
              <p>Regístrate gratis en menos de un minuto. Sin tarjeta de crédito requerida.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">📋</div>
              <h3>Crea tu Primer Proyecto</h3>
              <p>Configura tu proyecto en segundos. Elige una plantilla o empieza desde cero.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">👥</div>
              <h3>Invita a tu Equipo</h3>
              <p>Agrega miembros con un clic. Todos tendrán acceso inmediato y podrán empezar a trabajar.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">🚀</div>
              <h3>¡Comienza a Trabajar!</h3>
              <p>Ya estás listo. Crea tareas, asigna responsabilidades y alcanza tus objetivos.</p>
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
            <h2 className="cta-title">¿Listo para transformar tu productividad?</h2>
            <p className="cta-subtitle">
              Únete a cientos de equipos que ya están logrando más con menos esfuerzo
            </p>
            <div className="cta-buttons">
              <button className="cta-primary-large" onClick={() => navigate("/access")}>
                <i className="fas fa-gift"></i> Comenzar Gratis Ahora
              </button>
            </div>
            <div className="cta-features">
              <div className="cta-feature">
                <i className="fas fa-check"></i>
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="cta-feature">
                <i className="fas fa-check"></i>
                <span>Configuración en minutos</span>
              </div>
              <div className="cta-feature">
                <i className="fas fa-check"></i>
                <span>Soporte incluido</span>
              </div>
            </div>
            <div className="cta-footer">
              <p>Desarrollado con ❤️ por <strong>JW TECH SOLUTIONS</strong></p>
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
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>Características</a>
            <a href="#benefits" onClick={(e) => { e.preventDefault(); scrollToSection(benefitsRef); }}>Beneficios</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection(howItWorksRef); }}>Cómo Funciona</a>
          </div>
          <div className="footer-copyright">
            <p>© 2024 JW TECH SOLUTIONS. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
