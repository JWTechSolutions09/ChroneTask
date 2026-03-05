-- Migration: Update User ProfilePictureUrl column to TEXT
-- Description: Changes ProfilePictureUrl from VARCHAR(500) to TEXT to support base64 images

-- Alter ProfilePictureUrl column to TEXT
ALTER TABLE IF EXISTS "Users" 
ALTER COLUMN "ProfilePictureUrl" TYPE TEXT;

-- Add comment
COMMENT ON COLUMN "Users"."ProfilePictureUrl" IS 'Profile picture URL or base64 encoded image data (no length limit)';
