# Configuración Rápida de Supabase

## Tu Connection String de Supabase

```
postgresql://postgres.fhbyiujurdnkzfenfilb:[ProjectChronetask]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

## ⚠️ Nota Importante sobre la Contraseña

Si la contraseña en tu connection string tiene corchetes `[ProjectChronetask]`, **asegúrate de incluir los corchetes** como parte de la contraseña, o verifica en Supabase cuál es la contraseña real sin corchetes.

---

## Opción 1: Usar directamente en appsettings.json (Desarrollo)

Edita `backend/ChroneTask.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "postgresql://postgres.fhbyiujurdnkzfenfilb:[ProjectChronetask]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
  }
}
```

**✅ El código convertirá automáticamente este formato a Npgsql.**

---

## Opción 2: Usar Variable de Entorno (Recomendado para Producción)

### En Windows (PowerShell):

```powershell
$env:DATABASE_URL="postgresql://postgres.fhbyiujurdnkzfenfilb:[ProjectChronetask]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

### En Linux/Mac:

```bash
export DATABASE_URL="postgresql://postgres.fhbyiujurdnkzfenfilb:[ProjectChronetask]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

### En Docker/docker-compose.yml:

```yaml
services:
  backend:
    environment:
      - DATABASE_URL=postgresql://postgres.fhbyiujurdnkzfenfilb:[ProjectChronetask]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

---

## Opción 3: Formato Npgsql Directo (Alternativa)

Si prefieres usar el formato Npgsql directamente:

```
Host=aws-0-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.fhbyiujurdnkzfenfilb;Password=[ProjectChronetask];SSL Mode=Require;Trust Server Certificate=true
```

**Nota**: Reemplaza `[ProjectChronetask]` con tu contraseña real (con o sin corchetes según corresponda).

---

## Verificar la Conexión

1. **Ejecuta la aplicación**:
   ```bash
   cd backend/ChroneTask.Api
   dotnet run
   ```

2. **Busca en los logs**:
   ```
   ✅ Connection string convertida desde formato URI de PostgreSQL
   🔗 Usando base de datos: postgres
   🔄 Aplicando migraciones de base de datos...
   ✅ Migraciones aplicadas correctamente
   ```

3. **Si hay errores**, verifica:
   - Que la contraseña sea correcta (con o sin corchetes)
   - Que el proyecto de Supabase esté activo
   - Que hayas ejecutado el script `CREATE_COMPLETE_DATABASE_SCHEMA.sql` en Supabase

---

## Pasos Siguientes

1. ✅ **Ejecutar el script de creación de esquema**:
   - Ve a Supabase → SQL Editor
   - Copia y ejecuta el contenido de `backend/CREATE_COMPLETE_DATABASE_SCHEMA.sql`

2. ✅ **Configurar la connection string** (una de las opciones arriba)

3. ✅ **Probar la conexión** ejecutando la aplicación

4. ✅ **Verificar que las tablas se crearon**:
   - En Supabase → Table Editor
   - Deberías ver todas las tablas (Organizations, Users, Projects, etc.)

---

## Troubleshooting

### Error: "password authentication failed"

**Solución**: 
- Verifica que la contraseña sea correcta
- Si los corchetes `[]` están en la UI de Supabase, probablemente NO son parte de la contraseña
- Ve a Supabase → Settings → Database → Reset database password si es necesario

### Error: "SSL connection required"

**Solución**: El código ya incluye `SSL Mode=Require` automáticamente. Si persiste, verifica que estés usando la connection string correcta.

### Error: "timeout" o "connection refused"

**Solución**:
- Verifica que el proyecto de Supabase esté activo
- Verifica que la URL del host sea correcta: `aws-0-us-west-2.pooler.supabase.com`
- Asegúrate de que tu IP no esté bloqueada (Supabase puede tener restricciones de IP)

---

## Información de tu Proyecto Supabase

- **Host**: `aws-0-us-west-2.pooler.supabase.com`
- **Puerto**: `5432`
- **Database**: `postgres`
- **Usuario**: `postgres.fhbyiujurdnkzfenfilb`
- **Región**: `us-west-2` (Oregón, USA)

---

¡Listo! Tu aplicación debería conectarse a Supabase correctamente. 🚀
