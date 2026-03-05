import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Cargar tema desde localStorage o usar modo claro por defecto
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) return savedTheme;
    
    // Por defecto, usar modo claro
    return "light";
  });

  useEffect(() => {
    // Aplicar tema al documento con transición suave
    const root = document.documentElement;
    root.style.transition = "background-color 0.3s ease, color 0.3s ease";
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    
    // Forzar repaint para asegurar que la transición se aplique
    requestAnimationFrame(() => {
      root.style.transition = "";
    });
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
