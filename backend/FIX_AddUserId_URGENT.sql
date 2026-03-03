-- ⚠️ EJECUTAR ESTE SCRIPT MANUALMENTE EN LA BASE DE DATOS DE PRODUCCIÓN ⚠️
-- Este script agrega la columna UserId que falta en la tabla Projects

-- 1. Agregar columna UserId (si no existe)
ALTER TABLE "Projects" 
ADD COLUMN IF NOT EXISTS "UserId" UUID NULL;

-- 2. Crear índice (si no existe)
CREATE INDEX IF NOT EXISTS "IX_Projects_UserId" ON "Projects" ("UserId");

-- 3. Agregar foreign key (si no existe)
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
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Projects' 
        AND column_name = 'OrganizationId' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "Projects" 
        ALTER COLUMN "OrganizationId" DROP NOT NULL;
    END IF;
END $$;

-- 5. Registrar la migración en la tabla __EFMigrationsHistory (IMPORTANTE)
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260303000000_AddPersonalProjects', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Verificar que todo se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND column_name IN ('UserId', 'OrganizationId')
ORDER BY column_name;
