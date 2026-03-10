-- Verificación rápida de las tablas críticas para CreatePersonalProject
-- Ejecutar este script y compartir TODOS los resultados

-- 1. VERIFICAR TABLA Projects
SELECT 
    'PROJECTS' AS tabla,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR TABLA ProjectMembers
SELECT 
    'PROJECTMEMBERS' AS tabla,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ProjectMembers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR FOREIGN KEYS DE Projects
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

-- 4. VERIFICAR FOREIGN KEYS DE ProjectMembers
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

-- 5. VERIFICAR ÍNDICES DE Projects
SELECT 
    'INDICES_PROJECTS' AS tipo,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'Projects' 
AND schemaname = 'public'
ORDER BY indexname;

-- 6. VERIFICAR ÍNDICES DE ProjectMembers
SELECT 
    'INDICES_PROJECTMEMBERS' AS tipo,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'ProjectMembers' 
AND schemaname = 'public'
ORDER BY indexname;

-- 7. VERIFICAR UNIQUE CONSTRAINTS DE ProjectMembers
SELECT 
    'UNIQUE_PROJECTMEMBERS' AS tipo,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name = 'ProjectMembers'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name, kcu.ordinal_position;
