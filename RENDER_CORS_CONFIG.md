# 🔧 Configurar CORS en Render - SOLUCIÓN DEFINITIVA

## ❌ Problema Detectado en los Logs

En los logs de Render aparece:
```
🌐 CORS configurado con orígenes: ${FRONTEND_URL:-http://localhost}, http://localhost:5174
```

Esto significa que:
- La variable `CORS__AllowedOrigins` **NO está configurada** en Render
- El código está leyendo desde `appsettings.Production.json` que tiene variables no expandidas
- Solo está usando el fallback de `http://localhost:5174`

## ✅ Solución: Configurar Variable en Render

### Paso 1: Ve a Render Dashboard

1. Abre tu servicio backend en Render
2. Click en **"Environment"** en el menú lateral

### Paso 2: Agrega la Variable CORS__AllowedOrigins

1. Click en **"Add Environment Variable"**
2. **Key:** `CORS__AllowedOrigins`
3. **Value:** `http://localhost:5173,http://localhost:5174,https://a89b3114.chronetask.pages.dev`
4. Click en **"Save Changes"**

**⚠️ IMPORTANTE:**
- El nombre debe ser exactamente `CORS__AllowedOrigins` (con doble guión bajo `__`)
- Separa las URLs solo con comas (`,`)
- **NO** uses espacios después de las comas
- Incluye todas las URLs que necesites:
  - `http://localhost:5173` (desarrollo local)
  - `http://localhost:5174` (desarrollo local alternativo)
  - `https://a89b3114.chronetask.pages.dev` (frontend desplegado)

### Paso 3: Espera el Redeploy

Render automáticamente redeployará cuando guardes. Espera 1-2 minutos.

### Paso 4: Verifica en los Logs

1. Ve a la pestaña **"Logs"** en Render
2. Busca esta línea al inicio:
   ```
   🌐 CORS configurado con orígenes: http://localhost:5173, http://localhost:5174, https://a89b3114.chronetask.pages.dev
   ```

**Si ves esta línea con las URLs correctas:** ✅ CORS está configurado correctamente

**Si sigues viendo `${FRONTEND_URL:-http://localhost}`:** ❌ La variable no está configurada correctamente

## 📋 Configuración Completa de Variables en Render

Asegúrate de tener estas variables:

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

## 🧪 Prueba Después de Configurar

Después del redeploy, prueba desde PowerShell:

```powershell
$headers = @{
    "Origin" = "http://localhost:5173"
    "Access-Control-Request-Method" = "POST"
}

$response = Invoke-WebRequest -Uri "https://chronetask-1.onrender.com/api/auth/register" `
    -Method OPTIONS `
    -Headers $headers

# Verificar headers CORS
$response.Headers | Where-Object {$_.Key -like '*Access-Control*'} | Format-Table
```

**Deberías ver:**
- `Access-Control-Allow-Origin: http://localhost:5173`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Credentials: true`

## ✅ Checklist

- [ ] Variable `CORS__AllowedOrigins` agregada en Render
- [ ] Valor es: `http://localhost:5173,http://localhost:5174,https://a89b3114.chronetask.pages.dev`
- [ ] Sin espacios después de las comas
- [ ] Redeploy completado
- [ ] Logs muestran las URLs correctas (no `${FRONTEND_URL}`)
- [ ] Petición OPTIONS devuelve headers CORS

---

**¡Con esto debería funcionar definitivamente! 🎉**
