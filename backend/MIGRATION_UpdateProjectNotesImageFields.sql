-- Migración para actualizar los campos ImageUrl y CanvasData en ProjectNotes
-- para soportar imágenes base64 grandes (cambiar de VARCHAR a TEXT)

-- Actualizar ImageUrl a TEXT
ALTER TABLE "ProjectNotes" 
ALTER COLUMN "ImageUrl" TYPE TEXT;

-- Actualizar CanvasData a TEXT
ALTER TABLE "ProjectNotes" 
ALTER COLUMN "CanvasData" TYPE TEXT;

-- Verificar que los cambios se aplicaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ProjectNotes' 
AND column_name IN ('ImageUrl', 'CanvasData')
ORDER BY column_name;
