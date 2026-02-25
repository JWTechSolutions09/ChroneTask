# 🔐 Guía de Configuración - Login con Google

Esta guía te ayudará a configurar el login con Google OAuth 2.0 en ChroneTask.

---

## 📋 Requisitos Previos

1. Una cuenta de Google (Gmail)
2. Acceso a [Google Cloud Console](https://console.cloud.google.com/)
3. Tu aplicación desplegada o URL local para desarrollo

---

## 🚀 Pasos para Configurar

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombra el proyecto (ej: "ChroneTask")

### Paso 2: Habilitar Google+ API

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Google+ API" o "Google Identity Services"
3. Haz clic en **Enable**

### Paso 3: Configurar OAuth Consent Screen

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Selecciona **External** (para desarrollo) o **Internal** (si tienes Google Workspace)
3. Completa el formulario:
   - **App name:** ChroneTask
   - **User support email:** Tu email
   - **Developer contact information:** Tu email
4. Haz clic en **Save and Continue**
5. En **Scopes**, haz clic en **Add or Remove Scopes**
   - Selecciona:
     - `email`
     - `profile`
     - `openid`
6. Haz clic en **Save and Continue**
7. En **Test users** (si es External), agrega emails de prueba
8. Haz clic en **Save and Continue**

### Paso 4: Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth client ID**
3. Selecciona **Web application**
4. Completa:
   - **Name:** ChroneTask Web Client
   - **Authorized JavaScript origins:**
     - Para desarrollo local: `http://localhost:5173`
     - Para producción: `https://tu-dominio.com` (ej: `https://chronetask.pages.dev`)
   - **Authorized redirect URIs:**
     - Para desarrollo: `http://localhost:5173`
     - Para producción: `https://tu-dominio.com`
5. Haz clic en **Create**
6. **¡IMPORTANTE!** Copia el **Client ID** que aparece

### Paso 5: Configurar Variables de Entorno

#### Frontend (Cloudflare Pages o Local)

**Para desarrollo local:**
Crea un archivo `.env` en `frontend/`:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
```

**Para producción (Cloudflare Pages):**
1. Ve a tu proyecto en Cloudflare Pages
2. Ve a **Settings** > **Environment Variables**
3. Agrega:
   - **Variable name:** `VITE_GOOGLE_CLIENT_ID`
   - **Value:** Tu Client ID de Google
4. Haz clic en **Save**
5. **Re-despliega** la aplicación para que tome las nuevas variables

#### Backend (Render o Local)

**Para desarrollo local:**
Edita `appsettings.json` o `appsettings.Development.json`:
```json
{
  "Google": {
    "ClientId": "tu-client-id-aqui.apps.googleusercontent.com"
  }
}
```

**Para producción (Render):**
1. Ve a tu servicio en Render
2. Ve a **Environment**
3. Agrega nueva variable:
   - **Key:** `Google__ClientId`
   - **Value:** Tu Client ID de Google
4. Haz clic en **Save Changes**
5. El servicio se reiniciará automáticamente

---

## ✅ Verificación

### 1. Verificar Frontend

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Intenta hacer login con Google
4. Deberías ver que `window.google` está disponible
5. Si hay errores, verifica que:
   - El script de Google está cargado (verifica en Network tab)
   - El Client ID está configurado correctamente
   - Las URLs autorizadas coinciden con tu dominio

### 2. Verificar Backend

1. Revisa los logs del backend
2. Intenta hacer login con Google
3. Deberías ver en los logs:
   - Si el ClientId está configurado
   - Si la validación del token fue exitosa
   - Cualquier error de validación

### 3. Probar Login

1. Ve a `/login`
2. Haz clic en el botón de Google
3. Debería aparecer el popup de Google
4. Selecciona una cuenta
5. Deberías ser redirigido al dashboard

---

## 🔧 Solución de Problemas

### Error: "Google Sign-In no está disponible"

**Causa:** El script de Google no se cargó o el Client ID no está configurado.

**Solución:**
1. Verifica que `index.html` tiene el script:
   ```html
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```
2. Verifica que `VITE_GOOGLE_CLIENT_ID` está configurado
3. Revisa la consola del navegador para errores

### Error: "Invalid Google token: Client ID mismatch"

**Causa:** El Client ID en el backend no coincide con el del frontend.

**Solución:**
1. Verifica que ambos usan el mismo Client ID
2. Asegúrate de que la variable de entorno está configurada correctamente
3. Reinicia el backend después de cambiar la variable

### Error: "redirect_uri_mismatch"

**Causa:** La URL de redirección no está autorizada en Google Cloud Console.

**Solución:**
1. Ve a Google Cloud Console > Credentials
2. Edita tu OAuth 2.0 Client ID
3. Agrega la URL exacta en "Authorized redirect URIs"
4. Guarda los cambios

### El botón de Google no aparece o no funciona

**Causa:** El Client ID está vacío o el script no se cargó.

**Solución:**
1. Verifica en la consola: `console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)`
2. Debería mostrar tu Client ID
3. Si está vacío, verifica las variables de entorno
4. Re-despliega si es necesario

---

## 📝 Notas Importantes

1. **Client ID Público:** El Client ID es público y seguro compartirlo en el frontend
2. **Client Secret:** NO necesitas el Client Secret para este flujo (usamos ID Token)
3. **Dominios:** Asegúrate de agregar todos los dominios donde se usará (localhost, producción, staging)
4. **HTTPS:** En producción, Google requiere HTTPS
5. **Validación:** El backend valida el token con Google para mayor seguridad

---

## 🔒 Seguridad

- ✅ El token se valida en el backend usando Google's API
- ✅ El Client ID se verifica para prevenir tokens falsos
- ✅ Los tokens expiran automáticamente
- ✅ Solo se aceptan tokens válidos de Google

---

## 📚 Recursos Adicionales

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**¿Necesitas ayuda?** Revisa los logs del backend y la consola del navegador para más detalles del error.
