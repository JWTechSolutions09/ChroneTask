const KEY = "chronetask_token";

export const setToken = (token: string) => localStorage.setItem(KEY, token);
export const getToken = () => localStorage.getItem(KEY);
export const clearToken = () => localStorage.removeItem(KEY);

/**
 * Decodifica un token JWT sin verificar la firma (solo para leer el payload)
 */
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decodificando token:", error);
    return null;
  }
};

/**
 * Verifica si el token JWT está expirado
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    // exp está en segundos, Date.now() está en milisegundos
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    // Considerar expirado si falta menos de 1 minuto (buffer de seguridad)
    return currentTime >= expirationTime - 60000;
  } catch (error) {
    console.error("Error verificando expiración del token:", error);
    return true;
  }
};

/**
 * Verifica si el usuario está autenticado y el token es válido
 */
export const isAuthed = (): boolean => {
  const token = getToken();
  if (!token) return false;

  // Verificar si el token está expirado
  if (isTokenExpired(token)) {
    clearToken();
    return false;
  }

  return true;
};

/**
 * Obtiene información del usuario desde el token
 */
export const getUserFromToken = (): { userId?: string; email?: string } | null => {
  const token = getToken();
  if (!token) return null;

  const decoded = decodeJWT(token);
  if (!decoded) return null;

  return {
    userId: decoded[`http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`] || decoded.sub,
    email: decoded[`http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`] || decoded.email,
  };
};
