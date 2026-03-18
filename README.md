# ChroneTask

Plataforma web para gestión de proyectos empresariales con time tracking nativo.

## Stack
- Backend: ASP.NET Core Web API
- DB: PostgreSQL
- Frontend: React + Vite

## Variables de entorno (Supabase Google OAuth)

### Frontend (Vite)
Crear `frontend/.env` con:

- `VITE_SUPABASE_URL=https://fhbyiujurdnkzfenfilb.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<TU_SUPABASE_ANON_KEY>`

### Backend (API)
En producción, define la variable de entorno:

- `SUPABASE_URL=https://fhbyiujurdnkzfenfilb.supabase.co`

En desarrollo local ya está configurado en `backend/ChroneTask.Api/appsettings.Development.json`.