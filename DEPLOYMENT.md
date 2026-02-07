# 🚀 Guía de Deployment a Producción - ChroneTask

Esta guía te ayudará a desplegar ChroneTask en diferentes plataformas.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Deployment con Docker](#deployment-con-docker)
3. [Deployment en Plataformas Cloud](#deployment-en-plataformas-cloud)
4. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
5. [Migraciones de Base de Datos](#migraciones-de-base-de-datos)
6. [Verificación Post-Deployment](#verificación-post-deployment)

---

## 📦 Requisitos Previos

- Docker y Docker Compose instalados
- Cuenta en un proveedor de hosting (opcional)
- PostgreSQL (si no usas Docker)

---

## 🐳 Deployment con Docker

### Opción 1: Docker Compose (Recomendado)

1. **Clonar el repositorio:**
   ```bash
   git clone <tu-repositorio>
   cd ChroneTask
   ```

2. **Crear archivo `.env`:**
   ```bash
   cp .env.example .env
   ```
   
   Edita `.env` y configura:
   - `POSTGRES_PASSWORD`: Contraseña segura para PostgreSQL
   - `JWT_SECRET_KEY`: Clave secreta de al menos 32 caracteres
   - `VITE_API_URL`: URL de tu API en producción

3. **Construir y levantar los servicios:**
   ```bash
   docker-compose up -d --build
   ```

4. **Ejecutar migraciones de base de datos:**
   ```bash
   docker-compose exec backend dotnet ef database update --project ChroneTask.Api
   ```

5. **Verificar que todo esté corriendo:**
   ```bash
   docker-compose ps
   ```

### Opción 2: Docker Individual

#### Backend:
```bash
cd backend
docker build -t chronetask-api .
docker run -d -p 5279:80 \
  -e ConnectionStrings__DefaultConnection="Host=tu-db;Database=chronetask;Username=postgres;Password=xxx" \
  -e JWT__SecretKey="tu-clave-secreta" \
  chronetask-api
```

#### Frontend:
```bash
cd frontend
docker build -t chronetask-frontend --build-arg VITE_API_URL=http://tu-api-url .
docker run -d -p 80:80 chronetask-frontend
```

---

## ☁️ Deployment en Plataformas Cloud

### Railway

1. **Conectar repositorio:**
   - Ve a [Railway.app](https://railway.app)
   - Conecta tu repositorio de GitHub

2. **Configurar servicios:**
   - **PostgreSQL**: Agrega un servicio PostgreSQL
   - **Backend**: Agrega servicio desde `backend/`
   - **Frontend**: Agrega servicio desde `frontend/`

3. **Variables de entorno (Backend):**
   ```
   ASPNETCORE_ENVIRONMENT=Production
   ConnectionStrings__DefaultConnection=${{Postgres.DATABASE_URL}}
   JWT__SecretKey=tu-clave-secreta-32-chars
   JWT__Issuer=ChroneTask
   JWT__Audience=ChroneTask
   ```

4. **Variables de entorno (Frontend):**
   ```
   VITE_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   ```

5. **Ejecutar migraciones:**
   ```bash
   railway run --service backend dotnet ef database update
   ```

### Render

1. **Backend:**
   - Tipo: Web Service
   - Build Command: `cd backend && dotnet restore && dotnet publish -c Release -o ./publish`
   - Start Command: `cd backend/publish && dotnet ChroneTask.Api.dll`
   - Variables de entorno: (igual que Railway)

2. **Frontend:**
   - Tipo: Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

3. **PostgreSQL:**
   - Agrega servicio PostgreSQL
   - Conecta con el backend usando la variable de entorno

### Azure

1. **Crear recursos:**
   ```bash
   az group create --name chronetask-rg --location eastus
   az postgres flexible-server create --resource-group chronetask-rg ...
   az webapp create --resource-group chronetask-rg --plan chronetask-plan ...
   ```

2. **Deploy Backend:**
   ```bash
   cd backend
   dotnet publish -c Release
   az webapp deploy --resource-group chronetask-rg --name chronetask-api --src-path ./publish
   ```

3. **Deploy Frontend:**
   - Usa Azure Static Web Apps o Azure Storage + CDN

### AWS (EC2 + RDS)

1. **Configurar RDS PostgreSQL**
2. **Crear EC2 para Backend**
3. **Usar S3 + CloudFront para Frontend**
4. **Configurar Security Groups**

---

## 🔐 Configuración de Variables de Entorno

### Backend (appsettings.Production.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=tu-host;Database=chronetask;Username=postgres;Password=xxx"
  },
  "JWT": {
    "SecretKey": "tu-clave-secreta-minimo-32-caracteres",
    "Issuer": "ChroneTask",
    "Audience": "ChroneTask",
    "ExpirationMinutes": 1440
  },
  "CORS": {
    "AllowedOrigins": ["https://tu-dominio.com"]
  }
}
```

### Frontend (.env.production)

```env
VITE_API_URL=https://api.tu-dominio.com
```

### Generar JWT Secret Key

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 🗄️ Migraciones de Base de Datos

### Opción 1: Durante el deployment
```bash
docker-compose exec backend dotnet ef database update
```

### Opción 2: Manualmente
```bash
cd backend/ChroneTask.Api
dotnet ef database update --connection "tu-connection-string"
```

### Opción 3: Script SQL
```bash
# Exportar migraciones a SQL
dotnet ef migrations script -o migrations.sql
# Luego ejecutar en tu base de datos
```

---

## ✅ Verificación Post-Deployment

### 1. Verificar Backend
```bash
curl https://tu-api.com/api/auth/health
# O visita: https://tu-api.com/swagger
```

### 2. Verificar Frontend
- Visita tu dominio
- Intenta hacer login
- Verifica que las peticiones API funcionen

### 3. Verificar Base de Datos
```bash
docker-compose exec postgres psql -U postgres -d chronetask -c "\dt"
```

### 4. Logs
```bash
# Docker
docker-compose logs -f

# Backend específico
docker-compose logs -f backend

# Frontend específico
docker-compose logs -f frontend
```

---

## 🔒 Seguridad en Producción

1. **Cambiar todas las contraseñas por defecto**
2. **Usar HTTPS (SSL/TLS)**
3. **Configurar CORS correctamente**
4. **Usar secretos seguros para JWT**
5. **Habilitar rate limiting**
6. **Configurar firewall**
7. **Backups regulares de la base de datos**

---

## 📝 Scripts Útiles

### build.sh (Linux/Mac)
```bash
#!/bin/bash
echo "Building ChroneTask..."
docker-compose build
docker-compose up -d
docker-compose exec backend dotnet ef database update
echo "Deployment complete!"
```

### deploy.ps1 (Windows)
```powershell
Write-Host "Building ChroneTask..."
docker-compose build
docker-compose up -d
docker-compose exec backend dotnet ef database update
Write-Host "Deployment complete!"
```

---

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Revisa la connection string
- Verifica firewall/security groups

### Error: "CORS policy"
- Actualiza `AllowedOrigins` en `appsettings.Production.json`
- Verifica que la URL del frontend esté incluida

### Error: "JWT token invalid"
- Verifica que `JWT__SecretKey` sea el mismo en todas las instancias
- Revisa la expiración del token

### Frontend muestra pantalla en blanco
- Verifica `VITE_API_URL` en el build
- Revisa la consola del navegador
- Verifica que el backend esté accesible

---

## 📞 Soporte

Si tienes problemas con el deployment, revisa:
1. Los logs de los contenedores
2. La configuración de variables de entorno
3. La conectividad de red
4. Los permisos de archivos

---

**¡Listo para producción! 🎉**
