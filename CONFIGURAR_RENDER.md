# Configurar DATABASE_URL en Render para Supabase

## Problema

Render está usando la variable de entorno `DATABASE_URL` pero la autenticación falla porque la contraseña puede tener caracteres especiales que necesitan ser manejados correctamente.

## Solución: Configurar DATABASE_URL en Render

### Paso 1: Obtener la Connection String de Supabase

1. Ve a tu proyecto en Supabase
2. Ve a **Settings** → **Database**
3. En la sección **Connection string**, selecciona **URI**
4. Copia la connection string completa

Tu connection string debería ser:
```
postgresql://postgres.fhbyiujurdnkzfenfilb:chronetaskpass09@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### Paso 2: Configurar en Render

1. **Ve a tu servicio en Render** (https://dashboard.render.com)
2. Selecciona tu servicio (backend)
3. Ve a **Environment** en el menú lateral
4. Busca o crea la variable de entorno `DATABASE_URL`
5. Pega la connection string completa:
   ```
   postgresql://postgres.fhbyiujurdnkzfenfilb:chronetaskpass09@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```
6. **Guarda los cambios**
7. **Redeploya el servicio** (Render lo hará automáticamente o puedes hacerlo manualmente)

### Paso 3: Verificar

Después del redeploy, verifica los logs. Deberías ver:
```
✅ Connection string construida desde DATABASE_URL
🔗 Usando base de datos: postgres
🔄 Aplicando migraciones de base de datos...
✅ Migraciones aplicadas correctamente
```

---

## Si la Contraseña Tiene Caracteres Especiales

Si tu contraseña tiene caracteres especiales (como `@`, `#`, `%`, etc.), necesitas codificarlos en la URL:

### Caracteres que deben codificarse:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`
- `/` → `%2F`
- `:` → `%3A` (solo en la contraseña, no en el separador usuario:contraseña)

### Ejemplo:

Si tu contraseña es `P@ssw0rd#123`, la connection string sería:
```
postgresql://postgres.fhbyiujurdnkzfenfilb:P%40ssw0rd%23123@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### Herramienta para codificar:

Puedes usar esta herramienta online: https://www.urlencoder.org/

O en PowerShell:
```powershell
[System.Web.HttpUtility]::UrlEncode("TuContraseña")
```

---

## Alternativa: Usar Formato Npgsql Directo

Si prefieres usar el formato Npgsql directamente en lugar del formato URI:

1. En Render, crea o edita la variable de entorno `ConnectionStrings__DefaultConnection`
2. Usa este formato:
   ```
   Host=aws-0-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.fhbyiujurdnkzfenfilb;Password=chronetaskpass09;SSL Mode=Require;Trust Server Certificate=true
   ```

**Nota**: Con este método, NO uses la variable `DATABASE_URL`, usa `ConnectionStrings__DefaultConnection`.

---

## Verificar que Funciona

1. **Revisa los logs de Render** después del deploy
2. Busca estos mensajes:
   - ✅ `Connection string construida desde DATABASE_URL`
   - ✅ `Migraciones aplicadas correctamente`
3. Si ves errores de autenticación:
   - Verifica que la contraseña sea exactamente `ProjectChronetask` (sin espacios)
   - Verifica que no haya caracteres invisibles
   - Intenta resetear la contraseña en Supabase si es necesario

---

## Resetear Contraseña en Supabase (si es necesario)

1. Ve a Supabase → **Settings** → **Database**
2. Click en **Reset database password**
3. Genera una nueva contraseña
4. **Guárdala de forma segura**
5. Actualiza la variable `DATABASE_URL` en Render con la nueva contraseña
6. Redeploya el servicio

---

## Tu Configuración Actual

- **Host**: `aws-0-us-west-2.pooler.supabase.com`
- **Puerto**: `5432`
- **Database**: `postgres`
- **Usuario**: `postgres.fhbyiujurdnkzfenfilb`
- **Contraseña**: `chronetaskpass09`

**Connection String completa**:
```
postgresql://postgres.fhbyiujurdnkzfenfilb:chronetaskpass09@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

---

---

## Configurar JWT_SECRET_KEY (IMPORTANTE)

Para que la autenticación funcione correctamente, necesitas configurar el `JWT_SECRET_KEY` en Render:

### Paso 1: Generar una clave secreta segura

Puedes generar una clave secreta segura usando uno de estos métodos:

**Opción 1: Usar PowerShell (Windows)**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Opción 2: Usar un generador online**
- https://www.grc.com/passwords.htm
- Genera una contraseña de al menos 32 caracteres

**Opción 3: Usar OpenSSL (si está instalado)**
```bash
openssl rand -base64 32
```

### Paso 2: Configurar en Render

1. **Ve a tu servicio en Render** (https://dashboard.render.com)
2. Selecciona tu servicio (backend)
3. Ve a **Environment** en el menú lateral
4. Busca o crea la variable de entorno `JWT_SECRET_KEY`
5. Pega la clave secreta generada (debe tener al menos 32 caracteres)
6. **Guarda los cambios**
7. **Redeploya el servicio**

### Paso 3: Verificar

Después del redeploy, verifica los logs. Deberías ver:
```
🔐 JWT configurado - Issuer: ChroneTask, Audience: ChroneTask, SecretKey length: [número]
```

**⚠️ IMPORTANTE**: 
- El `JWT_SECRET_KEY` debe ser el mismo que se usó para generar los tokens
- Si cambias el `JWT_SECRET_KEY`, todos los usuarios tendrán que iniciar sesión de nuevo
- Nunca compartas tu `JWT_SECRET_KEY` públicamente

---

## Variables de Entorno Requeridas en Render

Asegúrate de tener estas variables configuradas:

1. **`DATABASE_URL`** (requerida)
   ```
   postgresql://postgres.fhbyiujurdnkzfenfilb:chronetaskpass09@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```

2. **`JWT_SECRET_KEY`** (requerida)
   - Debe tener al menos 32 caracteres
   - Debe ser una cadena aleatoria segura

3. **`JWT_ISSUER`** (opcional, por defecto: `ChroneTask`)
   ```
   ChroneTask
   ```

4. **`JWT_AUDIENCE`** (opcional, por defecto: `ChroneTask`)
   ```
   ChroneTask
   ```

5. **`JWT_EXPIRATION_MINUTES`** (opcional, por defecto: `1440` = 24 horas)
   ```
   1440
   ```

---

¡Configura esto en Render y redeploya! 🚀
