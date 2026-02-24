using ChroneTask.Api.Data;
using ChroneTask.Api.Dtos;
using ChroneTask.Api.Entities;
using ChroneTask.Api.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        var tasks = await _db.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.AssignedTo)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TaskResponse
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                ProjectId = t.ProjectId,
                Type = t.Type,
                Status = t.Status,
                Priority = t.Priority,
                AssignedToId = t.AssignedToId,
                AssignedToName = t.AssignedTo != null ? t.AssignedTo.FullName : null,
                StartDate = t.StartDate,
                DueDate = t.DueDate,
                EstimatedMinutes = t.EstimatedMinutes,
                TotalMinutes = t.TotalMinutes,
                Tags = t.Tags,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return Ok(tasks);
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
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        var task = new TaskEntity
        {
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            ProjectId = projectId,
            Type = request.Type,
            Status = "To Do",
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? null : request.Priority,
            AssignedToId = request.AssignedToId,
            StartDate = request.StartDate,
            DueDate = request.DueDate,
            EstimatedMinutes = request.EstimatedMinutes,
            Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : request.Tags.Trim()
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        // Cargar el usuario asignado si existe
        if (task.AssignedToId.HasValue)
        {
            await _db.Entry(task).Reference(t => t.AssignedTo).LoadAsync();
        }

        return CreatedAtAction(nameof(GetById), new { projectId, id = task.Id }, new TaskResponse
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

        task.Title = request.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        task.Type = request.Type;
        task.Priority = string.IsNullOrWhiteSpace(request.Priority) ? null : request.Priority;
        task.AssignedToId = request.AssignedToId;
        task.StartDate = request.StartDate;
        task.DueDate = request.DueDate;
        task.EstimatedMinutes = request.EstimatedMinutes;
        task.Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : request.Tags.Trim();
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

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

        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

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

        var timeEntry = new TimeEntry
        {
            TaskId = id,
            UserId = userId,
            StartedAt = request.StartedAt ?? DateTime.UtcNow,
            EndedAt = request.EndedAt,
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
