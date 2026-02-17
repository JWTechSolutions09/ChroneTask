# 🔧 Solución Rápida: Error de CORS

## ❌ Error que estás viendo:
```
Access to XMLHttpRequest at 'https://chronetask-1.onrender.com/api/auth/register' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## ✅ Solución: Configurar CORS en Render

### Paso 1: Ve a tu servicio backend en Render

1. Abre tu dashboard de Render
2. Click en tu servicio backend (`chronetask-1`)
3. Ve a la pestaña **"Environment"**

### Paso 2: Agrega/Actualiza la variable de entorno

**Nombre de la variable:**
```
CORS__AllowedOrigins
```

**Valor:**
```
http://localhost:5173,http://localhost:5174,https://tu-frontend.onrender.com
```

**⚠️ IMPORTANTE:**
- Separa las URLs con **comas** (`,`)
- **NO** uses espacios después de las comas
- Incluye `http://localhost:5173` para desarrollo local
- Cuando despliegues el frontend, agrega su URL también

### Paso 3: Guarda y espera el redeploy

Render automáticamente redeployará tu servicio cuando guardes las variables de entorno.

### Paso 4: Verifica

1. Espera 1-2 minutos a que termine el redeploy
2. Intenta hacer un registro/login desde tu frontend local
3. Debería funcionar sin errores de CORS

## 📝 Ejemplo Completo de Variables de Entorno en Render

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:10000
DATABASE_URL=postgresql://chronetask_db_user:RRQtvB6Am9nVv8CUjca0AC8oFxa0wgp4@dpg-d625aj95pdvs73b8h9og-a/chronetask_db
JWT__SecretKey=tu-clave-secreta-minimo-32-caracteres
JWT__Issuer=ChroneTask
JWT__Audience=ChroneTask
JWT__ExpirationMinutes=1440
CORS__AllowedOrigins=http://localhost:5173,http://localhost:5174,https://tu-frontend.onrender.com
```

## 🆘 Si aún no funciona

1. **Verifica que el redeploy haya terminado:**
   - Ve a la pestaña "Events" en Render
   - Debe decir "Deploy successful"

2. **Verifica los logs:**
   - Ve a la pestaña "Logs" en Render
   - Deberías ver: `🌐 CORS configurado con orígenes: http://localhost:5173, ...`

3. **Limpia la caché del navegador:**
   - Presiona `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac)
   - O abre en modo incógnito

4. **Verifica que la variable esté bien escrita:**
   - No debe tener espacios extra
   - Las URLs deben estar separadas solo por comas
   - No uses comillas en el valor

---

**¡Con esto debería funcionar! 🎉**
