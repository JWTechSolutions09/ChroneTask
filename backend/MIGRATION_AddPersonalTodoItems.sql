-- Migration: Add PersonalTodoItems table
-- Description: Creates table for personal todo items in personal use mode

-- Create PersonalTodoItems table
CREATE TABLE IF NOT EXISTS "PersonalTodoItems" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL,
    "Title" VARCHAR(500) NOT NULL,
    "Description" VARCHAR(2000) NULL,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "DueDate" TIMESTAMP NULL,
    "Priority" VARCHAR(20) NULL,
    "Color" VARCHAR(20) NULL,
    "Order" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CompletedAt" TIMESTAMP NULL,
    "UpdatedAt" TIMESTAMP NULL,
    CONSTRAINT "FK_PersonalTodoItems_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IX_PersonalTodoItems_UserId_DueDate" ON "PersonalTodoItems" ("UserId", "DueDate");
CREATE INDEX IF NOT EXISTS "IX_PersonalTodoItems_UserId_IsCompleted" ON "PersonalTodoItems" ("UserId", "IsCompleted");
CREATE INDEX IF NOT EXISTS "IX_PersonalTodoItems_UserId_Order" ON "PersonalTodoItems" ("UserId", "Order");

-- Add comments
COMMENT ON TABLE "PersonalTodoItems" IS 'Personal todo items for users in personal mode';
COMMENT ON COLUMN "PersonalTodoItems"."DueDate" IS 'Optional due date for the todo item';
COMMENT ON COLUMN "PersonalTodoItems"."Priority" IS 'Priority level: low, medium, high';
COMMENT ON COLUMN "PersonalTodoItems"."Order" IS 'Display order for sorting items';
