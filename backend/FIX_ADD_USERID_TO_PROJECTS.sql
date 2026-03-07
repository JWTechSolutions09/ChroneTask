-- Script para agregar la columna UserId a la tabla Projects si no existe
-- Ejecutar este script en Supabase

-- 1. Verificar si la columna UserId existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND column_name = 'UserId'
AND table_schema = 'public';

-- 2. Agregar la columna UserId si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Projects' 
        AND column_name = 'UserId'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Projects"
        ADD COLUMN "UserId" UUID NULL;
        
        RAISE NOTICE 'Columna UserId agregada a la tabla Projects';
    ELSE
        RAISE NOTICE 'La columna UserId ya existe en la tabla Projects';
    END IF;
END $$;

-- 3. Crear índice para UserId si no existe
CREATE INDEX IF NOT EXISTS "IX_Projects_UserId" 
ON "Projects" ("UserId");

-- 4. Agregar foreign key para UserId si no existe
-- Usar una verificación más simple que no dependa de regclass
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'FK_Projects_Users_UserId'
        AND tc.table_name = 'Projects'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE "Projects"
        ADD CONSTRAINT "FK_Projects_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key FK_Projects_Users_UserId agregada';
    ELSE
        RAISE NOTICE 'Foreign key FK_Projects_Users_UserId ya existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al agregar foreign key: %', SQLERRM;
END $$;

-- 5. Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND table_schema = 'public'
AND column_name IN ('UserId', 'OrganizationId')
ORDER BY column_name;
