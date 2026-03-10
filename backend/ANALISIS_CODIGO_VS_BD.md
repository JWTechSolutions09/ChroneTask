# Análisis Completo: Código vs Base de Datos

## Función: CreatePersonalProject

### Flujo Completo del Código

1. **Validación de ModelState**
   - Valida que el request sea válido
   - Retorna BadRequest si hay errores

2. **Obtener UserId del Token JWT**
   - `UserContext.GetUserId(User)` - Extrae el userId del token JWT
   - Si falla, lanza `UnauthorizedAccessException`

3. **Verificar que el Usuario Existe**
   - Query: `SELECT * FROM "Users" WHERE "Id" = @userId`
   - Tabla requerida: `Users`
   - Columna requerida: `Users.Id` (UUID, NOT NULL, PRIMARY KEY)
   - Si no existe, retorna NotFound

4. **Validar Nombre del Proyecto**
   - Valida que `request.Name` no esté vacío
   - Retorna BadRequest si está vacío

5. **Crear Entidad Project**
   ```csharp
   new Project {
       Id = Guid.NewGuid(),                    // UUID, NOT NULL, PRIMARY KEY
       Name = request.Name.Trim(),             // VARCHAR(120), NOT NULL
       Description = request.Description?.Trim(), // VARCHAR(500), NULL
       OrganizationId = null,                  // UUID, NULL
       UserId = userId,                        // UUID, NULL (pero se asigna)
       Template = request.Template?.Trim(),    // VARCHAR(50), NULL
       ImageUrl = request.ImageUrl,            // TEXT, NULL
       SlaHours = request.SlaHours,           // INTEGER, NULL
       SlaWarningThreshold = request.SlaWarningThreshold, // INTEGER, NULL
       IsActive = true,                        // BOOLEAN, NOT NULL
       CreatedAt = DateTime.UtcNow            // TIMESTAMP WITH TIME ZONE, NOT NULL
   }
   ```

6. **Agregar Project a DbContext**
   - `_db.Projects.Add(project)`
   - Esto prepara un INSERT en la tabla `Projects`

7. **Crear Entidad ProjectMember**
   ```csharp
   new ProjectMember {
       Id = Guid.NewGuid(),                    // UUID, NOT NULL, PRIMARY KEY
       ProjectId = projectId,                  // UUID, NOT NULL, FOREIGN KEY -> Projects.Id
       UserId = userId,                        // UUID, NOT NULL, FOREIGN KEY -> Users.Id
       Role = "pm",                            // TEXT, NOT NULL
       JoinedAt = DateTime.UtcNow              // TIMESTAMP WITH TIME ZONE, NOT NULL
   }
   ```

8. **Agregar ProjectMember a DbContext**
   - `_db.ProjectMembers.Add(projectMember)`
   - Esto prepara un INSERT en la tabla `ProjectMembers`

9. **Guardar Cambios (SaveChangesAsync)**
   - Ejecuta ambos INSERTs en una transacción
   - Si alguno falla, ambos se revierten

10. **Crear Notificación (opcional, no crítico)**
    - Llama a `NotificationHelper.CreateNotificationAsync`
    - Si falla, solo se loguea el error, no afecta la respuesta

## Requisitos de Base de Datos

### Tabla: Projects

**Columnas Requeridas:**
- `Id` (UUID, NOT NULL, PRIMARY KEY)
- `Name` (VARCHAR(120), NOT NULL)
- `Description` (VARCHAR(500), NULL)
- `OrganizationId` (UUID, NULL)
- `UserId` (UUID, NULL) ⚠️ **CRÍTICO: Esta columna debe existir**
- `Template` (VARCHAR(50), NULL)
- `ImageUrl` (TEXT, NULL)
- `IsActive` (BOOLEAN, NOT NULL)
- `CreatedAt` (TIMESTAMP WITH TIME ZONE, NOT NULL)
- `UpdatedAt` (TIMESTAMP WITH TIME ZONE, NULL)
- `SlaHours` (INTEGER, NULL)
- `SlaWarningThreshold` (INTEGER, NULL)

**Índices Requeridos:**
- `IX_Projects_OrganizationId` (INDEX en OrganizationId)
- `IX_Projects_UserId` (INDEX en UserId) ⚠️ **CRÍTICO**

**Foreign Keys Requeridas:**
- `FK_Projects_Users_UserId` (FOREIGN KEY UserId -> Users.Id, ON DELETE CASCADE) ⚠️ **CRÍTICO**
- `FK_Projects_Organizations_OrganizationId` (FOREIGN KEY OrganizationId -> Organizations.Id, ON DELETE CASCADE)

### Tabla: ProjectMembers

**Columnas Requeridas:**
- `Id` (UUID, NOT NULL, PRIMARY KEY)
- `ProjectId` (UUID, NOT NULL, FOREIGN KEY -> Projects.Id)
- `UserId` (UUID, NOT NULL, FOREIGN KEY -> Users.Id)
- `Role` (TEXT, NOT NULL)
- `JoinedAt` (TIMESTAMP WITH TIME ZONE, NOT NULL)

**Índices Requeridos:**
- `IX_ProjectMembers_ProjectId_UserId` (UNIQUE INDEX en (ProjectId, UserId)) ⚠️ **CRÍTICO: Evita duplicados**
- `IX_ProjectMembers_UserId` (INDEX en UserId)

**Foreign Keys Requeridas:**
- `FK_ProjectMembers_Projects_ProjectId` (FOREIGN KEY ProjectId -> Projects.Id, ON DELETE CASCADE)
- `FK_ProjectMembers_Users_UserId` (FOREIGN KEY UserId -> Users.Id, ON DELETE RESTRICT)

### Tabla: Users

**Columnas Requeridas:**
- `Id` (UUID, NOT NULL, PRIMARY KEY) ⚠️ **CRÍTICO: Debe existir para la foreign key**

### Tabla: Notifications (opcional, no crítico)

**Columnas Requeridas (si se crea notificación):**
- `Id` (UUID, NOT NULL, PRIMARY KEY)
- `UserId` (UUID, NOT NULL, FOREIGN KEY -> Users.Id)
- `ProjectId` (UUID, NULL, FOREIGN KEY -> Projects.Id)
- `Type` (VARCHAR(50), NOT NULL)
- `Title` (VARCHAR(200), NULL)
- `Message` (VARCHAR(1000), NULL)
- `IsRead` (BOOLEAN, NOT NULL, default: false)
- `CreatedAt` (TIMESTAMP WITH TIME ZONE, NOT NULL)

## Posibles Errores y Causas

### Error 500 - Database Error

**Causa 1: Columna UserId no existe en Projects**
- Error: `column "UserId" does not exist`
- Solución: Ejecutar `FIX_ADD_USERID_TO_PROJECTS.sql`

**Causa 2: Foreign Key FK_Projects_Users_UserId no existe**
- Error: `foreign key constraint "FK_Projects_Users_UserId" does not exist`
- Solución: Ejecutar `FIX_ADD_USERID_TO_PROJECTS.sql`

**Causa 3: Índice único violado en ProjectMembers**
- Error: `duplicate key value violates unique constraint "IX_ProjectMembers_ProjectId_UserId"`
- Causa: Ya existe un ProjectMember con el mismo ProjectId y UserId
- Solución: Verificar si ya existe antes de crear

**Causa 4: Foreign Key violation en ProjectMembers**
- Error: `insert or update on table "ProjectMembers" violates foreign key constraint`
- Causa: El ProjectId o UserId no existe en las tablas referenciadas
- Solución: Verificar que el proyecto y usuario existan

**Causa 5: Valor NULL en columna NOT NULL**
- Error: `null value in column "X" violates not-null constraint`
- Causa: Alguna columna requerida está recibiendo NULL
- Solución: Verificar que todos los valores requeridos estén asignados

**Causa 6: Tipo de dato incorrecto**
- Error: `invalid input syntax for type uuid` o similar
- Causa: Se está intentando insertar un valor de tipo incorrecto
- Solución: Verificar que los tipos coincidan

## Checklist de Verificación

Ejecuta `GET_COMPLETE_DATABASE_SCHEMA.sql` y verifica:

- [ ] Tabla `Projects` existe
- [ ] Columna `Projects.UserId` existe y es UUID, NULL
- [ ] Índice `IX_Projects_UserId` existe
- [ ] Foreign Key `FK_Projects_Users_UserId` existe
- [ ] Tabla `ProjectMembers` existe
- [ ] Todas las columnas de `ProjectMembers` existen
- [ ] Índice único `IX_ProjectMembers_ProjectId_UserId` existe
- [ ] Foreign Keys de `ProjectMembers` existen
- [ ] Tabla `Users` existe
- [ ] Columna `Users.Id` existe y es UUID, NOT NULL, PRIMARY KEY

## Próximos Pasos

1. Ejecutar `GET_COMPLETE_DATABASE_SCHEMA.sql` en Supabase
2. Compartir todos los resultados
3. Comparar con este análisis
4. Identificar qué falta o está mal
5. Crear script de corrección específico
