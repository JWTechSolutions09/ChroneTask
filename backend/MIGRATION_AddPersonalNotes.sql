-- Migración para agregar soporte de notas personales
-- Ejecutar este script en la base de datos si la migración de Entity Framework no se ejecuta automáticamente

-- Crear tabla PersonalNotes
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
    "CanvasData" VARCHAR(10000) NULL,
    "ImageUrl" VARCHAR(1000) NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT "PK_PersonalNotes" PRIMARY KEY ("Id")
);

-- Crear índice para UserId
CREATE INDEX IF NOT EXISTS "IX_PersonalNotes_UserId" ON "PersonalNotes" ("UserId");

-- Agregar foreign key para UserId
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

-- Verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'PersonalNotes'
ORDER BY ordinal_position;
