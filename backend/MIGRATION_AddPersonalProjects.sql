-- Migración para agregar soporte de proyectos personales
-- Ejecutar este script en la base de datos si la migración de Entity Framework no se ejecuta automáticamente

-- 1. Agregar columna UserId a la tabla Projects (si no existe)
ALTER TABLE "Projects" 
ADD COLUMN IF NOT EXISTS "UserId" UUID NULL;

-- 2. Crear índice para UserId (si no existe)
CREATE INDEX IF NOT EXISTS "IX_Projects_UserId" ON "Projects" ("UserId");

-- 3. Agregar foreign key para UserId (si no existe)
-- Nota: Esto puede fallar si ya existe, en ese caso ignorar el error
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Projects_Users_UserId'
    ) THEN
        ALTER TABLE "Projects"
        ADD CONSTRAINT "FK_Projects_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Hacer OrganizationId nullable (si no es nullable ya)
-- Nota: Esto puede fallar si hay proyectos sin OrganizationId y la columna ya es nullable
DO $$
BEGIN
    -- Verificar si la columna es NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Projects' 
        AND column_name = 'OrganizationId' 
        AND is_nullable = 'NO'
    ) THEN
        -- Primero, asegurarse de que todos los proyectos existentes tengan un OrganizationId
        -- (solo si hay proyectos sin OrganizationId)
        UPDATE "Projects" 
        SET "OrganizationId" = (SELECT "Id" FROM "Organizations" LIMIT 1)
        WHERE "OrganizationId" IS NULL;
        
        -- Luego hacer la columna nullable
        ALTER TABLE "Projects" 
        ALTER COLUMN "OrganizationId" DROP NOT NULL;
    END IF;
END $$;

-- Verificar que los cambios se aplicaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND column_name IN ('UserId', 'OrganizationId')
ORDER BY column_name;
