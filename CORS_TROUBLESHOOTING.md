# 🔧 Troubleshooting CORS - Guía Completa

## ❌ Error que estás viendo:
```
Access to XMLHttpRequest at 'https://chronetask-1.onrender.com/api/auth/register' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔍 Diagnóstico Paso a Paso

### Paso 1: Verificar Variables de Entorno en Render

1. Ve a Render Dashboard → Tu servicio backend → **"Environment"**
2. Verifica que tengas estas variables **EXACTAMENTE** así:

```
CORS__AllowedOrigins=http://localhost:5173,http://localhost:5174
```

**⚠️ IMPORTANTE:**
- El nombre debe ser `CORS__AllowedOrigins` (con doble guión bajo `__`)
- El valor NO debe tener espacios después de las comas
- Debe incluir `http://localhost:5173` (no `https://`)

### Paso 2: Verificar en los Logs de Render

1. Ve a la pestaña **"Logs"** en Render
2. Busca esta línea al inicio del deploy:
   ```
   🌐 CORS configurado con orígenes: http://localhost:5173, http://localhost:5174
   ```

**Si NO ves esta línea:**
- La variable `CORS__AllowedOrigins` no está configurada correctamente
- O el código no se está ejecutando

**Si SÍ ves la línea pero con orígenes diferentes:**
- Verifica que el valor de la variable sea correcto

### Paso 3: Verificar que el Redeploy se Completó

1. Ve a la pestaña **"Events"** en Render
2. Debe decir **"Deploy successful"** (verde)
3. Si dice "Deploy failed" o está en proceso, espera a que termine

### Paso 4: Probar la API Directamente

Abre una terminal y ejecuta:

```bash
curl -X OPTIONS https://chronetask-1.onrender.com/api/auth/register \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

**Deberías ver en la respuesta:**
```
< Access-Control-Allow-Origin: http://localhost:5173
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

**Si NO ves estos headers:**
- CORS no está configurado correctamente
- O la variable de entorno no se está leyendo

## ✅ Soluciones

### Solución 1: Verificar y Corregir Variable de Entorno

1. En Render, ve a **Environment**
2. Busca `CORS__AllowedOrigins`
3. Si no existe, créala:
   - **Key:** `CORS__AllowedOrigins`
   - **Value:** `http://localhost:5173,http://localhost:5174`
4. Si existe pero tiene espacios, corrígela (sin espacios)
5. **Guarda** y espera el redeploy (1-2 minutos)

### Solución 2: Forzar Redeploy

Si ya configuraste la variable pero sigue sin funcionar:

1. Ve a la pestaña **"Manual Deploy"** en Render
2. Click en **"Deploy latest commit"**
3. Espera a que termine el deploy

### Solución 3: Verificar el Código

El código en `Program.cs` debe tener:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        // ... código que lee CORS__AllowedOrigins ...
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Y luego:
app.UseCors("Frontend"); // ANTES de otros middlewares
```

### Solución 4: Limpiar Caché del Navegador

1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. Selecciona **"Empty Cache and Hard Reload"**
4. O usa modo incógnito para probar

## 🧪 Prueba Rápida

Ejecuta esto en tu terminal (PowerShell):

```powershell
# Probar petición OPTIONS (preflight)
Invoke-WebRequest -Uri "https://chronetask-1.onrender.com/api/auth/register" `
  -Method OPTIONS `
  -Headers @{
    "Origin" = "http://localhost:5173"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "content-type"
  } `
  -Verbose
```

**Si funciona, deberías ver:**
- Status: 200 OK
- Headers con `Access-Control-Allow-Origin: http://localhost:5173`

**Si NO funciona:**
- Verifica las variables de entorno en Render
- Verifica los logs de Render

## 📋 Checklist Final

- [ ] Variable `CORS__AllowedOrigins` existe en Render
- [ ] Valor es `http://localhost:5173,http://localhost:5174` (sin espacios)
- [ ] Redeploy se completó exitosamente
- [ ] Logs muestran: `🌐 CORS configurado con orígenes: ...`
- [ ] Petición OPTIONS devuelve headers CORS correctos
- [ ] Caché del navegador limpiada

## 🆘 Si Nada Funciona

1. **Verifica que el código esté actualizado:**
   - El código debe tener la lógica para leer `CORS__AllowedOrigins`
   - Debe estar en el commit más reciente

2. **Verifica el formato de la variable:**
   - En Render, las variables con `__` (doble guión bajo) se convierten a `:` en la configuración
   - Pero el código las lee como `CORS__AllowedOrigins` desde variables de entorno

3. **Prueba con una variable temporal:**
   - Agrega temporalmente: `ASPNETCORE_CORS_DEBUG=true`
   - Esto puede ayudar a ver qué está pasando

4. **Contacta soporte:**
   - Si todo lo anterior está correcto y aún no funciona, puede ser un problema de Render
   - Revisa los logs completos del servicio

---

**¡Con estos pasos deberías poder solucionar el problema de CORS! 🎉**
