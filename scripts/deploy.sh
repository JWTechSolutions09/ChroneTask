#!/bin/bash

# Script de deployment para ChroneTask
# Uso: ./scripts/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Iniciando deployment a $ENVIRONMENT..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    exit 1
fi

# Verificar que existe .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado. Creando desde .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Por favor, edita .env con tus valores de producción${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-requisitos verificados${NC}"

# Build de imágenes
echo -e "${YELLOW}📦 Construyendo imágenes Docker...${NC}"
docker-compose build --no-cache

# Detener contenedores existentes
echo -e "${YELLOW}🛑 Deteniendo contenedores existentes...${NC}"
docker-compose down

# Levantar servicios
echo -e "${YELLOW}🚀 Levantando servicios...${NC}"
docker-compose up -d

# Esperar a que PostgreSQL esté listo
echo -e "${YELLOW}⏳ Esperando a que PostgreSQL esté listo...${NC}"
sleep 10

# Ejecutar migraciones
echo -e "${YELLOW}🗄️  Ejecutando migraciones de base de datos...${NC}"
docker-compose exec -T backend dotnet ef database update --project ChroneTask.Api || {
    echo -e "${RED}❌ Error ejecutando migraciones${NC}"
    echo -e "${YELLOW}💡 Intenta ejecutar manualmente: docker-compose exec backend dotnet ef database update${NC}"
}

# Verificar servicios
echo -e "${YELLOW}🔍 Verificando servicios...${NC}"
docker-compose ps

echo -e "${GREEN}✅ Deployment completado!${NC}"
echo -e "${GREEN}🌐 Frontend: http://localhost${NC}"
echo -e "${GREEN}🔌 Backend: http://localhost:5279${NC}"
echo -e "${GREEN}📊 Swagger: http://localhost:5279/swagger${NC}"

echo -e "${YELLOW}📝 Para ver logs: docker-compose logs -f${NC}"
