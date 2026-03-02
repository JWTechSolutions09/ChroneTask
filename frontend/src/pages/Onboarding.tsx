import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useToast } from "../contexts/ToastContext";
import "../styles/auth.css";

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
      description: "Gestiona tus proyectos y tareas personales",
      icon: "👤",
      color: "#3b82f6",
    },
    {
      type: "team" as UsageType,
      title: "Equipo",
      description: "Trabaja en proyectos con tu equipo",
      icon: "👥",
      color: "#10b981",
    },
    {
      type: "business" as UsageType,
      title: "Empresarial",
      description: "Gestiona organizaciones y múltiples equipos",
      icon: "🏢",
      color: "#8b5cf6",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-secondary)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "var(--bg-primary)",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "12px",
            }}
          >
            Bienvenido a ChroneTask
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "var(--text-secondary)",
              marginBottom: "8px",
            }}
          >
            ¿Cuál es el propósito principal de tu uso?
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
            }}
          >
            Podrás cambiar esto más tarde en configuración
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {options.map((option) => (
            <button
              key={option.type}
              onClick={() => setSelectedType(option.type)}
              disabled={loading}
              style={{
                padding: "32px 24px",
                borderRadius: "12px",
                border: `2px solid ${
                  selectedType === option.type
                    ? option.color
                    : "var(--border-color)"
                }`,
                backgroundColor:
                  selectedType === option.type
                    ? `${option.color}10`
                    : "var(--bg-secondary)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                textAlign: "center",
                transform:
                  selectedType === option.type ? "scale(1.05)" : "scale(1)",
                boxShadow:
                  selectedType === option.type
                    ? `0 4px 20px ${option.color}40`
                    : "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) => {
                if (!loading && selectedType !== option.type) {
                  e.currentTarget.style.borderColor = option.color;
                  e.currentTarget.style.backgroundColor = `${option.color}08`;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && selectedType !== option.type) {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                }
              }}
            >
              <span style={{ fontSize: "48px" }}>{option.icon}</span>
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  {option.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  {option.description}
                </p>
              </div>
              {selectedType === option.type && (
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: option.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            onClick={handleContinue}
            disabled={!selectedType || loading}
            style={{
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: 600,
              color: "white",
              backgroundColor: selectedType
                ? options.find((o) => o.type === selectedType)?.color
                : "var(--text-secondary)",
              border: "none",
              borderRadius: "8px",
              cursor: !selectedType || loading ? "not-allowed" : "pointer",
              opacity: !selectedType || loading ? 0.6 : 1,
              transition: "all 0.3s ease",
              minWidth: "200px",
            }}
            onMouseEnter={(e) => {
              if (selectedType && !loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedType && !loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {loading ? "Guardando..." : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
