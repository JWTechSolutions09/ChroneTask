import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import "../styles/onboarding.css";

type UsageType = "personal" | "team" | "business";

export default function Onboarding() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState<UsageType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedType) {
      showToast("Por favor selecciona una opción", "error");
      return;
    }

    setLoading(true);
    try {
      // Intentar guardar el tipo de uso del usuario
      // Primero intentar con el endpoint específico, si falla usar el endpoint general
      // El backend está configurado para camelCase, así que enviamos usageType
      let saved = false;
      try {
        await http.patch("/api/users/me/usage-type", {
          usageType: selectedType, // camelCase para coincidir con la configuración del backend
        });
        saved = true;
      } catch (usageTypeError: any) {
        // Si el endpoint específico no existe (404), usar el endpoint general
        if (usageTypeError?.response?.status === 404) {
          console.log("Endpoint /api/users/me/usage-type no disponible, usando /api/users/me como fallback");
          try {
            await http.patch("/api/users/me", {
              usageType: selectedType, // camelCase para coincidir con la configuración del backend
            });
            saved = true;
          } catch (fallbackError: any) {
            console.error("Error en fallback:", fallbackError);
            throw fallbackError; // Re-lanzar el error del fallback
          }
        } else {
          throw usageTypeError; // Re-lanzar si es otro error
        }
      }

      if (saved) {
        showToast("Configuración guardada exitosamente", "success");
      }

      // Redirigir según el tipo seleccionado
      switch (selectedType) {
        case "personal":
          navigate("/personal/projects", { replace: true });
          break;
        case "team":
          navigate("/teams", { replace: true });
          break;
        case "business":
          navigate("/org-select", { replace: true });
          break;
      }
    } catch (ex: any) {
      console.error("Error en onboarding:", ex);
      let errorMsg = "Error guardando configuración";
      
      if (ex?.response?.status === 404) {
        errorMsg = "El endpoint no está disponible. Por favor, verifica que el backend esté actualizado.";
      } else if (ex?.response?.data?.message) {
        errorMsg = ex.response.data.message;
      } else if (ex?.message) {
        errorMsg = ex.message;
      }
      
      showToast(errorMsg, "error");
      
      // Si el endpoint no existe, redirigir a org-select como fallback
      if (ex?.response?.status === 404) {
        setTimeout(() => {
          navigate("/org-select", { replace: true });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const options = [
    {
      type: "personal" as UsageType,
      title: "Uso Personal",
      description: "Perfecto para gestionar tus proyectos y tareas individuales",
      icon: "👤",
      color: "#3b82f6",
      features: [
        "Proyectos personales ilimitados",
        "Gestión de tareas individual",
        "Sin necesidad de equipos u organizaciones",
        "Ideal para freelancers y proyectos propios",
      ],
    },
    {
      type: "team" as UsageType,
      title: "Equipo",
      description: "Colabora eficientemente con tu equipo en proyectos compartidos",
      icon: "👥",
      color: "#10b981",
      features: [
        "Colaboración en tiempo real",
        "Gestión de miembros del equipo",
        "Proyectos compartidos",
        "Ideal para startups y grupos de trabajo",
      ],
    },
    {
      type: "business" as UsageType,
      title: "Empresarial",
      description: "Gestiona múltiples organizaciones, equipos y proyectos a gran escala",
      icon: "🏢",
      color: "#8b5cf6",
      features: [
        "Múltiples organizaciones",
        "Gestión avanzada de equipos",
        "Control de acceso y permisos",
        "Ideal para empresas y corporaciones",
      ],
    },
  ];

  return (
    <div className="onboarding-container">
      {/* Animated Background */}
      <div className="onboarding-background">
        <div className="onboarding-gradient-orb orb-personal"></div>
        <div className="onboarding-gradient-orb orb-team"></div>
        <div className="onboarding-gradient-orb orb-business"></div>
      </div>

      {/* Animated Particles */}
      <div className="onboarding-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Main Content */}
      <div className="onboarding-content">
        <div className="onboarding-card">
          <div className="onboarding-header">
            <h1 className="onboarding-title">Bienvenido a ChroneTask</h1>
            <p className="onboarding-subtitle">
              ¿Cuál es el propósito principal de tu uso?
            </p>
            <p className="onboarding-note">
              Podrás cambiar esto más tarde en configuración
            </p>
          </div>

          <div className="onboarding-options">
            {options.map((option) => (
              <div
                key={option.type}
                className={`onboarding-option ${option.type} ${
                  selectedType === option.type ? "selected" : ""
                }`}
                onClick={() => !loading && setSelectedType(option.type)}
                style={{ cursor: loading ? "not-allowed" : "pointer" }}
              >
                <div className="onboarding-selected-indicator">✓</div>
                <div className="onboarding-option-icon">{option.icon}</div>
                <div className="onboarding-option-content">
                  <h3 className="onboarding-option-title">{option.title}</h3>
                  <p className="onboarding-option-description">
                    {option.description}
                  </p>
                  <div className="onboarding-option-features">
                    <div className="onboarding-option-features-title">
                      Ideal para:
                    </div>
                    <ul className="onboarding-option-features-list">
                      {option.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="onboarding-actions">
            <button
              onClick={handleContinue}
              disabled={!selectedType || loading}
              className={`onboarding-continue-btn ${
                selectedType
                  ? options.find((o) => o.type === selectedType)?.type || "default"
                  : "default"
              }`}
            >
              {loading ? "Guardando..." : "Continuar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
