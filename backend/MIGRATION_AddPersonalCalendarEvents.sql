-- Migration: Add PersonalCalendarEvents table
-- Description: Creates the PersonalCalendarEvents table for personal calendar events

DO $$
BEGIN
    -- Create PersonalCalendarEvents table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PersonalCalendarEvents') THEN
        CREATE TABLE "PersonalCalendarEvents" (
            "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "UserId" UUID NOT NULL,
            "Title" VARCHAR(200) NOT NULL,
            "Description" VARCHAR(2000),
            "StartDate" TIMESTAMP NOT NULL,
            "EndDate" TIMESTAMP,
            "Color" VARCHAR(20),
            "Type" VARCHAR(50),
            "AllDay" BOOLEAN NOT NULL DEFAULT FALSE,
            "HasReminder" BOOLEAN NOT NULL DEFAULT FALSE,
            "ReminderMinutesBefore" INTEGER,
            "RelatedTaskId" UUID,
            "RelatedProjectId" UUID,
            "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "UpdatedAt" TIMESTAMP,
            CONSTRAINT "FK_PersonalCalendarEvents_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_PersonalCalendarEvents_Tasks_RelatedTaskId" FOREIGN KEY ("RelatedTaskId") REFERENCES "Tasks" ("Id") ON DELETE SET NULL,
            CONSTRAINT "FK_PersonalCalendarEvents_Projects_RelatedProjectId" FOREIGN KEY ("RelatedProjectId") REFERENCES "Projects" ("Id") ON DELETE SET NULL
        );

        RAISE NOTICE 'Table PersonalCalendarEvents created successfully';
    ELSE
        RAISE NOTICE 'Table PersonalCalendarEvents already exists';
    END IF;

    -- Create index on UserId and StartDate for better query performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_PersonalCalendarEvents_UserId_StartDate') THEN
        CREATE INDEX "IX_PersonalCalendarEvents_UserId_StartDate" ON "PersonalCalendarEvents" ("UserId", "StartDate");
        RAISE NOTICE 'Index IX_PersonalCalendarEvents_UserId_StartDate created successfully';
    ELSE
        RAISE NOTICE 'Index IX_PersonalCalendarEvents_UserId_StartDate already exists';
    END IF;

    -- Create index on StartDate for date range queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_PersonalCalendarEvents_StartDate') THEN
        CREATE INDEX "IX_PersonalCalendarEvents_StartDate" ON "PersonalCalendarEvents" ("StartDate");
        RAISE NOTICE 'Index IX_PersonalCalendarEvents_StartDate created successfully';
    ELSE
        RAISE NOTICE 'Index IX_PersonalCalendarEvents_StartDate already exists';
    END IF;

    RAISE NOTICE 'Migration completed successfully';
END $$;
