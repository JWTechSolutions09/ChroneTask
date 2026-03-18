using ChroneTask.Api.Data;
using ChroneTask.Api.Dtos;
using ChroneTask.Api.Entities;
using ChroneTask.Api.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChroneTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/users/me/calendar-events")]
public class PersonalCalendarEventsController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public PersonalCalendarEventsController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/users/me/calendar-events
    [HttpGet]
    public async Task<ActionResult<List<PersonalCalendarEventResponse>>> GetAll(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var userId = UserContext.GetUserId(User);

        var query = _db.PersonalCalendarEvents
            .Where(e => e.UserId == userId);

        // Filtrar por rango de fechas si se proporciona
        if (startDate.HasValue)
        {
            query = query.Where(e => e.StartDate >= startDate.Value || (e.EndDate.HasValue && e.EndDate.Value >= startDate.Value));
        }

        if (endDate.HasValue)
        {
            query = query.Where(e => e.StartDate <= endDate.Value);
        }

        var events = await query
            .OrderBy(e => e.StartDate)
            .Select(e => new PersonalCalendarEventResponse
            {
                Id = e.Id,
                UserId = e.UserId,
                Title = e.Title,
                Description = e.Description,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                Color = e.Color,
                Type = e.Type,
                AllDay = e.AllDay,
                HasReminder = e.HasReminder,
                ReminderMinutesBefore = e.ReminderMinutesBefore,
                RelatedTaskId = e.RelatedTaskId,
                RelatedProjectId = e.RelatedProjectId,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Ok(events);
    }

    // GET: api/users/me/calendar-events/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PersonalCalendarEventResponse>> GetById(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var calendarEvent = await _db.PersonalCalendarEvents
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (calendarEvent is null)
            return NotFound();

        return Ok(new PersonalCalendarEventResponse
        {
            Id = calendarEvent.Id,
            UserId = calendarEvent.UserId,
            Title = calendarEvent.Title,
            Description = calendarEvent.Description,
            StartDate = calendarEvent.StartDate,
            EndDate = calendarEvent.EndDate,
            Color = calendarEvent.Color,
            Type = calendarEvent.Type,
            AllDay = calendarEvent.AllDay,
            HasReminder = calendarEvent.HasReminder,
            ReminderMinutesBefore = calendarEvent.ReminderMinutesBefore,
            RelatedTaskId = calendarEvent.RelatedTaskId,
            RelatedProjectId = calendarEvent.RelatedProjectId,
            CreatedAt = calendarEvent.CreatedAt,
            UpdatedAt = calendarEvent.UpdatedAt
        });
    }

    // POST: api/users/me/calendar-events
    [HttpPost]
    public async Task<ActionResult<PersonalCalendarEventResponse>> Create([FromBody] PersonalCalendarEventCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        // Validar que las fechas sean correctas
        if (request.EndDate.HasValue && request.EndDate.Value < request.StartDate)
        {
            return BadRequest(new { message = "La fecha de fin no puede ser anterior a la fecha de inicio" });
        }

        // Validar que la tarea relacionada existe y pertenece al usuario (si se proporciona)
        if (request.RelatedTaskId.HasValue)
        {
            var task = await _db.Tasks
                .Include(t => t.Project)
                .ThenInclude(p => p.ProjectMembers)
                .FirstOrDefaultAsync(t => t.Id == request.RelatedTaskId.Value);

            if (task is null)
                return BadRequest(new { message = "La tarea especificada no existe" });

            // Verificar que el usuario tiene acceso a la tarea (es miembro del proyecto o es el dueño del proyecto personal)
            var hasAccess = task.Project.ProjectMembers.Any(pm => pm.UserId == userId) ||
                           (task.Project.UserId.HasValue && task.Project.UserId.Value == userId);

            if (!hasAccess)
                return Forbid();
        }

        // Validar que el proyecto relacionado existe y pertenece al usuario (si se proporciona)
        if (request.RelatedProjectId.HasValue)
        {
            var project = await _db.Projects
                .Include(p => p.ProjectMembers)
                .FirstOrDefaultAsync(p => p.Id == request.RelatedProjectId.Value);

            if (project is null)
                return BadRequest(new { message = "El proyecto especificado no existe" });

            var hasAccess = project.ProjectMembers.Any(pm => pm.UserId == userId) ||
                           (project.UserId.HasValue && project.UserId.Value == userId);

            if (!hasAccess)
                return Forbid();
        }

        var calendarEvent = new PersonalCalendarEvent
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim(),
            Type = string.IsNullOrWhiteSpace(request.Type) ? "event" : request.Type.Trim(),
            AllDay = request.AllDay,
            HasReminder = request.HasReminder,
            ReminderMinutesBefore = request.ReminderMinutesBefore,
            RelatedTaskId = request.RelatedTaskId,
            RelatedProjectId = request.RelatedProjectId
        };

        _db.PersonalCalendarEvents.Add(calendarEvent);
        await _db.SaveChangesAsync();

        // Notificar al usuario sobre el nuevo evento del calendario
        await NotificationHelper.NotifyNewCalendarEventAsync(_db, calendarEvent, userId);

        // Si el evento está ligado a un proyecto (org/equipo), notificar a los miembros del proyecto
        await NotificationHelper.NotifyNewCalendarEventForProjectMembersAsync(_db, calendarEvent, userId);

        // Crear notificación de recordatorio si está configurado
        if (calendarEvent.HasReminder && calendarEvent.ReminderMinutesBefore.HasValue)
        {
            var reminderTime = calendarEvent.StartDate.AddMinutes(-calendarEvent.ReminderMinutesBefore.Value);
            if (reminderTime > DateTime.UtcNow)
            {
                // La notificación se creará cuando se ejecute el job de recordatorios
                // Por ahora, creamos una notificación inmediata si el recordatorio es para ahora
                if (reminderTime <= DateTime.UtcNow.AddMinutes(1))
                {
                    await NotificationHelper.CreateNotificationAsync(
                        _db,
                        userId,
                        "calendar_reminder",
                        "Recordatorio de evento",
                        $"Recordatorio: {calendarEvent.Title}",
                        calendarEvent.RelatedProjectId,
                        calendarEvent.RelatedTaskId);
                }
            }
        }

        return Ok(new PersonalCalendarEventResponse
        {
            Id = calendarEvent.Id,
            UserId = calendarEvent.UserId,
            Title = calendarEvent.Title,
            Description = calendarEvent.Description,
            StartDate = calendarEvent.StartDate,
            EndDate = calendarEvent.EndDate,
            Color = calendarEvent.Color,
            Type = calendarEvent.Type,
            AllDay = calendarEvent.AllDay,
            HasReminder = calendarEvent.HasReminder,
            ReminderMinutesBefore = calendarEvent.ReminderMinutesBefore,
            RelatedTaskId = calendarEvent.RelatedTaskId,
            RelatedProjectId = calendarEvent.RelatedProjectId,
            CreatedAt = calendarEvent.CreatedAt,
            UpdatedAt = calendarEvent.UpdatedAt
        });
    }

    // PATCH: api/users/me/calendar-events/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<PersonalCalendarEventResponse>> Update(Guid id, [FromBody] PersonalCalendarEventCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var calendarEvent = await _db.PersonalCalendarEvents
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (calendarEvent is null)
            return NotFound();

        // Validar que las fechas sean correctas
        if (request.EndDate.HasValue && request.EndDate.Value < request.StartDate)
        {
            return BadRequest(new { message = "La fecha de fin no puede ser anterior a la fecha de inicio" });
        }

        calendarEvent.Title = request.Title.Trim();
        calendarEvent.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        calendarEvent.StartDate = request.StartDate;
        calendarEvent.EndDate = request.EndDate;
        calendarEvent.Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim();
        calendarEvent.Type = string.IsNullOrWhiteSpace(request.Type) ? "event" : request.Type.Trim();
        calendarEvent.AllDay = request.AllDay;
        calendarEvent.HasReminder = request.HasReminder;
        calendarEvent.ReminderMinutesBefore = request.ReminderMinutesBefore;
        calendarEvent.RelatedTaskId = request.RelatedTaskId;
        calendarEvent.RelatedProjectId = request.RelatedProjectId;
        calendarEvent.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new PersonalCalendarEventResponse
        {
            Id = calendarEvent.Id,
            UserId = calendarEvent.UserId,
            Title = calendarEvent.Title,
            Description = calendarEvent.Description,
            StartDate = calendarEvent.StartDate,
            EndDate = calendarEvent.EndDate,
            Color = calendarEvent.Color,
            Type = calendarEvent.Type,
            AllDay = calendarEvent.AllDay,
            HasReminder = calendarEvent.HasReminder,
            ReminderMinutesBefore = calendarEvent.ReminderMinutesBefore,
            RelatedTaskId = calendarEvent.RelatedTaskId,
            RelatedProjectId = calendarEvent.RelatedProjectId,
            CreatedAt = calendarEvent.CreatedAt,
            UpdatedAt = calendarEvent.UpdatedAt
        });
    }

    // DELETE: api/users/me/calendar-events/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var calendarEvent = await _db.PersonalCalendarEvents
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (calendarEvent is null)
            return NotFound();

        _db.PersonalCalendarEvents.Remove(calendarEvent);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
