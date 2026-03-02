-- Migration: Add UsageType column to Users table
-- Run this SQL script on your database to add the UsageType field

-- For PostgreSQL
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "UsageType" VARCHAR(20) NULL;

-- For SQL Server (uncomment if using SQL Server)
-- ALTER TABLE [Users] ADD [UsageType] NVARCHAR(20) NULL;

-- For SQLite (uncomment if using SQLite)
-- ALTER TABLE Users ADD COLUMN UsageType TEXT NULL;

-- Optional: Update existing users to have a default value
-- UPDATE "Users" SET "UsageType" = 'business' WHERE "UsageType" IS NULL;
