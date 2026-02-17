# 🔧 Variables de Entorno Correctas para Render

## ❌ Problemas Detectados en tu Configuración Actual

1. **`Jwt__Key`** → Debe ser **`JWT__SecretKey`**
2. **Falta `CORS__AllowedOrigins`** → Necesaria para permitir peticiones desde tu frontend

## ✅ Configuración Correcta

### Variables de Entorno que DEBES tener en Render:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:${PORT}
ConnectionStrings__DefaultConnection=postgresql://chronetask_db_user:RRQtvB6Am9nVv8CUjca0AC8oFxa0wgp4@dpg-d625aj95pdvs73b8h9og-a/chronetask_db
JWT__SecretKey=Chrone_Task_Secret_090304_Render
JWT__Issuer=ChroneTask
JWT__Audience=ChroneTaskUsers
JWT__ExpirationMinutes=1440
CORS__AllowedOrigins=http://localhost:5173,http://localhost:5174
```

## 🔧 Cambios Necesarios

### 1. Corregir Variable JWT

**❌ Actual (INCORRECTO):**
```
Jwt__Key=Chrone_Task_Secret_090304_Render
```

**✅ Correcto:**
```
JWT__SecretKey=Chrone_Task_Secret_090304_Render
```

**Razón:** El código busca `JWT__SecretKey` (con doble guión bajo y "SecretKey"), no `Jwt__Key`.

### 2. Agregar Variable CORS (CRÍTICO)

**Agrega esta variable:**
```
CORS__AllowedOrigins=http://localhost:5173,http://localhost:5174
```

**⚠️ IMPORTANTE:**
- Separa las URLs solo con comas (`,`)
- Sin espacios después de las comas
- Incluye `http://localhost:5173` para desarrollo local
- Cuando despliegues el frontend, agrega su URL también (ej: `,https://tu-frontend.onrender.com`)

## 📝 Paso a Paso para Corregir

### Paso 1: Ve a Render Dashboard

1. Abre tu servicio backend en Render
2. Click en **"Environment"** en el menú lateral

### Paso 2: Corrige/Elimina la Variable Incorrecta

1. Busca `Jwt__Key`
2. **Elimínala** o cámbiala a `JWT__SecretKey`
3. Valor: `Chrone_Task_Secret_090304_Render`

### Paso 3: Agrega la Variable CORS

1. Click en **"Add Environment Variable"**
2. **Key:** `CORS__AllowedOrigins`
3. **Value:** `http://localhost:5173,http://localhost:5174`
4. Click **"Save Changes"**

### Paso 4: Verifica Todas las Variables

Asegúrate de tener exactamente estas variables:

| Variable | Valor |
|----------|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_URLS` | `http://0.0.0.0:${PORT}` |
| `ConnectionStrings__DefaultConnection` | `postgresql://chronetask_db_user:RRQtvB6Am9nVv8CUjca0AC8oFxa0wgp4@dpg-d625aj95pdvs73b8h9og-a/chronetask_db` |
| `JWT__SecretKey` | `Chrone_Task_Secret_090304_Render` |
| `JWT__Issuer` | `ChroneTask` |
| `JWT__Audience` | `ChroneTaskUsers` |
| `JWT__ExpirationMinutes` | `1440` |
| `CORS__AllowedOrigins` | `http://localhost:5173,http://localhost:5174` |

### Paso 5: Espera el Redeploy

Render automáticamente redeployará cuando guardes. Espera 1-2 minutos.

### Paso 6: Verifica en los Logs

1. Ve a la pestaña **"Logs"** en Render
2. Deberías ver:
   ```
   🌐 CORS configurado con orígenes: http://localhost:5173, http://localhost:5174
   ```

## ✅ Verificación Final

Después del redeploy:

1. **Verifica que el backend responde:**
   ```bash
   curl https://chronetask-1.onrender.com
   ```
   Debería responder: `{"name":"ChroneTask API","status":"running","docs":"/swagger"}`

2. **Prueba desde tu frontend local:**
   - Intenta hacer un registro/login
   - No debería haber errores de CORS
   - No debería haber errores de JWT

## 🆘 Si Aún Hay Problemas

### Error: "JWT SecretKey no configurado"
- Verifica que la variable se llame exactamente `JWT__SecretKey` (con doble guión bajo)
- Verifica que el valor no esté vacío

### Error de CORS
- Verifica que `CORS__AllowedOrigins` esté configurada
- Verifica que no haya espacios extra en el valor
- Verifica en los logs que CORS se configuró correctamente

### Error de Conexión a Base de Datos
- Verifica que `ConnectionStrings__DefaultConnection` tenga el valor correcto
- Verifica que el servicio PostgreSQL esté conectado al backend

---

**¡Con estos cambios debería funcionar perfectamente! 🎉**
