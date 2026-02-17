# 🚀 Configuración para Render.com

## ✅ Estado Actual

- **Backend API**: https://chronetask-1.onrender.com ✅ Funcionando
- **Base de Datos**: PostgreSQL en Render ✅ Configurada

## 📋 Variables de Entorno Necesarias en Render

Ve a tu servicio de backend en Render y configura estas variables de entorno:

### Variables de Entorno del Backend

1. **ASPNETCORE_ENVIRONMENT**
   ```
   Production
   ```

2. **ASPNETCORE_URLS**
   ```
   http://+:10000
   ```
   (Render usa el puerto 10000 por defecto)

3. **DATABASE_URL** (Automático)
   ```
   Render lo inyecta automáticamente cuando conectas el servicio PostgreSQL
   ```
   **O usa la URL interna:**
   ```
   postgresql://chronetask_db_user:RRQtvB6Am9nVv8CUjca0AC8oFxa0wgp4@dpg-d625aj95pdvs73b8h9og-a/chronetask_db
   ```

4. **JWT__SecretKey** (OBLIGATORIO - Genera uno seguro)
   ```bash
   # Genera uno con:
   openssl rand -base64 32
   ```
   Ejemplo de valor:
   ```
   tu-clave-secreta-minimo-32-caracteres-para-produccion-segura
   ```

5. **JWT__Issuer**
   ```
   ChroneTask
   ```

6. **JWT__Audience**
   ```
   ChroneTask
   ```

7. **JWT__ExpirationMinutes**
   ```
   1440
   ```
   (24 horas)

8. **CORS__AllowedOrigins** (URLs permitidas, separadas por comas)
   ```
   http://localhost:5173,http://localhost:5174,https://tu-frontend.onrender.com
   ```
   **⚠️ IMPORTANTE:** Incluye `http://localhost:5173` si vas a probar desde tu máquina local.

## 🔧 Configuración Paso a Paso

### 1. Configurar Variables de Entorno en Render

1. Ve a tu servicio backend en Render
2. Click en "Environment" en el menú lateral
3. Agrega cada variable de entorno una por una
4. Guarda los cambios (Render redeployará automáticamente)

### 2. Ejecutar Migraciones de Base de Datos

Tienes dos opciones:

#### Opción A: Desde el Shell de Render (Recomendado)

1. Ve a tu servicio backend en Render
2. Click en "Shell" en el menú lateral
3. Ejecuta:
   ```bash
   cd /opt/render/project/src
   dotnet ef database update --project ChroneTask.Api
   ```

#### Opción B: Agregar al Build Command

En la configuración del servicio, modifica el **Build Command**:

```bash
dotnet restore && dotnet ef database update --project ChroneTask.Api && dotnet publish -c Release -o ./publish
```

Y el **Start Command**:
```bash
cd publish && dotnet ChroneTask.Api.dll
```

### 3. Verificar que Todo Funciona

1. **Verificar API:**
   ```bash
   curl https://chronetask-1.onrender.com
   ```
   Debería responder: `{"name":"ChroneTask API","status":"running","docs":"/swagger"}`

2. **Verificar Base de Datos:**
   - Intenta hacer un registro/login desde tu frontend
   - O usa el endpoint de Swagger si está habilitado

## 🌐 Configurar Frontend en Render

### 1. Crear Static Site

1. En Render, click "New +" → "Static Site"
2. Conecta tu repositorio
3. Configura:
   - **Name**: `chronetask-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 2. Variables de Entorno del Frontend

```
VITE_API_URL=https://chronetask-1.onrender.com
```

**⚠️ IMPORTANTE:** Las variables de entorno de Vite deben estar configuradas ANTES del build. Render las inyecta automáticamente durante el build.

### 3. Configurar CORS en el Backend

Una vez que tengas la URL de tu frontend, actualiza la variable de entorno en el backend:

```
CORS__AllowedOrigins=https://tu-frontend.onrender.com
```

## 🔐 Generar JWT Secret Key

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 📝 URLs de tu Deployment

- **Backend API**: https://chronetask-1.onrender.com
- **Swagger Docs**: https://chronetask-1.onrender.com/swagger (si está habilitado en producción)
- **Frontend**: (configurar después)

## 🆘 Troubleshooting

### Error: "Connection string no configurado"
- Verifica que `DATABASE_URL` esté configurada o que `ConnectionStrings__DefaultConnection` tenga un valor válido

### Error: "JWT SecretKey no configurado"
- Asegúrate de tener `JWT__SecretKey` configurada con al menos 32 caracteres

### Error: "Cannot connect to database"
- Verifica que el servicio PostgreSQL esté conectado al backend
- Usa la URL interna si estás dentro de la misma red de Render

### Error de CORS
- Verifica que `CORS__AllowedOrigins` incluya la URL exacta de tu frontend (con https://)

## ✅ Checklist de Deployment

- [ ] Backend desplegado y funcionando
- [ ] Variables de entorno configuradas
- [ ] JWT Secret Key generado y configurado
- [ ] Migraciones de base de datos ejecutadas
- [ ] CORS configurado con URL del frontend
- [ ] Frontend desplegado (opcional)
- [ ] Pruebas de login/registro funcionando

---

**¡Tu backend está listo! 🎉**
