# 🔍 Análisis de Problemas y Deficiencias - ChroneTask

## 📋 Resumen Ejecutivo

Este documento identifica problemas críticos, de seguridad, rendimiento y UX encontrados en el código.

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. **Dependencias Faltantes en useEffect**
**Ubicación:** `frontend/src/pages/Board.tsx:43-48`
```typescript
useEffect(() => {
  if (projectId && organizationId) {
    loadProjectInfo();
    loadTasks();
  }
}, [projectId, organizationId]); // ❌ Faltan loadProjectInfo y loadTasks
```
**Problema:** Las funciones `loadProjectInfo` y `loadTasks` no están en las dependencias, causando warnings de React y posibles bugs.
**Impacto:** Alto - Puede causar renders infinitos o datos desactualizados.

**Ubicación:** `frontend/src/pages/Dashboard.tsx:28-32`
```typescript
useEffect(() => {
  if (organizationId) {
    loadProjects();
  }
}, [organizationId]); // ❌ Falta loadProjects
```

**Ubicación:** `frontend/src/pages/Login.tsx:14-18`
```typescript
useEffect(() => {
  if (isAuthed()) {
    nav("/orgs", { replace: true });
  }
}, [nav]); // ❌ Falta isAuthed
```

### 2. **Manejo Silencioso de Errores**
**Ubicación:** Múltiples archivos
```typescript
// Layout.tsx:46, 58, 69
catch (err) {
  // Silently fail ❌
}

// Board.tsx:56
catch (err) {
  // Silently fail ❌
}

// TimeTracker.tsx:51
catch (err) {
  // Silently fail ❌
}
```
**Problema:** Los errores se ignoran sin notificar al usuario.
**Impacto:** Alto - El usuario no sabe qué salió mal.

### 3. **Redirección Forzada con window.location**
**Ubicación:** `frontend/src/api/http.ts:34`
```typescript
if (window.location.pathname !== "/login") {
  window.location.href = "/login"; // ❌ Fuerza recarga completa
}
```
**Problema:** Usa `window.location.href` en lugar de React Router, causando recarga completa de la app.
**Impacto:** Medio - Pérdida de estado y peor UX.

### 4. **Falta de Validación de Token**
**Ubicación:** `frontend/src/auth/token.ts:6`
```typescript
export const isAuthed = () => !!getToken();
```
**Problema:** Solo verifica existencia del token, no su validez o expiración.
**Impacto:** Alto - Usuario puede tener token expirado y no saberlo.

---

## 🔒 PROBLEMAS DE SEGURIDAD

### 5. **Token en localStorage sin Expiración**
**Ubicación:** `frontend/src/auth/token.ts`
```typescript
export const setToken = (token: string) => localStorage.setItem(KEY, token);
```
**Problema:** No se valida expiración del token JWT en el frontend.
**Impacto:** Alto - Tokens expirados pueden seguir siendo usados.

### 6. **Falta de Validación de Permisos en Frontend**
**Ubicación:** Múltiples componentes
**Problema:** No se verifica si el usuario tiene permisos antes de mostrar acciones.
**Impacto:** Medio - UX confusa cuando el backend rechaza la acción.

### 7. **Información Sensible en URLs**
**Ubicación:** `frontend/src/pages/Board.tsx:53`
```typescript
const res = await http.get(`/api/orgs/${organizationId}/projects/${projectId}`);
```
**Problema:** IDs de organización y proyecto visibles en URLs y logs.
**Impacto:** Bajo - Puede ser información sensible en algunos contextos.

---

## ⚡ PROBLEMAS DE RENDIMIENTO

### 8. **Múltiples Llamadas API en Layout**
**Ubicación:** `frontend/src/components/Layout.tsx:32-39`
```typescript
useEffect(() => {
  if (organizationId) {
    loadOrgInfo();
    loadProjects();
  } else {
    loadOrgs();
  }
}, [organizationId]);
```
**Problema:** Se ejecuta en cada render del Layout, causando llamadas innecesarias.
**Impacto:** Medio - Consumo excesivo de recursos.

### 9. **Falta de Memoización en Cálculos**
**Ubicación:** `frontend/src/pages/Dashboard.tsx:69-72`
```typescript
const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0);
const activeTasks = projects.reduce((sum, p) => sum + p.activeTaskCount, 0);
const completedTasks = totalTasks - activeTasks;
const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
```
**Problema:** Se recalculan en cada render sin memoización.
**Impacto:** Bajo - Pero puede afectar con muchos proyectos.

### 10. **Filtrado en Render**
**Ubicación:** `frontend/src/pages/Dashboard.tsx:51-63`
```typescript
useEffect(() => {
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(...);
    setFilteredProjects(filtered);
  } else {
    setFilteredProjects(projects);
  }
}, [searchQuery, projects]);
```
**Problema:** Filtrado se ejecuta en cada cambio, sin debounce.
**Impacto:** Bajo - Puede ser lento con muchos datos.

---

## 🐛 PROBLEMAS DE LÓGICA

### 11. **Cálculo Incorrecto de Progreso**
**Ubicación:** `frontend/src/pages/Dashboard.tsx:241-243`
```typescript
const progress = project.taskCount > 0
  ? Math.round((project.activeTaskCount / project.taskCount) * 100)
  : 0;
```
**Problema:** Calcula progreso como `activas/total` en lugar de `completadas/total`.
**Impacto:** Alto - Muestra información incorrecta.

### 12. **Falta de Cleanup en useEffect**
**Ubicación:** `frontend/src/components/TimeTracker.tsx:23-34`
```typescript
useEffect(() => {
  checkActiveTimer();
  if (isRunning) {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }
}, [isRunning]);
```
**Problema:** `checkActiveTimer()` es async pero no se cancela si el componente se desmonta.
**Impacto:** Medio - Puede causar memory leaks.

### 13. **Race Conditions en Actualizaciones**
**Ubicación:** `frontend/src/pages/Board.tsx:85-108`
```typescript
const handleDrop = async (e: React.DragEvent, newStatus: string) => {
  // ...
  await http.patch(...);
  await loadTasks(); // ❌ Puede haber otra actualización en curso
};
```
**Problema:** No hay protección contra múltiples actualizaciones simultáneas.
**Impacto:** Medio - Puede causar estados inconsistentes.

---

## 🎨 PROBLEMAS DE UX/UI

### 14. **Mensajes de Error Genéricos**
**Ubicación:** Múltiples archivos
```typescript
setErr("Error cargando proyectos"); // ❌ Muy genérico
```
**Problema:** No dan contexto suficiente al usuario.
**Impacto:** Medio - UX confusa.

### 15. **Falta de Loading States Consistentes**
**Ubicación:** Varios componentes
**Problema:** Algunos componentes no muestran loading durante operaciones async.
**Impacto:** Bajo - Pero afecta percepción de rendimiento.

### 16. **Falta de Confirmación en Acciones Destructivas**
**Ubicación:** No implementado
**Problema:** No hay confirmaciones para eliminar proyectos/tareas.
**Impacto:** Alto - Riesgo de pérdida accidental de datos.

### 17. **Navegación Inconsistente**
**Ubicación:** `frontend/src/App.tsx:83`
```typescript
<Navigate to={isAuthed() ? "/org-select" : "/login"} replace />
```
**Problema:** Redirige a `/org-select` pero debería verificar si hay organización seleccionada.
**Impacto:** Medio - UX confusa.

---

## 📦 PROBLEMAS DE ARQUITECTURA

### 18. **Falta de Context API para Estado Global**
**Ubicación:** Toda la aplicación
**Problema:** No hay contexto para usuario actual, organización seleccionada, etc.
**Impacto:** Medio - Código duplicado y estado inconsistente.

### 19. **Lógica de Negocio en Componentes**
**Ubicación:** Múltiples componentes
**Problema:** Lógica de API y validación mezclada con UI.
**Impacto:** Medio - Dificulta testing y mantenimiento.

### 20. **Falta de Tipos Compartidos**
**Ubicación:** Frontend
**Problema:** Tipos duplicados en múltiples archivos (Project, Task, Org).
**Impacto:** Bajo - Pero causa mantenimiento difícil.

---

## 🔧 PROBLEMAS DE CÓDIGO

### 21. **Uso de `any` Type**
**Ubicación:** Múltiples archivos
```typescript
catch (ex: any) { // ❌
```
**Problema:** Pierde type safety de TypeScript.
**Impacto:** Medio - Más propenso a errores.

### 22. **Código Duplicado**
**Ubicación:** Múltiples archivos
**Problema:** Lógica de manejo de errores duplicada en cada componente.
**Impacto:** Bajo - Pero dificulta mantenimiento.

### 23. **Falta de Validación de Entrada**
**Ubicación:** `frontend/src/pages/Projects.tsx:36-49`
**Problema:** No valida que `organizationId` sea un GUID válido.
**Impacto:** Bajo - Pero puede causar errores 400.

### 24. **Hardcoded Values**
**Ubicación:** `frontend/src/pages/Board.tsx:25`
```typescript
const STATUSES = ["To Do", "In Progress", "Blocked", "Review", "Done"];
```
**Problema:** Estados hardcodeados en lugar de venir del backend.
**Impacto:** Medio - No es flexible.

---

## 🌐 PROBLEMAS DE BACKEND

### 25. **Falta de Validación de Organización en Proyectos**
**Ubicación:** `backend/ChroneTask.Api/Controllers/ProjectsController.cs`
**Problema:** No se verifica que el proyecto pertenezca a la organización.
**Impacto:** Alto - Seguridad comprometida.

### 26. **N+1 Query Problem**
**Ubicación:** Múltiples controladores
**Problema:** Posibles queries N+1 al cargar relaciones.
**Impacto:** Medio - Rendimiento pobre con muchos datos.

### 27. **Falta de Paginación**
**Ubicación:** Todos los endpoints GET
**Problema:** No hay paginación, puede traer miles de registros.
**Impacto:** Alto - Rendimiento y memoria.

---

## 📊 PRIORIZACIÓN

### 🔴 CRÍTICO (Resolver Inmediatamente)
1. Dependencias faltantes en useEffect
2. Manejo silencioso de errores
3. Cálculo incorrecto de progreso
4. Falta de validación de organización en proyectos

### 🟠 ALTO (Resolver Pronto)
5. Token sin validación de expiración
6. Redirección forzada con window.location
7. Falta de confirmación en acciones destructivas
8. Falta de paginación

### 🟡 MEDIO (Mejorar Cuando Sea Posible)
9. Múltiples llamadas API en Layout
10. Race conditions
11. Falta de Context API
12. Mensajes de error genéricos

### 🟢 BAJO (Mejoras Futuras)
13. Falta de memoización
14. Uso de `any` type
15. Código duplicado
16. Hardcoded values

---

## ✅ RECOMENDACIONES

1. **Agregar ESLint rules** para detectar dependencias faltantes
2. **Implementar error boundary** para capturar errores globales
3. **Crear hook personalizado** para manejo de errores
4. **Implementar Context API** para estado global
5. **Agregar validación de JWT** en frontend
6. **Implementar paginación** en backend
7. **Agregar tests** para lógica crítica
8. **Documentar APIs** con Swagger/OpenAPI
