-- Migration: Update Project ImageUrl column to TEXT
-- Description: Changes ImageUrl from VARCHAR(500) to TEXT to support base64 images

-- Alter ImageUrl column to TEXT
ALTER TABLE IF EXISTS "Projects" 
ALTER COLUMN "ImageUrl" TYPE TEXT;

-- Add comment
COMMENT ON COLUMN "Projects"."ImageUrl" IS 'Image URL or base64 encoded image data (no length limit)';
