-- ============================================================================
-- SCRIPT COMPLETO DE CREACIÓN DE BASE DE DATOS - CHRONETASK
-- ============================================================================
-- Este script crea TODAS las tablas, índices, foreign keys y la estructura
-- completa de la base de datos ChroneTask.
-- 
-- Es seguro ejecutarlo múltiples veces (idempotente).
-- Ejecutar en Supabase SQL Editor o con psql.
-- ============================================================================

-- ============================================================================
-- 1. TABLA: Organizations
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Organizations" (
    "Id" UUID NOT NULL,
    "Name" VARCHAR(120) NOT NULL,
    "Slug" VARCHAR(80) NULL,
    "IsActive" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_Organizations" PRIMARY KEY ("Id")
);

-- Índice único para Slug
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Organizations_Slug" 
ON "Organizations" ("Slug") 
WHERE "Slug" IS NOT NULL;

-- ============================================================================
-- 2. TABLA: Users
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID NOT NULL,
    "FullName" VARCHAR(120) NOT NULL,
    "Email" VARCHAR(150) NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "ProfilePictureUrl" TEXT NULL,
    "UsageType" VARCHAR(20) NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

-- Índice único para Email
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");

-- ============================================================================
-- 3. TABLA: OrganizationMembers
-- ============================================================================
CREATE TABLE IF NOT EXISTS "OrganizationMembers" (
    "Id" UUID NOT NULL,
    "OrganizationId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Role" TEXT NOT NULL,
    "JoinedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_OrganizationMembers" PRIMARY KEY ("Id")
);

-- Índice único compuesto para OrganizationId y UserId
CREATE UNIQUE INDEX IF NOT EXISTS "IX_OrganizationMembers_OrganizationId_UserId" 
ON "OrganizationMembers" ("OrganizationId", "UserId");

-- Índice para UserId
CREATE INDEX IF NOT EXISTS "IX_OrganizationMembers_UserId" 
ON "OrganizationMembers" ("UserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_OrganizationMembers_Organizations_OrganizationId'
    ) THEN
        ALTER TABLE "OrganizationMembers"
        ADD CONSTRAINT "FK_OrganizationMembers_Organizations_OrganizationId"
        FOREIGN KEY ("OrganizationId")
        REFERENCES "Organizations" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_OrganizationMembers_Users_UserId'
    ) THEN
        ALTER TABLE "OrganizationMembers"
        ADD CONSTRAINT "FK_OrganizationMembers_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 4. TABLA: OrganizationInvitations
-- ============================================================================
CREATE TABLE IF NOT EXISTS "OrganizationInvitations" (
    "Id" UUID NOT NULL,
    "OrganizationId" UUID NOT NULL,
    "CreatedByUserId" UUID NOT NULL,
    "Token" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(150) NULL,
    "Role" VARCHAR(20) NOT NULL,
    "IsUsed" BOOLEAN NOT NULL,
    "UsedAt" TIMESTAMP WITH TIME ZONE NULL,
    "UsedByUserId" UUID NULL,
    "ExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_OrganizationInvitations" PRIMARY KEY ("Id")
);

-- Índice único para Token
CREATE UNIQUE INDEX IF NOT EXISTS "IX_OrganizationInvitations_Token" 
ON "OrganizationInvitations" ("Token");

-- Índices adicionales
CREATE INDEX IF NOT EXISTS "IX_OrganizationInvitations_OrganizationId" 
ON "OrganizationInvitations" ("OrganizationId");

CREATE INDEX IF NOT EXISTS "IX_OrganizationInvitations_CreatedByUserId" 
ON "OrganizationInvitations" ("CreatedByUserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_OrganizationInvitations_Organizations_OrganizationId'
    ) THEN
        ALTER TABLE "OrganizationInvitations"
        ADD CONSTRAINT "FK_OrganizationInvitations_Organizations_OrganizationId"
        FOREIGN KEY ("OrganizationId")
        REFERENCES "Organizations" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_OrganizationInvitations_Users_CreatedByUserId'
    ) THEN
        ALTER TABLE "OrganizationInvitations"
        ADD CONSTRAINT "FK_OrganizationInvitations_Users_CreatedByUserId"
        FOREIGN KEY ("CreatedByUserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 5. TABLA: Projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Projects" (
    "Id" UUID NOT NULL,
    "Name" VARCHAR(120) NOT NULL,
    "Description" VARCHAR(500) NULL,
    "OrganizationId" UUID NULL,
    "UserId" UUID NULL,
    "Template" VARCHAR(50) NULL,
    "ImageUrl" TEXT NULL,
    "IsActive" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT "PK_Projects" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_Projects_OrganizationId" 
ON "Projects" ("OrganizationId");

CREATE INDEX IF NOT EXISTS "IX_Projects_UserId" 
ON "Projects" ("UserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Projects_Organizations_OrganizationId'
    ) THEN
        ALTER TABLE "Projects"
        ADD CONSTRAINT "FK_Projects_Organizations_OrganizationId"
        FOREIGN KEY ("OrganizationId")
        REFERENCES "Organizations" ("Id")
        ON DELETE CASCADE;
    END IF;

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

-- ============================================================================
-- 6. TABLA: ProjectMembers
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ProjectMembers" (
    "Id" UUID NOT NULL,
    "ProjectId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Role" TEXT NOT NULL,
    "JoinedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_ProjectMembers" PRIMARY KEY ("Id")
);

-- Índice único compuesto para ProjectId y UserId
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ProjectMembers_ProjectId_UserId" 
ON "ProjectMembers" ("ProjectId", "UserId");

-- Índice para UserId
CREATE INDEX IF NOT EXISTS "IX_ProjectMembers_UserId" 
ON "ProjectMembers" ("UserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_ProjectMembers_Projects_ProjectId'
    ) THEN
        ALTER TABLE "ProjectMembers"
        ADD CONSTRAINT "FK_ProjectMembers_Projects_ProjectId"
        FOREIGN KEY ("ProjectId")
        REFERENCES "Projects" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_ProjectMembers_Users_UserId'
    ) THEN
        ALTER TABLE "ProjectMembers"
        ADD CONSTRAINT "FK_ProjectMembers_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 7. TABLA: Tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Tasks" (
    "Id" UUID NOT NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Description" VARCHAR(2000) NULL,
    "ProjectId" UUID NOT NULL,
    "Type" VARCHAR(20) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "Priority" VARCHAR(20) NULL,
    "AssignedToId" UUID NULL,
    "StartDate" TIMESTAMP WITH TIME ZONE NULL,
    "DueDate" TIMESTAMP WITH TIME ZONE NULL,
    "EstimatedMinutes" INTEGER NULL,
    "TotalMinutes" INTEGER NOT NULL,
    "Tags" VARCHAR(100) NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT "PK_Tasks" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_Tasks_ProjectId" 
ON "Tasks" ("ProjectId");

CREATE INDEX IF NOT EXISTS "IX_Tasks_AssignedToId" 
ON "Tasks" ("AssignedToId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Tasks_Projects_ProjectId'
    ) THEN
        ALTER TABLE "Tasks"
        ADD CONSTRAINT "FK_Tasks_Projects_ProjectId"
        FOREIGN KEY ("ProjectId")
        REFERENCES "Projects" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Tasks_Users_AssignedToId'
    ) THEN
        ALTER TABLE "Tasks"
        ADD CONSTRAINT "FK_Tasks_Users_AssignedToId"
        FOREIGN KEY ("AssignedToId")
        REFERENCES "Users" ("Id")
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 8. TABLA: TimeEntries
-- ============================================================================
CREATE TABLE IF NOT EXISTS "TimeEntries" (
    "Id" UUID NOT NULL,
    "TaskId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "StartedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "EndedAt" TIMESTAMP WITH TIME ZONE NULL,
    "DurationMinutes" INTEGER NULL,
    "Description" VARCHAR(500) NULL,
    "IsManual" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_TimeEntries" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_TimeEntries_TaskId" 
ON "TimeEntries" ("TaskId");

CREATE INDEX IF NOT EXISTS "IX_TimeEntries_UserId" 
ON "TimeEntries" ("UserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_TimeEntries_Tasks_TaskId'
    ) THEN
        ALTER TABLE "TimeEntries"
        ADD CONSTRAINT "FK_TimeEntries_Tasks_TaskId"
        FOREIGN KEY ("TaskId")
        REFERENCES "Tasks" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_TimeEntries_Users_UserId'
    ) THEN
        ALTER TABLE "TimeEntries"
        ADD CONSTRAINT "FK_TimeEntries_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 9. TABLA: ProjectComments
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ProjectComments" (
    "Id" UUID NOT NULL,
    "ProjectId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Content" VARCHAR(5000) NOT NULL,
    "IsPinned" BOOLEAN NOT NULL,
    "Color" VARCHAR(20) NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT "PK_ProjectComments" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_ProjectComments_ProjectId" 
ON "ProjectComments" ("ProjectId");

CREATE INDEX IF NOT EXISTS "IX_ProjectComments_UserId" 
ON "ProjectComments" ("UserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_ProjectComments_Projects_ProjectId'
    ) THEN
        ALTER TABLE "ProjectComments"
        ADD CONSTRAINT "FK_ProjectComments_Projects_ProjectId"
        FOREIGN KEY ("ProjectId")
        REFERENCES "Projects" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_ProjectComments_Users_UserId'
    ) THEN
        ALTER TABLE "ProjectComments"
        ADD CONSTRAINT "FK_ProjectComments_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 10. TABLA: TaskComments
-- ============================================================================
CREATE TABLE IF NOT EXISTS "TaskComments" (
    "Id" UUID NOT NULL,
    "TaskId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "ParentCommentId" UUID NULL,
    "Content" VARCHAR(5000) NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT "PK_TaskComments" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_TaskComments_TaskId" 
ON "TaskComments" ("TaskId");

CREATE INDEX IF NOT EXISTS "IX_TaskComments_UserId" 
ON "TaskComments" ("UserId");

CREATE INDEX IF NOT EXISTS "IX_TaskComments_ParentCommentId" 
ON "TaskComments" ("ParentCommentId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_TaskComments_Tasks_TaskId'
    ) THEN
        ALTER TABLE "TaskComments"
        ADD CONSTRAINT "FK_TaskComments_Tasks_TaskId"
        FOREIGN KEY ("TaskId")
        REFERENCES "Tasks" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_TaskComments_Users_UserId'
    ) THEN
        ALTER TABLE "TaskComments"
        ADD CONSTRAINT "FK_TaskComments_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_TaskComments_TaskComments_ParentCommentId'
    ) THEN
        ALTER TABLE "TaskComments"
        ADD CONSTRAINT "FK_TaskComments_TaskComments_ParentCommentId"
        FOREIGN KEY ("ParentCommentId")
        REFERENCES "TaskComments" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 11. TABLA: CommentAttachments
-- ============================================================================
CREATE TABLE IF NOT EXISTS "CommentAttachments" (
    "Id" UUID NOT NULL,
    "ProjectCommentId" UUID NULL,
    "TaskCommentId" UUID NULL,
    "FileName" VARCHAR(500) NOT NULL,
    "FileUrl" VARCHAR(1000) NOT NULL,
    "FileType" VARCHAR(50) NULL,
    "FileSize" BIGINT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_CommentAttachments" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_CommentAttachments_ProjectCommentId" 
ON "CommentAttachments" ("ProjectCommentId");

CREATE INDEX IF NOT EXISTS "IX_CommentAttachments_TaskCommentId" 
ON "CommentAttachments" ("TaskCommentId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_CommentAttachments_ProjectComments_ProjectCommentId'
    ) THEN
        ALTER TABLE "CommentAttachments"
        ADD CONSTRAINT "FK_CommentAttachments_ProjectComments_ProjectCommentId"
        FOREIGN KEY ("ProjectCommentId")
        REFERENCES "ProjectComments" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_CommentAttachments_TaskComments_TaskCommentId'
    ) THEN
        ALTER TABLE "CommentAttachments"
        ADD CONSTRAINT "FK_CommentAttachments_TaskComments_TaskCommentId"
        FOREIGN KEY ("TaskCommentId")
        REFERENCES "TaskComments" ("Id")
        ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 12. TABLA: CommentReactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS "CommentReactions" (
    "Id" UUID NOT NULL,
    "TaskCommentId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Emoji" VARCHAR(20) NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_CommentReactions" PRIMARY KEY ("Id")
);

-- Índice único compuesto para TaskCommentId, UserId y Emoji
CREATE UNIQUE INDEX IF NOT EXISTS "IX_CommentReactions_TaskCommentId_UserId_Emoji" 
ON "CommentReactions" ("TaskCommentId", "UserId", "Emoji");

-- Índices adicionales
CREATE INDEX IF NOT EXISTS "IX_CommentReactions_TaskCommentId" 
ON "CommentReactions" ("TaskCommentId");

CREATE INDEX IF NOT EXISTS "IX_CommentReactions_UserId" 
ON "CommentReactions" ("UserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_CommentReactions_TaskComments_TaskCommentId'
    ) THEN
        ALTER TABLE "CommentReactions"
        ADD CONSTRAINT "FK_CommentReactions_TaskComments_TaskCommentId"
        FOREIGN KEY ("TaskCommentId")
        REFERENCES "TaskComments" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_CommentReactions_Users_UserId'
    ) THEN
        ALTER TABLE "CommentReactions"
        ADD CONSTRAINT "FK_CommentReactions_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 13. TABLA: Notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "ProjectId" UUID NULL,
    "TaskId" UUID NULL,
    "TriggeredByUserId" UUID NULL,
    "Type" VARCHAR(50) NOT NULL,
    "Title" VARCHAR(200) NULL,
    "Message" VARCHAR(1000) NULL,
    "IsRead" BOOLEAN NOT NULL,
    "ReadAt" TIMESTAMP WITH TIME ZONE NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" 
ON "Notifications" ("UserId");

CREATE INDEX IF NOT EXISTS "IX_Notifications_ProjectId" 
ON "Notifications" ("ProjectId");

CREATE INDEX IF NOT EXISTS "IX_Notifications_TaskId" 
ON "Notifications" ("TaskId");

CREATE INDEX IF NOT EXISTS "IX_Notifications_TriggeredByUserId" 
ON "Notifications" ("TriggeredByUserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Notifications_Users_UserId'
    ) THEN
        ALTER TABLE "Notifications"
        ADD CONSTRAINT "FK_Notifications_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Notifications_Projects_ProjectId'
    ) THEN
        ALTER TABLE "Notifications"
        ADD CONSTRAINT "FK_Notifications_Projects_ProjectId"
        FOREIGN KEY ("ProjectId")
        REFERENCES "Projects" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Notifications_Tasks_TaskId'
    ) THEN
        ALTER TABLE "Notifications"
        ADD CONSTRAINT "FK_Notifications_Tasks_TaskId"
        FOREIGN KEY ("TaskId")
        REFERENCES "Tasks" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Notifications_Users_TriggeredByUserId'
    ) THEN
        ALTER TABLE "Notifications"
        ADD CONSTRAINT "FK_Notifications_Users_TriggeredByUserId"
        FOREIGN KEY ("TriggeredByUserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 14. TABLA: ProjectNotes
-- ============================================================================
CREATE TABLE IF NOT EXISTS "ProjectNotes" (
    "Id" UUID NOT NULL,
    "ProjectId" UUID NOT NULL,
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
    CONSTRAINT "PK_ProjectNotes" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_ProjectId" 
ON "ProjectNotes" ("ProjectId");

CREATE INDEX IF NOT EXISTS "IX_ProjectNotes_UserId" 
ON "ProjectNotes" ("UserId");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_ProjectNotes_Projects_ProjectId'
    ) THEN
        ALTER TABLE "ProjectNotes"
        ADD CONSTRAINT "FK_ProjectNotes_Projects_ProjectId"
        FOREIGN KEY ("ProjectId")
        REFERENCES "Projects" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_ProjectNotes_Users_UserId'
    ) THEN
        ALTER TABLE "ProjectNotes"
        ADD CONSTRAINT "FK_ProjectNotes_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================================================
-- 15. TABLA: PersonalNotes
-- ============================================================================
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

-- Índice para UserId
CREATE INDEX IF NOT EXISTS "IX_PersonalNotes_UserId" 
ON "PersonalNotes" ("UserId");

-- Foreign Key
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

-- ============================================================================
-- 16. TABLA: PersonalCalendarEvents
-- ============================================================================
CREATE TABLE IF NOT EXISTS "PersonalCalendarEvents" (
    "Id" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Description" VARCHAR(2000) NULL,
    "StartDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "EndDate" TIMESTAMP WITH TIME ZONE NULL,
    "Color" VARCHAR(20) NULL,
    "Type" VARCHAR(50) NULL,
    "AllDay" BOOLEAN NOT NULL DEFAULT FALSE,
    "HasReminder" BOOLEAN NOT NULL DEFAULT FALSE,
    "ReminderMinutesBefore" INTEGER NULL,
    "RelatedTaskId" UUID NULL,
    "RelatedProjectId" UUID NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT "PK_PersonalCalendarEvents" PRIMARY KEY ("Id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "IX_PersonalCalendarEvents_UserId_StartDate" 
ON "PersonalCalendarEvents" ("UserId", "StartDate");

CREATE INDEX IF NOT EXISTS "IX_PersonalCalendarEvents_StartDate" 
ON "PersonalCalendarEvents" ("StartDate");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_PersonalCalendarEvents_Users_UserId'
    ) THEN
        ALTER TABLE "PersonalCalendarEvents"
        ADD CONSTRAINT "FK_PersonalCalendarEvents_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_PersonalCalendarEvents_Tasks_RelatedTaskId'
    ) THEN
        ALTER TABLE "PersonalCalendarEvents"
        ADD CONSTRAINT "FK_PersonalCalendarEvents_Tasks_RelatedTaskId"
        FOREIGN KEY ("RelatedTaskId")
        REFERENCES "Tasks" ("Id")
        ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_PersonalCalendarEvents_Projects_RelatedProjectId'
    ) THEN
        ALTER TABLE "PersonalCalendarEvents"
        ADD CONSTRAINT "FK_PersonalCalendarEvents_Projects_RelatedProjectId"
        FOREIGN KEY ("RelatedProjectId")
        REFERENCES "Projects" ("Id")
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 17. TABLA: __EFMigrationsHistory (Para Entity Framework)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" VARCHAR(150) NOT NULL,
    "ProductVersion" VARCHAR(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Verificar que todas las tablas se crearon correctamente
SELECT 
    'Tablas creadas:' AS status,
    COUNT(*) AS total_tablas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'Organizations',
    'Users',
    'OrganizationMembers',
    'OrganizationInvitations',
    'Projects',
    'ProjectMembers',
    'Tasks',
    'TimeEntries',
    'ProjectComments',
    'TaskComments',
    'CommentAttachments',
    'CommentReactions',
    'Notifications',
    'ProjectNotes',
    'PersonalNotes',
    'PersonalCalendarEvents',
    '__EFMigrationsHistory'
);

-- Mostrar todas las tablas creadas
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
    'Organizations',
    'Users',
    'OrganizationMembers',
    'OrganizationInvitations',
    'Projects',
    'ProjectMembers',
    'Tasks',
    'TimeEntries',
    'ProjectComments',
    'TaskComments',
    'CommentAttachments',
    'CommentReactions',
    'Notifications',
    'ProjectNotes',
    'PersonalNotes',
    'PersonalCalendarEvents',
    '__EFMigrationsHistory'
)
ORDER BY table_name;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- ✅ Todas las tablas, índices y foreign keys han sido creadas.
-- ✅ La base de datos está lista para usar.
-- ============================================================================
