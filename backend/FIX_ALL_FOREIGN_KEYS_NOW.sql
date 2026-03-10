-- Script para agregar TODAS las foreign keys necesarias
-- Ejecutar este script completo en Supabase

-- ============================================================================
-- 1. AGREGAR FK_Projects_Users_UserId (CRÍTICO)
-- ============================================================================
DO $$
BEGIN
    -- Eliminar si existe primero (por si acaso hay un problema)
    ALTER TABLE "Projects" DROP CONSTRAINT IF EXISTS "FK_Projects_Users_UserId";
    
    -- Crear la foreign key
    ALTER TABLE "Projects"
    ADD CONSTRAINT "FK_Projects_Users_UserId"
    FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id")
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key FK_Projects_Users_UserId creada';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ FK_Projects_Users_UserId ya existe';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- ============================================================================
-- 2. AGREGAR FK_Projects_Organizations_OrganizationId (si no existe)
-- ============================================================================
DO $$
BEGIN
    ALTER TABLE "Projects" DROP CONSTRAINT IF EXISTS "FK_Projects_Organizations_OrganizationId";
    
    ALTER TABLE "Projects"
    ADD CONSTRAINT "FK_Projects_Organizations_OrganizationId"
    FOREIGN KEY ("OrganizationId")
    REFERENCES "Organizations" ("Id")
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key FK_Projects_Organizations_OrganizationId creada';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ FK_Projects_Organizations_OrganizationId ya existe';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. AGREGAR FK_ProjectMembers_Projects_ProjectId (CRÍTICO)
-- ============================================================================
DO $$
BEGIN
    ALTER TABLE "ProjectMembers" DROP CONSTRAINT IF EXISTS "FK_ProjectMembers_Projects_ProjectId";
    
    ALTER TABLE "ProjectMembers"
    ADD CONSTRAINT "FK_ProjectMembers_Projects_ProjectId"
    FOREIGN KEY ("ProjectId")
    REFERENCES "Projects" ("Id")
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key FK_ProjectMembers_Projects_ProjectId creada';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ FK_ProjectMembers_Projects_ProjectId ya existe';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. AGREGAR FK_ProjectMembers_Users_UserId (CRÍTICO)
-- ============================================================================
DO $$
BEGIN
    ALTER TABLE "ProjectMembers" DROP CONSTRAINT IF EXISTS "FK_ProjectMembers_Users_UserId";
    
    ALTER TABLE "ProjectMembers"
    ADD CONSTRAINT "FK_ProjectMembers_Users_UserId"
    FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id")
    ON DELETE RESTRICT;
    
    RAISE NOTICE '✅ Foreign key FK_ProjectMembers_Users_UserId creada';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ FK_ProjectMembers_Users_UserId ya existe';
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- ============================================================================
-- 5. VERIFICAR QUE SlaHours Y SlaWarningThreshold EXISTAN
-- ============================================================================

-- Agregar SlaHours si no existe
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
        
        RAISE NOTICE '✅ Columna SlaHours agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna SlaHours ya existe';
    END IF;
END $$;

-- Agregar SlaWarningThreshold si no existe
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
        
        RAISE NOTICE '✅ Columna SlaWarningThreshold agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna SlaWarningThreshold ya existe';
    END IF;
END $$;

-- ============================================================================
-- 6. VERIFICACIÓN FINAL - Mostrar todas las foreign keys creadas
-- ============================================================================

SELECT 
    'VERIFICACION_FINAL_FK_PROJECTS' AS tipo,
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

SELECT 
    'VERIFICACION_FINAL_FK_PROJECTMEMBERS' AS tipo,
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
