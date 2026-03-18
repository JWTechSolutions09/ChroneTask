import axios, { AxiosError } from "axios";
import { getToken, clearToken, isAuthed } from "../auth/token";

// Variable para almacenar la función de navegación de React Router
let navigateFunction: ((path: string) => void) | null = null;

export const setNavigateFunction = (navigate: (path: string) => void) => {
  navigateFunction = navigate;
};

// Obtener la URL de la API desde variables de entorno
const getApiUrl = () => {
  // En desarrollo local, usar el proxy de Vite (sin CORS)
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    // En desarrollo, usar el proxy de Vite (relativo, sin CORS)
    return ''; // URL relativa usa el proxy de Vite
  }
  
  // En producción, usar la URL completa
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    if (import.meta.env.DEV) {
      console.log('🌐 API URL desde VITE_API_URL:', apiUrl);
    }
    return apiUrl;
  }
  
  // URL por defecto para producción (Render)
  const prodUrl = 'https://chronetask-1.onrender.com';
  if (import.meta.env.DEV) {
    console.log('🌐 API URL (producción):', prodUrl);
  }
  return prodUrl;
};

const apiBaseURL = getApiUrl();

export const http = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log para verificar la configuración
if (import.meta.env.DEV) {
  console.log('✅ Axios configurado con baseURL:', apiBaseURL);
}

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
