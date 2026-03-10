-- Script para agregar foreign keys e índices faltantes
-- Ejecutar este script en Supabase si faltan foreign keys o índices

-- ============================================================================
-- 1. VERIFICAR Y AGREGAR ÍNDICE IX_Projects_UserId SI NO EXISTE
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'IX_Projects_UserId' 
        AND tablename = 'Projects'
        AND schemaname = 'public'
    ) THEN
        CREATE INDEX "IX_Projects_UserId" ON "Projects" ("UserId");
        RAISE NOTICE 'Índice IX_Projects_UserId creado';
    ELSE
        RAISE NOTICE 'Índice IX_Projects_UserId ya existe';
    END IF;
END $$;

-- ============================================================================
-- 2. VERIFICAR Y AGREGAR FOREIGN KEY FK_Projects_Users_UserId SI NO EXISTE
-- ============================================================================
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
        
        RAISE NOTICE 'Foreign key FK_Projects_Users_UserId creada';
    ELSE
        RAISE NOTICE 'Foreign key FK_Projects_Users_UserId ya existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al crear FK_Projects_Users_UserId: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. VERIFICAR Y AGREGAR FOREIGN KEY FK_ProjectMembers_Projects_ProjectId SI NO EXISTE
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'FK_ProjectMembers_Projects_ProjectId'
        AND tc.table_name = 'ProjectMembers'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE "ProjectMembers"
        ADD CONSTRAINT "FK_ProjectMembers_Projects_ProjectId"
        FOREIGN KEY ("ProjectId")
        REFERENCES "Projects" ("Id")
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key FK_ProjectMembers_Projects_ProjectId creada';
    ELSE
        RAISE NOTICE 'Foreign key FK_ProjectMembers_Projects_ProjectId ya existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al crear FK_ProjectMembers_Projects_ProjectId: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. VERIFICAR Y AGREGAR FOREIGN KEY FK_ProjectMembers_Users_UserId SI NO EXISTE
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_name = 'FK_ProjectMembers_Users_UserId'
        AND tc.table_name = 'ProjectMembers'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE "ProjectMembers"
        ADD CONSTRAINT "FK_ProjectMembers_Users_UserId"
        FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id")
        ON DELETE RESTRICT;
        
        RAISE NOTICE 'Foreign key FK_ProjectMembers_Users_UserId creada';
    ELSE
        RAISE NOTICE 'Foreign key FK_ProjectMembers_Users_UserId ya existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al crear FK_ProjectMembers_Users_UserId: %', SQLERRM;
END $$;

-- ============================================================================
-- 5. VERIFICAR QUE TODAS LAS COLUMNAS REQUERIDAS EXISTAN
-- ============================================================================

-- Verificar columna SlaHours en Projects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Projects' 
        AND column_name = 'SlaHours'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Projects"
        ADD COLUMN "SlaHours" INTEGER NULL;
        
        RAISE NOTICE 'Columna SlaHours agregada a Projects';
    ELSE
        RAISE NOTICE 'Columna SlaHours ya existe en Projects';
    END IF;
END $$;

-- Verificar columna SlaWarningThreshold en Projects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Projects' 
        AND column_name = 'SlaWarningThreshold'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Projects"
        ADD COLUMN "SlaWarningThreshold" INTEGER NULL;
        
        RAISE NOTICE 'Columna SlaWarningThreshold agregada a Projects';
    ELSE
        RAISE NOTICE 'Columna SlaWarningThreshold ya existe en Projects';
    END IF;
END $$;

-- ============================================================================
-- 6. VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar foreign keys de Projects
SELECT 
    'VERIFICACION_FK_PROJECTS' AS tipo,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'Projects'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- Verificar foreign keys de ProjectMembers
SELECT 
    'VERIFICACION_FK_PROJECTMEMBERS' AS tipo,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'ProjectMembers'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- Verificar índices de Projects
SELECT 
    'VERIFICACION_INDICES_PROJECTS' AS tipo,
    indexname
FROM pg_indexes 
WHERE tablename = 'Projects' 
AND schemaname = 'public'
ORDER BY indexname;
