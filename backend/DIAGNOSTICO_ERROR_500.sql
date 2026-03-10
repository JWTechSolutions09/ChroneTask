-- Script de diagnóstico específico para el error 500 al crear proyectos
-- Ejecutar este script y compartir TODOS los resultados

-- ============================================================================
-- 1. VERIFICAR COLUMNAS DE Projects (especialmente UserId y SlaHours)
-- ============================================================================
SELECT 
    'PROJECTS_COLUMNS' AS tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. VERIFICAR COLUMNAS DE ProjectMembers
-- ============================================================================
SELECT 
    'PROJECTMEMBERS_COLUMNS' AS tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ProjectMembers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. VERIFICAR TODAS LAS FOREIGN KEYS DE Projects
-- ============================================================================
SELECT 
    'FK_PROJECTS' AS tipo,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'Projects'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- ============================================================================
-- 4. VERIFICAR TODAS LAS FOREIGN KEYS DE ProjectMembers
-- ============================================================================
SELECT 
    'FK_PROJECTMEMBERS' AS tipo,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'ProjectMembers'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- ============================================================================
-- 5. VERIFICAR QUE Users.Id EXISTE (crítico para foreign keys)
-- ============================================================================
SELECT 
    'USERS_ID_CHECK' AS tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Users' 
AND column_name = 'Id'
AND table_schema = 'public';

-- ============================================================================
-- 6. VERIFICAR PRIMARY KEY DE Projects
-- ============================================================================
SELECT 
    'PK_PROJECTS' AS tipo,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_name = 'Projects'
    AND tc.table_schema = 'public';

-- ============================================================================
-- 7. VERIFICAR PRIMARY KEY DE ProjectMembers
-- ============================================================================
SELECT 
    'PK_PROJECTMEMBERS' AS tipo,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_name = 'ProjectMembers'
    AND tc.table_schema = 'public';
