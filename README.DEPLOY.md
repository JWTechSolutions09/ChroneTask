# 🚀 Quick Start - Deployment

## Deployment Rápido con Docker

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 2. Levantar servicios
docker-compose up -d --build

# 3. Ejecutar migraciones
docker-compose exec backend dotnet ef database update

# 4. Verificar
docker-compose ps
```

## URLs

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5279
- **Swagger**: http://localhost:5279/swagger
- **PostgreSQL**: localhost:5432

## Variables de Entorno Importantes

Edita `.env` antes de desplegar:

```env
POSTGRES_PASSWORD=tu-password-seguro
JWT_SECRET_KEY=tu-clave-secreta-minimo-32-caracteres
VITE_API_URL=http://localhost:5279
```

## Ver Logs

```bash
docker-compose logs -f
```

## Detener Servicios

```bash
docker-compose down
```

Para más detalles, ver [DEPLOYMENT.md](./DEPLOYMENT.md)
