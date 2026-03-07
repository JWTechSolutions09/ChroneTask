# Guía de Migración a Supabase

Esta guía te ayudará a migrar tu base de datos PostgreSQL de ChroneTask a Supabase.

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Paso 1: Crear Proyecto en Supabase](#paso-1-crear-proyecto-en-supabase)
3. [Paso 2: Exportar Datos de la Base de Datos Actual](#paso-2-exportar-datos-de-la-base-de-datos-actual)
4. [Paso 3: Importar Esquema a Supabase](#paso-3-importar-esquema-a-supabase)
5. [Paso 4: Importar Datos a Supabase](#paso-4-importar-datos-a-supabase)
6. [Paso 5: Configurar la Aplicación](#paso-5-configurar-la-aplicación)
7. [Paso 6: Verificar la Migración](#paso-6-verificar-la-migración)
8. [Troubleshooting](#troubleshooting)

---

## Prerrequisitos

- Cuenta en [Supabase](https://supabase.com)
- Acceso a tu base de datos PostgreSQL actual
- Herramientas instaladas:
  - `pg_dump` (incluido con PostgreSQL)
  - `psql` (incluido con PostgreSQL)
  - O herramientas GUI como pgAdmin, DBeaver, etc.

---

## Paso 1: Crear Proyecto en Supabase

1. **Crear cuenta en Supabase**
   - Ve a [https://supabase.com](https://supabase.com)
   - Crea una cuenta o inicia sesión

2. **Crear nuevo proyecto**
   - Haz clic en "New Project"
   - Completa la información:
     - **Name**: `ChroneTask` (o el nombre que prefieras)
     - **Database Password**: Genera una contraseña segura y **guárdala**
     - **Region**: Elige la región más cercana a tus usuarios
     - **Pricing Plan**: Elige el plan adecuado (Free tier es suficiente para empezar)

3. **Esperar a que se cree el proyecto** (2-3 minutos)

4. **Obtener credenciales de conexión**
   - Ve a **Settings** → **Database**
   - Anota la siguiente información:
     - **Host**: `db.xxxxx.supabase.co`
     - **Database name**: `postgres`
     - **Port**: `5432`
     - **User**: `postgres`
     - **Password**: La que configuraste al crear el proyecto
     - **Connection string**: Se encuentra en la sección "Connection string" → "URI"

---

## Paso 2: Exportar Datos de la Base de Datos Actual

### Opción A: Exportar usando pg_dump (Recomendado)

```bash
# Exportar solo el esquema (estructura)
pg_dump -h localhost -U postgres -d chronetask --schema-only -f schema.sql

# Exportar solo los datos
pg_dump -h localhost -U postgres -d chronetask --data-only -f data.sql

# Exportar todo (esquema + datos)
pg_dump -h localhost -U postgres -d chronetask -f full_backup.sql
```

**Nota**: Si tu base de datos está en otro servidor, reemplaza `localhost` con la dirección del servidor.

### Opción B: Exportar usando pgAdmin o DBeaver

1. Abre pgAdmin o DBeaver
2. Conéctate a tu base de datos
3. Click derecho en la base de datos → **Backup** o **Export**
4. Selecciona:
   - **Format**: Plain
   - **Encoding**: UTF8
   - **Exporta**: Schema + Data

---

## Paso 3: Importar Esquema a Supabase

### ⚡ Método Recomendado: Script Completo (MÁS FÁCIL)

**Si no puedes exportar tu base de datos antigua**, usa el script completo que crea toda la estructura:

1. **Abrir SQL Editor en Supabase**
   - Ve a tu proyecto en Supabase
   - Click en **SQL Editor** en el menú lateral

2. **Copiar y ejecutar el script completo**
   - Abre el archivo `backend/CREATE_COMPLETE_DATABASE_SCHEMA.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase
   - Click en **Run** o presiona `Ctrl+Enter`

   Este script crea:
   - ✅ Todas las 17 tablas
   - ✅ Todos los índices
   - ✅ Todas las foreign keys
   - ✅ La tabla de migraciones de Entity Framework
   - ✅ Es seguro ejecutarlo múltiples veces (idempotente)

3. **Verificar que se creó correctamente**
   - El script incluye consultas de verificación al final
   - Deberías ver un resumen de todas las tablas creadas

### Método Alternativo: Migraciones Individuales

Si prefieres ejecutar las migraciones paso a paso:

1. **Abrir SQL Editor en Supabase**
   - Ve a tu proyecto en Supabase
   - Click en **SQL Editor** en el menú lateral

2. **Ejecutar migraciones en orden**

   Primero, ejecuta las migraciones base:

   ```sql
   -- Migración inicial: Organizations
   CREATE TABLE IF NOT EXISTS "Organizations" (
       "Id" UUID NOT NULL,
       "Name" VARCHAR(120) NOT NULL,
       "Slug" VARCHAR(80) NULL,
       "IsActive" BOOLEAN NOT NULL,
       "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
       CONSTRAINT "PK_Organizations" PRIMARY KEY ("Id")
   );

   CREATE UNIQUE INDEX IF NOT EXISTS "IX_Organizations_Slug" 
   ON "Organizations" ("Slug") 
   WHERE "Slug" IS NOT NULL;
   ```

   ```sql
   -- Migración: Users
   CREATE TABLE IF NOT EXISTS "Users" (
       "Id" UUID NOT NULL,
       "FullName" VARCHAR(120) NOT NULL,
       "Email" VARCHAR(150) NOT NULL,
       "PasswordHash" TEXT NOT NULL,
       "ProfilePictureUrl" TEXT NULL,
       "UsageType" VARCHAR(20) NULL,
       "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
       CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
   );

   CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
   ```

   Continúa con el resto de las tablas. Puedes usar el archivo `schema.sql` exportado o ejecutar las migraciones de Entity Framework.

### Método 2: Usando psql desde la terminal

```bash
# Conectarte a Supabase
psql "postgresql://postgres:[TU_PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Importar el esquema
\i schema.sql
```

### Método 3: Usando el archivo de migración completo

Si exportaste todo con `pg_dump`, puedes importarlo directamente:

```bash
psql "postgresql://postgres:[TU_PASSWORD]@db.xxxxx.supabase.co:5432/postgres" < full_backup.sql
```

**⚠️ IMPORTANTE**: Antes de importar, revisa el archivo SQL y elimina o comenta las siguientes líneas si existen:
- `CREATE EXTENSION` (Supabase ya tiene las extensiones necesarias)
- Comandos relacionados con roles/usuarios (Supabase maneja esto automáticamente)

---

## Paso 4: Importar Datos a Supabase

### Si exportaste datos por separado:

```bash
psql "postgresql://postgres:[TU_PASSWORD]@db.xxxxx.supabase.co:5432/postgres" < data.sql
```

### Si usas el SQL Editor:

1. Abre el archivo `data.sql`
2. Copia el contenido
3. Pégalo en el SQL Editor de Supabase
4. Ejecuta el script

**Nota**: Si tienes muchos datos, considera importarlos en lotes para evitar timeouts.

---

## Paso 5: Configurar la Aplicación

### 5.1 Obtener Connection String de Supabase

En Supabase, ve a **Settings** → **Database** → **Connection string** → **URI**

El formato será:
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 5.2 Actualizar appsettings.json

**Para desarrollo local:**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.xxxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=[TU_PASSWORD];SSL Mode=Require;Trust Server Certificate=true"
  }
}
```

**Para producción (usando variables de entorno):**

El código ya está preparado para usar `DATABASE_URL` o el formato URI de PostgreSQL. Puedes configurar:

```bash
# Variable de entorno
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

O en `appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=${POSTGRES_HOST};Port=5432;Database=postgres;Username=postgres;Password=${POSTGRES_PASSWORD};SSL Mode=Require;Trust Server Certificate=true"
  }
}
```

Y configurar las variables:
- `POSTGRES_HOST=db.xxxxx.supabase.co`
- `POSTGRES_PASSWORD=[TU_PASSWORD]`

### 5.3 Verificar que la aplicación se conecta

Ejecuta la aplicación y verifica en los logs que se conecta correctamente:

```
✅ Connection string construida desde DATABASE_URL
🔗 Usando base de datos: postgres
🔄 Aplicando migraciones de base de datos...
✅ Migraciones aplicadas correctamente
```

---

## Paso 6: Verificar la Migración

### 6.1 Verificar tablas en Supabase

1. Ve a **Table Editor** en Supabase
2. Verifica que todas las tablas estén presentes:
   - Organizations
   - Users
   - OrganizationMembers
   - OrganizationInvitations
   - Projects
   - ProjectMembers
   - Tasks
   - TimeEntries
   - ProjectComments
   - TaskComments
   - CommentAttachments
   - CommentReactions
   - Notifications
   - ProjectNotes
   - PersonalNotes
   - PersonalCalendarEvents
   - __EFMigrationsHistory

### 6.2 Verificar datos

Ejecuta algunas consultas en el SQL Editor:

```sql
-- Verificar conteo de registros
SELECT 
    'Organizations' as tabla, COUNT(*) as registros FROM "Organizations"
UNION ALL
SELECT 'Users', COUNT(*) FROM "Users"
UNION ALL
SELECT 'Projects', COUNT(*) FROM "Projects"
UNION ALL
SELECT 'Tasks', COUNT(*) FROM "Tasks";
```

### 6.3 Probar la aplicación

1. Inicia la aplicación
2. Intenta hacer login
3. Verifica que puedas:
   - Ver proyectos
   - Crear tareas
   - Ver notificaciones
   - Etc.

---

## Troubleshooting

### Error: "SSL connection required"

**Solución**: Asegúrate de incluir `SSL Mode=Require` en la connection string:

```
Host=db.xxxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=[PASSWORD];SSL Mode=Require;Trust Server Certificate=true
```

### Error: "password authentication failed"

**Solución**: 
- Verifica que la contraseña sea correcta
- Asegúrate de usar el usuario `postgres` (no otros usuarios)
- Si olvidaste la contraseña, puedes resetearla en Supabase: Settings → Database → Reset database password

### Error: "relation does not exist"

**Solución**: 
- Verifica que todas las tablas se hayan creado correctamente
- Ejecuta las migraciones de Entity Framework: la aplicación las ejecutará automáticamente al iniciar
- O ejecuta manualmente los scripts SQL de migración

### Error: "timeout" al importar datos grandes

**Solución**:
- Importa los datos en lotes más pequeños
- Usa `psql` desde la terminal en lugar del SQL Editor
- Considera usar la herramienta de importación de Supabase

### Las migraciones de Entity Framework no se aplican

**Solución**:
- Verifica que la tabla `__EFMigrationsHistory` exista
- Si no existe, créala:

```sql
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" VARCHAR(150) NOT NULL,
    "ProductVersion" VARCHAR(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);
```

- Luego inserta las migraciones existentes o deja que Entity Framework las cree automáticamente

### Problemas con caracteres especiales o encoding

**Solución**:
- Asegúrate de exportar con encoding UTF8
- Verifica que Supabase esté usando UTF8 (por defecto lo usa)

---

## Checklist Final

- [ ] Proyecto creado en Supabase
- [ ] Credenciales de conexión guardadas de forma segura
- [ ] Esquema exportado de la base de datos actual
- [ ] Esquema importado a Supabase
- [ ] Datos exportados de la base de datos actual
- [ ] Datos importados a Supabase
- [ ] Connection string actualizado en la aplicación
- [ ] Aplicación se conecta correctamente
- [ ] Todas las tablas están presentes
- [ ] Datos verificados (conteos correctos)
- [ ] Aplicación funciona correctamente (login, crear tareas, etc.)
- [ ] Migraciones de Entity Framework aplicadas

---

## Notas Adicionales

### Extensiones de PostgreSQL en Supabase

Supabase incluye automáticamente extensiones comunes. Si necesitas alguna específica, puedes habilitarla desde el SQL Editor:

```sql
-- Ejemplo: habilitar uuid-ossp (ya está habilitado por defecto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Row Level Security (RLS)

Supabase tiene Row Level Security habilitado por defecto. Si planeas usarlo, necesitarás configurar políticas. Por ahora, puedes deshabilitarlo para tablas específicas si es necesario:

```sql
ALTER TABLE "Users" DISABLE ROW LEVEL SECURITY;
```

### Backups Automáticos

Supabase realiza backups automáticos según tu plan:
- **Free tier**: Backups diarios (7 días de retención)
- **Pro tier**: Backups más frecuentes y mayor retención

### Límites del Free Tier

- **Database size**: 500 MB
- **Bandwidth**: 5 GB/mes
- **API requests**: 50,000/mes

Asegúrate de que tu aplicación no exceda estos límites.

---

## Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs de Supabase: **Logs** → **Database**
2. Revisa los logs de tu aplicación
3. Consulta la [documentación de Supabase](https://supabase.com/docs)
4. Verifica el [status de Supabase](https://status.supabase.com)

---

## Próximos Pasos

Una vez completada la migración:

1. **Actualizar variables de entorno** en producción
2. **Probar exhaustivamente** todas las funcionalidades
3. **Configurar monitoreo** en Supabase
4. **Configurar backups** adicionales si es necesario
5. **Documentar** la nueva configuración para el equipo

---

**¡Migración completada! 🎉**

