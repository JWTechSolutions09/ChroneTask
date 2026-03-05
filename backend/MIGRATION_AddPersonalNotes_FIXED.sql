-- ⚠️ EJECUTAR ESTE SCRIPT MANUALMENTE EN LA BASE DE DATOS ⚠️
-- Migración para agregar soporte de notas personales
-- Este script es seguro de ejecutar múltiples veces (idempotente)

-- 1. Crear tabla PersonalNotes (si no existe)
CREATE TABLE IF NOT EXISTS "PersonalNotes" (
    "Id" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Title" VARCHAR(500) NULL,
    "Content" VARCHAR(5000) NULL,
    "Color" VARCHAR(20) NULL,
    "PositionX" DOUBLE PRECISION NULL,
    "PositionY" DOUBLE PRECISION NULL,
    "Width" DOUBLE PRECISION NULL,
    "Height" DOUBLE PRECISION NULL,
    "CanvasData" TEXT NULL,
    "ImageUrl" TEXT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT "PK_PersonalNotes" PRIMARY KEY ("Id")
);

-- 2. Crear índice para UserId (si no existe)
CREATE INDEX IF NOT EXISTS "IX_PersonalNotes_UserId" ON "PersonalNotes" ("UserId");

-- 3. Agregar foreign key para UserId (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_PersonalNotes_Users_UserId'
    ) THEN
        ALTER TABLE "PersonalNotes"
        ADD CONSTRAINT "FK_PersonalNotes_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Verificar que la tabla se creó correctamente
SELECT 
    'Tabla PersonalNotes creada correctamente' AS status,
    COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'PersonalNotes';

-- 5. Mostrar estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'PersonalNotes'
ORDER BY ordinal_position;
