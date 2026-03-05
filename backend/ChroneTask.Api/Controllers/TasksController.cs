using ChroneTask.Api.Data;
using ChroneTask.Api.Dtos;
using ChroneTask.Api.Entities;
using ChroneTask.Api.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TaskEntity = ChroneTask.Api.Entities.Task;

namespace ChroneTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:guid}/tasks")]
public class TasksController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public TasksController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/projects/{projectId}/tasks
    [HttpGet]
    public async Task<ActionResult<List<TaskResponse>>> GetAll(Guid projectId)
    {
        try
        {
            Guid userId;
            try
            {
                userId = UserContext.GetUserId(User);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Authentication required" });
            }

            // Verificar que el usuario es miembro del proyecto
            var isMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

            if (!isMember)
                return StatusCode(403, new { message = "You are not a member of this project" });

            // Obtener las tareas con un LEFT JOIN para obtener los usuarios asignados de una vez
            var tasksQuery = from task in _db.Tasks
                            where task.ProjectId == projectId
                            join user in _db.Users on task.AssignedToId equals user.Id into userGroup
                            from assignedUser in userGroup.DefaultIfEmpty()
                            orderby task.CreatedAt descending
                            select new
                            {
                                Task = task,
                                AssignedToName = assignedUser != null ? assignedUser.FullName : null
                            };

            var tasksWithUsers = await tasksQuery.ToListAsync();

            // Construir las respuestas
            var taskResponses = tasksWithUsers.Select(t => new TaskResponse
            {
                Id = t.Task.Id,
                Title = t.Task.Title,
                Description = t.Task.Description,
                ProjectId = t.Task.ProjectId,
                Type = t.Task.Type,
                Status = t.Task.Status,
                Priority = t.Task.Priority,
                AssignedToId = t.Task.AssignedToId,
                AssignedToName = t.AssignedToName,
                StartDate = t.Task.StartDate,
                DueDate = t.Task.DueDate,
                EstimatedMinutes = t.Task.EstimatedMinutes,
                TotalMinutes = t.Task.TotalMinutes,
                Tags = t.Task.Tags,
                CreatedAt = t.Task.CreatedAt,
                UpdatedAt = t.Task.UpdatedAt
            }).ToList();

            return Ok(taskResponses);
        }
        catch (DbUpdateException dbEx)
        {
            Console.WriteLine($"❌ Error de base de datos en GetAll tasks: {dbEx.Message}");
            Console.WriteLine($"Inner exception: {dbEx.InnerException?.Message}");
            return StatusCode(500, new
            {
                error = "Database error",
                message = dbEx.InnerException?.Message ?? dbEx.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error inesperado en GetAll tasks: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message,
                innerException = ex.InnerException?.Message
            });
        }
    }

    // GET: api/projects/{projectId}/tasks/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskResponse>> GetById(Guid projectId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var task = await _db.Tasks
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task is null)
            return NotFound();

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        return Ok(new TaskResponse
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            ProjectId = task.ProjectId,
            Type = task.Type,
            Status = task.Status,
            Priority = task.Priority,
            AssignedToId = task.AssignedToId,
            AssignedToName = task.AssignedTo != null ? task.AssignedTo.FullName : null,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedMinutes = task.EstimatedMinutes,
            TotalMinutes = task.TotalMinutes,
            Tags = task.Tags,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        });
    }

    // POST: api/projects/{projectId}/tasks
    [HttpPost]
    public async Task<ActionResult<TaskResponse>> Create(Guid projectId, [FromBody] TaskCreateRequest request)
    {
        try
        {
            Console.WriteLine($"🔵 Create task - ProjectId: {projectId}");
            Console.WriteLine($"🔵 Request recibido: {JsonSerializer.Serialize(request)}");

            // Validar que el request no sea null
            if (request == null)
            {
                Console.WriteLine("❌ Request es null");
                return BadRequest(new { message = "Request body is required" });
            }

            // Validar modelo
            if (!ModelState.IsValid)
            {
                var errors = ModelState.SelectMany(x => x.Value?.Errors.Select(e => e.ErrorMessage) ?? Enumerable.Empty<string>());
                Console.WriteLine($"❌ ModelState inválido: {string.Join(", ", errors)}");
                return BadRequest(ModelState);
            }

            Guid userId;
            try
            {
                userId = UserContext.GetUserId(User);
                Console.WriteLine($"🔵 UserId: {userId}");
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"❌ UnauthorizedAccessException: {ex.Message}");
                return Unauthorized(new { message = "Authentication required" });
            }

            // Verificar que el proyecto existe
            var projectExists = await _db.Projects
                .AnyAsync(p => p.Id == projectId && p.IsActive);

            Console.WriteLine($"🔵 Project exists: {projectExists}");

            if (!projectExists)
            {
                Console.WriteLine($"❌ Project not found: {projectId}");
                return NotFound(new { message = "Project not found" });
            }

            // Verificar que el usuario es miembro del proyecto
            var isMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

            Console.WriteLine($"🔵 Is member: {isMember}");

            if (!isMember)
            {
                Console.WriteLine($"❌ User {userId} is not a member of project {projectId}");
                return StatusCode(403, new { message = "You are not a member of this project" });
            }

            // Validar que el título no esté vacío
            if (string.IsNullOrWhiteSpace(request?.Title))
            {
                Console.WriteLine("❌ Title is empty");
                return BadRequest(new { message = "Title is required" });
            }

            // Si se asigna un usuario, verificar que es miembro del proyecto
            if (request.AssignedToId.HasValue)
            {
                var isAssignedUserMember = await _db.ProjectMembers
                    .AnyAsync(m => m.ProjectId == projectId && m.UserId == request.AssignedToId.Value);

                if (!isAssignedUserMember)
                    return BadRequest(new { message = "The assigned user must be a member of the project" });
            }

            Console.WriteLine($"🔵 Creando tarea con Type: {request.Type ?? "Task"}");

            // Convertir fechas a UTC si no lo están (PostgreSQL requiere UTC)
            DateTime? startDateUtc = null;
            if (request.StartDate.HasValue)
            {
                var startDate = request.StartDate.Value;
                if (startDate.Kind == DateTimeKind.Unspecified)
                {
                    // Asumir que es UTC si no está especificado
                    startDateUtc = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
                }
                else if (startDate.Kind == DateTimeKind.Local)
                {
                    startDateUtc = startDate.ToUniversalTime();
                }
                else
                {
                    startDateUtc = startDate;
                }
            }

            DateTime? dueDateUtc = null;
            if (request.DueDate.HasValue)
            {
                var dueDate = request.DueDate.Value;
                if (dueDate.Kind == DateTimeKind.Unspecified)
                {
                    // Asumir que es UTC si no está especificado
                    dueDateUtc = DateTime.SpecifyKind(dueDate, DateTimeKind.Utc);
                }
                else if (dueDate.Kind == DateTimeKind.Local)
                {
                    dueDateUtc = dueDate.ToUniversalTime();
                }
                else
                {
                    dueDateUtc = dueDate;
                }
            }

            var task = new TaskEntity
            {
                Title = request.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                ProjectId = projectId,
                Type = request.Type ?? "Task",
                Status = "To Do",
                Priority = string.IsNullOrWhiteSpace(request.Priority) ? null : request.Priority,
                AssignedToId = request.AssignedToId,
                StartDate = startDateUtc,
                DueDate = dueDateUtc,
                EstimatedMinutes = request.EstimatedMinutes,
                Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : request.Tags.Trim()
            };

            Console.WriteLine($"🔵 Task entity creada, agregando a DbContext...");
            _db.Tasks.Add(task);
            
            Console.WriteLine($"🔵 Guardando cambios en la base de datos...");
            await _db.SaveChangesAsync();
            Console.WriteLine($"✅ Tarea guardada exitosamente con ID: {task.Id}");

            // Notificar a los miembros del proyecto sobre la nueva tarea
            await NotificationHelper.NotifyNewTaskAsync(_db, task, userId);

            // Cargar el usuario asignado si existe
            string? assignedToName = null;
            if (task.AssignedToId.HasValue)
            {
                try
                {
                    var assignedUser = await _db.Users
                        .FirstOrDefaultAsync(u => u.Id == task.AssignedToId.Value);
                    assignedToName = assignedUser?.FullName;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Error cargando usuario asignado: {ex.Message}");
                    // Continuar sin el nombre del usuario asignado
                }
            }

            Console.WriteLine($"🔵 Construyendo respuesta...");
            var response = new TaskResponse
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                ProjectId = task.ProjectId,
                Type = task.Type,
                Status = task.Status,
                Priority = task.Priority,
                AssignedToId = task.AssignedToId,
                AssignedToName = assignedToName,
                StartDate = task.StartDate,
                DueDate = task.DueDate,
                EstimatedMinutes = task.EstimatedMinutes,
                TotalMinutes = task.TotalMinutes,
                Tags = task.Tags,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt
            };

            Console.WriteLine($"✅ Tarea creada exitosamente");
            return CreatedAtAction(nameof(GetById), new { projectId, id = task.Id }, response);
        }
        catch (DbUpdateException dbEx)
        {
            Console.WriteLine($"❌ Error de base de datos al crear tarea: {dbEx.Message}");
            Console.WriteLine($"Inner exception: {dbEx.InnerException?.Message}");
            Console.WriteLine($"Stack trace: {dbEx.StackTrace}");
            if (dbEx.InnerException != null)
            {
                Console.WriteLine($"Inner stack trace: {dbEx.InnerException.StackTrace}");
            }
            return StatusCode(500, new
            {
                error = "Database error",
                message = dbEx.InnerException?.Message ?? dbEx.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error inesperado al crear tarea: {ex.Message}");
            Console.WriteLine($"Tipo de excepción: {ex.GetType().FullName}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                Console.WriteLine($"Inner stack trace: {ex.InnerException.StackTrace}");
            }
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message,
                type = ex.GetType().Name,
                innerException = ex.InnerException?.Message
            });
        }
    }

    // PATCH: api/projects/{projectId}/tasks/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<TaskResponse>> Update(Guid projectId, Guid id, [FromBody] TaskCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var task = await _db.Tasks
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task is null)
            return NotFound();

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        // Guardar el asignado anterior y el estado anterior para notificaciones
        var previousAssignedToId = task.AssignedToId;
        var previousStatus = task.Status;

        task.Title = request.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        task.Type = request.Type;
        task.Priority = string.IsNullOrWhiteSpace(request.Priority) ? null : request.Priority;
        task.AssignedToId = request.AssignedToId;
        
        // Si se actualiza el estado, también guardarlo
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            task.Status = request.Status;
        }
        
        // Convertir fechas a UTC si no lo están (PostgreSQL requiere UTC)
        if (request.StartDate.HasValue)
        {
            var startDate = request.StartDate.Value;
            if (startDate.Kind == DateTimeKind.Unspecified)
            {
                task.StartDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
            }
            else if (startDate.Kind == DateTimeKind.Local)
            {
                task.StartDate = startDate.ToUniversalTime();
            }
            else
            {
                task.StartDate = startDate;
            }
        }
        else
        {
            task.StartDate = null;
        }

        if (request.DueDate.HasValue)
        {
            var dueDate = request.DueDate.Value;
            if (dueDate.Kind == DateTimeKind.Unspecified)
            {
                task.DueDate = DateTime.SpecifyKind(dueDate, DateTimeKind.Utc);
            }
            else if (dueDate.Kind == DateTimeKind.Local)
            {
                task.DueDate = dueDate.ToUniversalTime();
            }
            else
            {
                task.DueDate = dueDate;
            }
        }
        else
        {
            task.DueDate = null;
        }

        task.EstimatedMinutes = request.EstimatedMinutes;
        task.Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : request.Tags.Trim();
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Notificar si cambió la asignación
        if (previousAssignedToId != task.AssignedToId)
        {
            await NotificationHelper.NotifyTaskAssignedAsync(_db, task, previousAssignedToId, userId);
        }

        // Notificar si cambió el estado
        if (!string.IsNullOrWhiteSpace(request.Status) && previousStatus != task.Status)
        {
            if (task.Status == "Done")
            {
                await NotificationHelper.NotifyTaskCompletedAsync(_db, task, userId);
            }
            else if (task.Status == "Blocked")
            {
                await NotificationHelper.NotifyTaskBlockedAsync(_db, task, userId);
            }
            else
            {
                await NotificationHelper.NotifyTaskStatusChangeAsync(_db, task, previousStatus, task.Status, userId);
            }
        }

        // Recargar el usuario asignado si cambió
        if (task.AssignedToId.HasValue)
        {
            await _db.Entry(task).Reference(t => t.AssignedTo).LoadAsync();
        }

        return Ok(new TaskResponse
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            ProjectId = task.ProjectId,
            Type = task.Type,
            Status = task.Status,
            Priority = task.Priority,
            AssignedToId = task.AssignedToId,
            AssignedToName = task.AssignedTo != null ? task.AssignedTo.FullName : null,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedMinutes = task.EstimatedMinutes,
            TotalMinutes = task.TotalMinutes,
            Tags = task.Tags,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        });
    }

    // PATCH: api/projects/{projectId}/tasks/{id}/assign
    [HttpPatch("{id:guid}/assign")]
    public async Task<ActionResult<TaskResponse>> AssignTask(Guid projectId, Guid id, [FromBody] Guid? assignedToId)
    {
        var userId = UserContext.GetUserId(User);

        var task = await _db.Tasks
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task is null)
            return NotFound();

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        // Si se asigna un usuario, verificar que es miembro del proyecto
        if (assignedToId.HasValue)
        {
            var isAssignedUserMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == projectId && m.UserId == assignedToId.Value);

            if (!isAssignedUserMember)
                return BadRequest(new { message = "The assigned user must be a member of the project" });
        }

        // Guardar el asignado anterior para notificaciones
        var previousAssignedToId = task.AssignedToId;

        task.AssignedToId = assignedToId;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Notificar si cambió la asignación
        if (previousAssignedToId != task.AssignedToId)
        {
            await NotificationHelper.NotifyTaskAssignedAsync(_db, task, previousAssignedToId, userId);
        }

        // Recargar el usuario asignado si existe
        if (task.AssignedToId.HasValue)
        {
            await _db.Entry(task).Reference(t => t.AssignedTo).LoadAsync();
        }

        return Ok(new TaskResponse
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            ProjectId = task.ProjectId,
            Type = task.Type,
            Status = task.Status,
            Priority = task.Priority,
            AssignedToId = task.AssignedToId,
            AssignedToName = task.AssignedTo != null ? task.AssignedTo.FullName : null,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedMinutes = task.EstimatedMinutes,
            TotalMinutes = task.TotalMinutes,
            Tags = task.Tags,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        });
    }

    // PATCH: api/projects/{projectId}/tasks/{id}/status
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TaskResponse>> UpdateStatus(Guid projectId, Guid id, [FromBody] string status)
    {
        var userId = UserContext.GetUserId(User);

        var task = await _db.Tasks
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task is null)
            return NotFound();

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        // Validar estado
        var validStatuses = new[] { "To Do", "In Progress", "Blocked", "Review", "Done" };
        if (!validStatuses.Contains(status))
            return BadRequest(new { message = "Invalid status" });

        // Regla: no cerrar sin responsable
        if (status == "Done" && !task.AssignedToId.HasValue)
            return BadRequest(new { message = "Cannot close task without assignee" });

        var oldStatus = task.Status;
        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Crear notificaciones
        if (oldStatus != status)
        {
            if (status == "Done")
            {
                await NotificationHelper.NotifyTaskCompletedAsync(_db, task, userId);
            }
            else if (status == "Blocked")
            {
                await NotificationHelper.NotifyTaskBlockedAsync(_db, task, userId);
            }
            else
            {
                await NotificationHelper.NotifyTaskStatusChangeAsync(_db, task, oldStatus, status, userId);
            }
        }

        return Ok(new TaskResponse
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            ProjectId = task.ProjectId,
            Type = task.Type,
            Status = task.Status,
            Priority = task.Priority,
            AssignedToId = task.AssignedToId,
            AssignedToName = task.AssignedTo != null ? task.AssignedTo.FullName : null,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedMinutes = task.EstimatedMinutes,
            TotalMinutes = task.TotalMinutes,
            Tags = task.Tags,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        });
    }

    // DELETE: api/projects/{projectId}/tasks/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task is null)
            return NotFound();

        // Verificar permisos: solo PM o el asignado pueden eliminar
        var projectMember = await _db.ProjectMembers
            .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == userId);

        var canDelete = (projectMember != null && projectMember.Role == "pm") ||
                        (task.AssignedToId == userId);

        if (!canDelete)
            return StatusCode(403, new { message = "You don't have permission to delete this task" });

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/projects/{projectId}/tasks/{id}/time/start
    [HttpPost("{id:guid}/time/start")]
    public async Task<ActionResult<TimeEntryResponse>> StartTimer(Guid projectId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task is null)
            return NotFound();

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        // Verificar si ya hay un timer activo para este usuario
        var activeTimer = await _db.TimeEntries
            .FirstOrDefaultAsync(te => te.UserId == userId && te.EndedAt == null);

        if (activeTimer != null)
            return BadRequest(new { message = "You already have an active timer. Stop it first." });

        var timeEntry = new TimeEntry
        {
            TaskId = id,
            UserId = userId,
            StartedAt = DateTime.UtcNow,
            IsManual = false
        };

        _db.TimeEntries.Add(timeEntry);
        await _db.SaveChangesAsync();

        await _db.Entry(timeEntry).Reference(te => te.Task).LoadAsync();
        await _db.Entry(timeEntry).Reference(te => te.User).LoadAsync();

        return Ok(new TimeEntryResponse
        {
            Id = timeEntry.Id,
            TaskId = timeEntry.TaskId,
            TaskTitle = timeEntry.Task.Title,
            UserId = timeEntry.UserId,
            UserName = timeEntry.User.FullName,
            StartedAt = timeEntry.StartedAt,
            EndedAt = timeEntry.EndedAt,
            DurationMinutes = timeEntry.DurationMinutes,
            Description = timeEntry.Description,
            IsManual = timeEntry.IsManual,
            CreatedAt = timeEntry.CreatedAt
        });
    }

    // POST: api/projects/{projectId}/tasks/{id}/time/stop
    [HttpPost("{id:guid}/time/stop")]
    public async Task<ActionResult<TimeEntryResponse>> StopTimer(Guid projectId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task is null)
            return NotFound();

        // Buscar el timer activo para este usuario y tarea
        var timeEntry = await _db.TimeEntries
            .FirstOrDefaultAsync(te => te.TaskId == id && te.UserId == userId && te.EndedAt == null);

        if (timeEntry is null)
            return BadRequest(new { message = "No active timer found for this task" });

        timeEntry.EndedAt = DateTime.UtcNow;
        var duration = (int)(timeEntry.EndedAt.Value - timeEntry.StartedAt).TotalMinutes;
        timeEntry.DurationMinutes = duration;

        // Actualizar el tiempo total de la tarea
        task.TotalMinutes += duration;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(timeEntry).Reference(te => te.Task).LoadAsync();
        await _db.Entry(timeEntry).Reference(te => te.User).LoadAsync();

        return Ok(new TimeEntryResponse
        {
            Id = timeEntry.Id,
            TaskId = timeEntry.TaskId,
            TaskTitle = timeEntry.Task.Title,
            UserId = timeEntry.UserId,
            UserName = timeEntry.User.FullName,
            StartedAt = timeEntry.StartedAt,
            EndedAt = timeEntry.EndedAt,
            DurationMinutes = timeEntry.DurationMinutes,
            Description = timeEntry.Description,
            IsManual = timeEntry.IsManual,
            CreatedAt = timeEntry.CreatedAt
        });
    }

    // POST: api/projects/{projectId}/tasks/{id}/time
    [HttpPost("{id:guid}/time")]
    public async Task<ActionResult<TimeEntryResponse>> AddManualTime(Guid projectId, Guid id, [FromBody] TimeEntryRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == id && t.ProjectId == projectId);

        if (task is null)
            return NotFound();

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        if (!request.DurationMinutes.HasValue || request.DurationMinutes <= 0)
            return BadRequest(new { message = "Duration must be greater than 0" });

        // Convertir fechas a UTC si no lo están
        DateTime startedAtUtc = DateTime.UtcNow;
        if (request.StartedAt.HasValue)
        {
            var startedAt = request.StartedAt.Value;
            if (startedAt.Kind == DateTimeKind.Unspecified)
            {
                startedAtUtc = DateTime.SpecifyKind(startedAt, DateTimeKind.Utc);
            }
            else if (startedAt.Kind == DateTimeKind.Local)
            {
                startedAtUtc = startedAt.ToUniversalTime();
            }
            else
            {
                startedAtUtc = startedAt;
            }
        }

        DateTime? endedAtUtc = null;
        if (request.EndedAt.HasValue)
        {
            var endedAt = request.EndedAt.Value;
            if (endedAt.Kind == DateTimeKind.Unspecified)
            {
                endedAtUtc = DateTime.SpecifyKind(endedAt, DateTimeKind.Utc);
            }
            else if (endedAt.Kind == DateTimeKind.Local)
            {
                endedAtUtc = endedAt.ToUniversalTime();
            }
            else
            {
                endedAtUtc = endedAt;
            }
        }

        var timeEntry = new TimeEntry
        {
            TaskId = id,
            UserId = userId,
            StartedAt = startedAtUtc,
            EndedAt = endedAtUtc,
            DurationMinutes = request.DurationMinutes,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsManual = true
        };

        _db.TimeEntries.Add(timeEntry);

        // Actualizar el tiempo total de la tarea
        task.TotalMinutes += request.DurationMinutes.Value;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(timeEntry).Reference(te => te.Task).LoadAsync();
        await _db.Entry(timeEntry).Reference(te => te.User).LoadAsync();

        return Ok(new TimeEntryResponse
        {
            Id = timeEntry.Id,
            TaskId = timeEntry.TaskId,
            TaskTitle = timeEntry.Task.Title,
            UserId = timeEntry.UserId,
            UserName = timeEntry.User.FullName,
            StartedAt = timeEntry.StartedAt,
            EndedAt = timeEntry.EndedAt,
            DurationMinutes = timeEntry.DurationMinutes,
            Description = timeEntry.Description,
            IsManual = timeEntry.IsManual,
            CreatedAt = timeEntry.CreatedAt
        });
    }

    // GET: api/projects/{projectId}/tasks/{id}/time
    [HttpGet("{id:guid}/time")]
    public async Task<ActionResult<List<TimeEntryResponse>>> GetTimeEntries(Guid projectId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        var timeEntries = await _db.TimeEntries
            .Where(te => te.TaskId == id)
            .Include(te => te.Task)
            .Include(te => te.User)
            .OrderByDescending(te => te.CreatedAt)
            .Select(te => new TimeEntryResponse
            {
                Id = te.Id,
                TaskId = te.TaskId,
                TaskTitle = te.Task.Title,
                UserId = te.UserId,
                UserName = te.User.FullName,
                StartedAt = te.StartedAt,
                EndedAt = te.EndedAt,
                DurationMinutes = te.DurationMinutes,
                Description = te.Description,
                IsManual = te.IsManual,
                CreatedAt = te.CreatedAt
            })
            .ToListAsync();

        return Ok(timeEntries);
    }
}
