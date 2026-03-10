-- Script completo para obtener el esquema completo de la base de datos
-- Ejecutar este script en Supabase y compartir todos los resultados

-- ============================================================================
-- 1. TODAS LAS TABLAS
-- ============================================================================
SELECT 
    'TABLAS' AS tipo,
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. TODAS LAS COLUMNAS DE TODAS LAS TABLAS
-- ============================================================================
SELECT 
    'COLUMNAS' AS tipo,
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 3. TODOS LOS ÍNDICES
-- ============================================================================
SELECT 
    'INDICES' AS tipo,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. TODAS LAS FOREIGN KEYS
-- ============================================================================
SELECT 
    'FOREIGN_KEYS' AS tipo,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
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
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 5. TODAS LAS PRIMARY KEYS
-- ============================================================================
SELECT 
    'PRIMARY_KEYS' AS tipo,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 6. TODOS LOS UNIQUE CONSTRAINTS
-- ============================================================================
SELECT 
    'UNIQUE_CONSTRAINTS' AS tipo,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 7. VERIFICACIÓN ESPECÍFICA DE TABLAS CRÍTICAS
-- ============================================================================

-- Projects
SELECT 
    'PROJECTS_DETAIL' AS tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ProjectMembers
SELECT 
    'PROJECTMEMBERS_DETAIL' AS tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ProjectMembers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Users
SELECT 
    'USERS_DETAIL' AS tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Notifications
SELECT 
    'NOTIFICATIONS_DETAIL' AS tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;
