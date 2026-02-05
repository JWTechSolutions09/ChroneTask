import axios, { AxiosError } from "axios";
import { getToken, clearToken, isAuthed } from "../auth/token";

// Variable para almacenar la función de navegación de React Router
let navigateFunction: ((path: string) => void) | null = null;

export const setNavigateFunction = (navigate: (path: string) => void) => {
  navigateFunction = navigate;
};

export const http = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || "http://localhost:5279",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de request: agrega el token a todas las peticiones y valida expiración
http.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      // Verificar si el token está expirado antes de enviar la petición
      if (!isAuthed()) {
        // Token expirado, limpiar y rechazar la petición
        clearToken();
        // Solo redirigir si no estamos ya en login o register
        const currentPath = window.location.pathname;
        if (navigateFunction && !currentPath.includes("/login") && !currentPath.includes("/register")) {
          // Usar setTimeout para evitar problemas de navegación durante el render
          setTimeout(() => {
            navigateFunction("/login");
          }, 0);
        }
        return Promise.reject(new Error("Token expirado"));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response: maneja errores 401 (no autorizado)
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      clearToken();
      // Solo redirigir si no estamos ya en login o register
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
        if (navigateFunction) {
          // Usar setTimeout para evitar problemas de navegación durante el render
          setTimeout(() => {
            navigateFunction("/login");
          }, 0);
        } else {
          // Fallback a window.location solo si no hay React Router disponible
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
