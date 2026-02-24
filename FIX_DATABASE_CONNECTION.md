# 🔧 Solucionar Error de Base de Datos

## ❌ Error en los Logs

```
System.ArgumentException: Format of the initialization string does not conform to specification starting at index 0.
```

## 🔍 Problema

La variable `ConnectionStrings__DefaultConnection` en Render tiene el formato:
```
postgresql://user:pass@host:port/dbname
```

Pero Npgsql necesita el formato:
```
Host=host;Port=port;Database=dbname;Username=user;Password=pass
```

## ✅ Solución

He actualizado el código para que detecte automáticamente si la connection string está en formato URI de PostgreSQL y la convierta al formato correcto.

### Paso 1: Verificar Variable en Render

1. Ve a Render Dashboard → Tu servicio backend → **"Environment"**
2. Busca `ConnectionStrings__DefaultConnection`
3. **NO la cambies**, el código ahora la convierte automáticamente

### Paso 2: Hacer Commit y Push

```bash
cd C:\Users\jamil\Desktop\ChroneTask
git add backend/ChroneTask.Api/Program.cs
git commit -m "Fix database connection string parsing and CORS"
git push
```

### Paso 3: Esperar el Redeploy

1. Render automáticamente redeployará (2-3 minutos)
2. Ve a la pestaña "Events" para ver el progreso

### Paso 4: Verificar en los Logs

Después del redeploy, deberías ver:

```
🌐 CORS configurado: Permitir TODOS los orígenes (AllowAnyOrigin)
✅ Connection string construida desde DATABASE_URL
🔗 Usando base de datos: chronetask_db
```

**Si ves estos mensajes:** ✅ Todo está configurado correctamente

## 📋 Variables de Entorno en Render

Asegúrate de tener estas variables:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:${PORT}
ConnectionStrings__DefaultConnection=postgresql://chronetask_db_user:RRQtvB6Am9nVv8CUjca0AC8oFxa0wgp4@dpg-d625aj95pdvs73b8h9og-a/chronetask_db
JWT__SecretKey=Chrone_Task_Secret_090304_Render
JWT__Issuer=ChroneTask
JWT__Audience=ChroneTaskUsers
JWT__ExpirationMinutes=1440
```

**Nota:** El código ahora convierte automáticamente el formato `postgresql://` al formato que Npgsql necesita.

---

**¡Con esto debería funcionar tanto CORS como la base de datos! 🎉**
