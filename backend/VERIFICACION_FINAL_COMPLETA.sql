-- Verificación final completa - Ejecutar y compartir TODOS los resultados

-- 1. Foreign Keys de Projects
SELECT 
    'FK_PROJECTS' AS tipo,
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

-- 2. TODAS las columnas de Projects (verificar SlaHours y SlaWarningThreshold)
SELECT 
    'PROJECTS_ALL_COLUMNS' AS tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar si hay algún constraint o trigger que pueda estar bloqueando
SELECT 
    'CHECK_CONSTRAINTS_PROJECTS' AS tipo,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'Projects'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK';
