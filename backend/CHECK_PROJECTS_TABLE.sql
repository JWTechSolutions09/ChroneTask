-- Script para verificar la estructura de la tabla Projects
-- Ejecutar este script en Supabase

-- 1. Verificar todas las columnas de la tabla Projects
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar índices en Projects
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'Projects' 
AND schemaname = 'public'
ORDER BY indexname;

-- 3. Verificar foreign keys en Projects
SELECT 
    tc.constraint_name,
    tc.table_name,
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

-- 4. Verificar que UserId puede ser NULL (para proyectos personales)
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND column_name = 'UserId'
AND table_schema = 'public';

-- 5. Verificar que OrganizationId puede ser NULL (para proyectos personales)
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND column_name = 'OrganizationId'
AND table_schema = 'public';
