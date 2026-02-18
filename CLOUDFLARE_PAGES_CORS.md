# 🌐 Configurar CORS para Frontend en Cloudflare Pages

## ✅ Tu Frontend está Desplegado

- **Frontend URL**: `https://a89b3114.chronetask.pages.dev`
- **Backend URL**: `https://chronetask-1.onrender.com`

## 🔧 Solución: Actualizar CORS en Render

### Paso 1: Ve a Render Dashboard

1. Abre tu servicio backend en Render
2. Click en **"Environment"** en el menú lateral

### Paso 2: Actualiza la Variable CORS__AllowedOrigins

**Busca la variable:**
```
CORS__AllowedOrigins
```

**Actualiza el valor a:**
```
http://localhost:5173,http://localhost:5174,https://a89b3114.chronetask.pages.dev
```

**⚠️ IMPORTANTE:**
- Separa las URLs solo con comas (`,`)
- Sin espacios después de las comas
- Incluye `http://localhost:5173` para desarrollo local
- Incluye la URL completa de Cloudflare Pages con `https://`

### Paso 3: Guarda y Espera el Redeploy

1. Click en **"Save Changes"**
2. Render automáticamente redeployará (espera 1-2 minutos)

### Paso 4: Verifica en los Logs

1. Ve a la pestaña **"Logs"** en Render
2. Busca esta línea:
   ```
   🌐 CORS configurado con orígenes: http://localhost:5173, http://localhost:5174, https://a89b3114.chronetask.pages.dev
   ```

### Paso 5: Prueba desde tu Frontend Desplegado

1. Ve a `https://a89b3114.chronetask.pages.dev`
2. Intenta hacer un registro/login
3. Debería funcionar sin errores de CORS

## 📋 Configuración Completa de Variables en Render

Asegúrate de tener estas variables configuradas:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:${PORT}
ConnectionStrings__DefaultConnection=postgresql://chronetask_db_user:RRQtvB6Am9nVv8CUjca0AC8oFxa0wgp4@dpg-d625aj95pdvs73b8h9og-a/chronetask_db
JWT__SecretKey=Chrone_Task_Secret_090304_Render
JWT__Issuer=ChroneTask
JWT__Audience=ChroneTaskUsers
JWT__ExpirationMinutes=1440
CORS__AllowedOrigins=http://localhost:5173,http://localhost:5174,https://a89b3114.chronetask.pages.dev
```

## 🔄 Si Cambias la URL del Frontend

Si Cloudflare Pages te asigna una nueva URL o configuras un dominio personalizado:

1. Actualiza `CORS__AllowedOrigins` en Render con la nueva URL
2. Guarda y espera el redeploy
3. También actualiza `VITE_API_URL` en Cloudflare Pages si es necesario

## 🌐 Dominio Personalizado en Cloudflare Pages

Si configuras un dominio personalizado (ej: `chronetask.com`):

1. Agrega la nueva URL a `CORS__AllowedOrigins`:
   ```
   http://localhost:5173,http://localhost:5174,https://a89b3114.chronetask.pages.dev,https://chronetask.com
   ```

2. Guarda y espera el redeploy

## ✅ Verificación

Después del redeploy, prueba:

1. **Desde desarrollo local** (`http://localhost:5173`): Debe funcionar
2. **Desde Cloudflare Pages** (`https://a89b3114.chronetask.pages.dev`): Debe funcionar
3. **Sin errores de CORS** en la consola del navegador

---

**¡Con esto debería funcionar desde tu frontend desplegado! 🎉**
