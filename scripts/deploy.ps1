# Script de deployment para ChroneTask (Windows PowerShell)
# Uso: .\scripts\deploy.ps1 [production|staging]

param(
    [string]$Environment = "production"
)

Write-Host "🚀 Iniciando deployment a $Environment..." -ForegroundColor Cyan

# Verificar Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar .env
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Archivo .env no encontrado. Creando desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Por favor, edita .env con tus valores de producción" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Pre-requisitos verificados" -ForegroundColor Green

# Build de imágenes
Write-Host "📦 Construyendo imágenes Docker..." -ForegroundColor Yellow
docker-compose build --no-cache

# Detener contenedores existentes
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose down

# Levantar servicios
Write-Host "🚀 Levantando servicios..." -ForegroundColor Yellow
docker-compose up -d

# Esperar a que PostgreSQL esté listo
Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Ejecutar migraciones
Write-Host "🗄️  Ejecutando migraciones de base de datos..." -ForegroundColor Yellow
try {
    docker-compose exec -T backend dotnet ef database update --project ChroneTask.Api
    Write-Host "✅ Migraciones ejecutadas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error ejecutando migraciones" -ForegroundColor Red
    Write-Host "💡 Intenta ejecutar manualmente: docker-compose exec backend dotnet ef database update" -ForegroundColor Yellow
}

# Verificar servicios
Write-Host "🔍 Verificando servicios..." -ForegroundColor Yellow
docker-compose ps

Write-Host "✅ Deployment completado!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost" -ForegroundColor Green
Write-Host "🔌 Backend: http://localhost:5279" -ForegroundColor Green
Write-Host "📊 Swagger: http://localhost:5279/swagger" -ForegroundColor Green
Write-Host "📝 Para ver logs: docker-compose logs -f" -ForegroundColor Yellow
