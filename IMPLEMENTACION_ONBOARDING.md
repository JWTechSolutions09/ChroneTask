# Implementación de Sistema de Onboarding y Tipos de Uso

## Resumen
Se ha implementado un sistema completo de onboarding que permite a los usuarios seleccionar su tipo de uso del sistema: Personal, Equipo o Empresarial. Esto afecta directamente la navegación y estructura del frontend.

## Cambios en el Backend

### 1. Entidad User (`Entities/User.cs`)
- ✅ Agregado campo `UsageType` (string, nullable, max 20 caracteres)
- Valores posibles: "personal", "team", "business"

### 2. DTOs
- ✅ `UserProfileResponse.cs`: Agregado campo `UsageType`
- ✅ `UpdateUsageTypeRequest.cs`: Nuevo DTO para actualizar el tipo de uso

### 3. UserController
- ✅ `GET /api/users/me`: Ahora devuelve `UsageType` en la respuesta
- ✅ `PATCH /api/users/me/usage-type`: Nuevo endpoint para actualizar el tipo de uso
  - Valida que el tipo sea uno de: "personal", "team", "business"
  - Retorna el perfil actualizado

### 4. Configuración JSON
- ✅ Agregada configuración para usar camelCase en JSON (compatible con frontend)

### 5. Migración de Base de Datos
- ✅ Creado script SQL: `MIGRATION_AddUsageType.sql`
- Ejecutar el script SQL en la base de datos para agregar la columna `UsageType`

## Cambios en el Frontend

### 1. Nueva Página: Onboarding (`pages/Onboarding.tsx`)
- ✅ Pantalla interactiva con 3 opciones de selección
- ✅ Diseño moderno con cards seleccionables
- ✅ Guarda la selección y redirige según el tipo:
  - Personal → `/personal/projects`
  - Equipo → `/teams`
  - Empresarial → `/org-select`

### 2. Hook: `useUserUsageType` (`hooks/useUserUsageType.ts`)
- ✅ Hook para obtener el tipo de uso del usuario desde el perfil
- ✅ Maneja estados de carga

### 3. Layout Adaptativo (`components/Layout.tsx`)
- ✅ Se adapta según el tipo de uso:
  - **Personal**: Solo muestra "Mis Proyectos", sin organizaciones
  - **Equipo**: Muestra "Equipos" en lugar de "Organizaciones"
  - **Empresarial**: Mantiene el comportamiento actual

### 4. Flujo de Registro (`pages/Auth.tsx`)
- ✅ Después del registro, redirige a `/onboarding` en lugar de `/org-select`

### 5. Rutas (`App.tsx`)
- ✅ `/onboarding` - Pantalla de selección de tipo
- ✅ `/teams` - Para modo equipo
- ✅ `/personal/projects` - Para modo personal

## Pasos para Completar la Implementación

### 1. Ejecutar Migración de Base de Datos
```sql
-- Para PostgreSQL
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "UsageType" VARCHAR(20) NULL;
```

### 2. Reiniciar el Backend
- El backend detectará automáticamente el nuevo campo en la entidad User

### 3. Probar el Flujo
1. Registrar un nuevo usuario
2. Debería redirigir a `/onboarding`
3. Seleccionar un tipo de uso
4. Verificar que la navegación se adapte según el tipo seleccionado

## Notas Importantes

- Los usuarios existentes tendrán `UsageType = null` hasta que completen el onboarding
- El Layout maneja el caso cuando `UsageType` es null mostrando el modo empresarial por defecto
- El tipo de uso se puede cambiar más tarde desde configuración (pendiente de implementar)

## Próximos Pasos Sugeridos

1. Agregar opción en Settings para cambiar el tipo de uso
2. Implementar lógica específica para modo Personal (proyectos sin organización)
3. Implementar lógica específica para modo Equipo (equipos en lugar de organizaciones)
4. Agregar validaciones adicionales según el tipo de uso
