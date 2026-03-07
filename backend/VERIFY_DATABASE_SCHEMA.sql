-- Script para verificar que el esquema de la base de datos esté correcto
-- Ejecutar este script en Supabase para verificar que todo esté bien

-- 1. Verificar que la tabla Projects existe y tiene la columna UserId
-- Primero verificar qué tablas existen
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('Projects', 'projects') 
AND table_schema = 'public'
ORDER BY table_name;

-- Luego verificar las columnas (usar LOWER para case-insensitive)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE LOWER(table_name) = 'projects' 
AND column_name IN ('UserId', 'OrganizationId', 'Name', 'Description', 'IsActive', 'CreatedAt', 'UpdatedAt')
ORDER BY column_name;

-- 2. Verificar que existe el índice para UserId
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE LOWER(tablename) = 'projects' 
AND indexname LIKE '%UserId%';

-- 3. Verificar que existe la foreign key para UserId
-- Nota: PostgreSQL convierte los nombres a minúsculas si no se usan comillas
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conrelid::regclass::text IN ('Projects', 'projects', '"Projects"')
AND conname LIKE '%UserId%';

-- 4. Verificar que la tabla ProjectMembers existe y tiene las columnas correctas
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE LOWER(table_name) = 'projectmembers' 
AND column_name IN ('Id', 'ProjectId', 'UserId', 'Role', 'JoinedAt')
ORDER BY column_name;

-- 5. Verificar que existe el índice único para ProjectId y UserId
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE LOWER(tablename) = 'projectmembers' 
AND indexname LIKE '%ProjectId%UserId%';

-- 6. Verificar que la tabla Notifications existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE LOWER(table_name) = 'notifications' 
AND column_name IN ('Id', 'UserId', 'ProjectId', 'Type', 'Title', 'Message')
ORDER BY column_name;

-- 7. Verificar que la tabla Users existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE LOWER(table_name) = 'users' 
AND column_name IN ('Id', 'FullName', 'Email', 'PasswordHash')
ORDER BY column_name;

-- 8. Verificar todas las tablas en el esquema public
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
