using ChroneTask.Api.Data;
using ChroneTask.Api.Entities;
using Microsoft.EntityFrameworkCore;
using TaskEntity = ChroneTask.Api.Entities.Task;
using SystemTask = System.Threading.Tasks.Task;

namespace ChroneTask.Api.Helpers;

public static class NotificationHelper
{
    public static async SystemTask CreateNotificationAsync(
        ChroneTaskDbContext db,
        Guid userId,
        string type,
        string? title,
        string? message,
        Guid? projectId = null,
        Guid? taskId = null,
        Guid? triggeredByUserId = null)
    {
        try
        {
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                ProjectId = projectId,
                TaskId = taskId,
                TriggeredByUserId = triggeredByUserId
            };

            db.Notifications.Add(notification);
            await db.SaveChangesAsync();
            
            Console.WriteLine($"✅ Notificación creada: Tipo={type}, Usuario={userId}, Título={title}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error creando notificación: {ex.Message}");
            Console.WriteLine($"   Tipo: {type}, Usuario: {userId}, Título: {title}");
            // No lanzar la excepción para no romper el flujo principal
        }
    }

    public static async SystemTask NotifyTaskStatusChangeAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        string oldStatus,
        string newStatus,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que hizo el cambio
        var changer = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var changerName = changer?.FullName ?? "Un usuario";

        // Notificar al asignado si existe y no es el que hizo el cambio
        if (task.AssignedToId.HasValue && task.AssignedToId.Value != triggeredByUserId)
        {
            await CreateNotificationAsync(
                db,
                task.AssignedToId.Value,
                "task_status_change",
                "Cambio de estado de tarea",
                $"{changerName} cambió el estado de la tarea '{task.Title}' de '{oldStatus}' a '{newStatus}'",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }

        // Notificar a TODOS los miembros del proyecto (excepto al que hizo el cambio)
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == task.ProjectId && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var memberId in projectMembers)
        {
            // No notificar al asignado dos veces
            if (task.AssignedToId.HasValue && task.AssignedToId.Value == memberId)
                continue;

            await CreateNotificationAsync(
                db,
                memberId,
                "task_status_change",
                "Cambio de estado de tarea",
                $"{changerName} cambió el estado de la tarea '{task.Title}' de '{oldStatus}' a '{newStatus}'",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyTaskCompletedAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que completó la tarea
        var completer = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var completerName = completer?.FullName ?? "Un usuario";

        // Notificar a TODOS los miembros del proyecto (excepto al que completó)
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == task.ProjectId && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var memberId in projectMembers)
        {
            await CreateNotificationAsync(
                db,
                memberId,
                "task_completed",
                "Tarea completada",
                $"{completerName} completó la tarea '{task.Title}'",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyTaskBlockedAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que bloqueó la tarea
        var blocker = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var blockerName = blocker?.FullName ?? "Un usuario";

        // Notificar al asignado si existe y no es el que bloqueó
        if (task.AssignedToId.HasValue && task.AssignedToId.Value != triggeredByUserId)
        {
            await CreateNotificationAsync(
                db,
                task.AssignedToId.Value,
                "task_blocked",
                "Tarea bloqueada",
                $"{blockerName} bloqueó la tarea '{task.Title}'",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }

        // Notificar a TODOS los miembros del proyecto (excepto al que bloqueó)
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == task.ProjectId && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var memberId in projectMembers)
        {
            // No notificar al asignado dos veces
            if (task.AssignedToId.HasValue && task.AssignedToId.Value == memberId)
                continue;

            await CreateNotificationAsync(
                db,
                memberId,
                "task_blocked",
                "Tarea bloqueada",
                $"{blockerName} bloqueó la tarea '{task.Title}'",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyTaskOverdueAsync(
        ChroneTaskDbContext db,
        TaskEntity task)
    {
        if (task.AssignedToId.HasValue)
        {
            await CreateNotificationAsync(
                db,
                task.AssignedToId.Value,
                "task_overdue",
                "Tarea vencida",
                $"La tarea '{task.Title}' está vencida",
                task.ProjectId,
                task.Id);
        }
    }

    public static async SystemTask NotifySlaWarningAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        int hoursRemaining)
    {
        if (task.AssignedToId.HasValue)
        {
            await CreateNotificationAsync(
                db,
                task.AssignedToId.Value,
                "sla_warning",
                "Advertencia de SLA",
                $"La tarea '{task.Title}' tiene {hoursRemaining} horas restantes para cumplir el SLA",
                task.ProjectId,
                task.Id);
        }
    }

    public static async SystemTask NotifyNewProjectAsync(
        ChroneTaskDbContext db,
        Project project,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que creó el proyecto
        var creator = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var creatorName = creator?.FullName ?? "Un usuario";

        // Si es un proyecto organizacional, notificar a todos los miembros de la organización
        if (project.OrganizationId.HasValue)
        {
            var orgMembers = await db.OrganizationMembers
                .Where(om => om.OrganizationId == project.OrganizationId.Value && om.UserId != triggeredByUserId)
                .Select(om => om.UserId)
                .ToListAsync();

            foreach (var memberId in orgMembers)
            {
                await CreateNotificationAsync(
                    db,
                    memberId,
                    "new_project",
                    "Nuevo proyecto creado",
                    $"{creatorName} creó el proyecto '{project.Name}'",
                    project.Id,
                    null,
                    triggeredByUserId);
            }
        }
        // Si es un proyecto personal, no notificar a otros (es personal del usuario)
    }

    public static async SystemTask NotifyNewTaskAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que creó la tarea
        var creator = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var creatorName = creator?.FullName ?? "Un usuario";

        // Notificar al usuario asignado si existe y no es el creador
        if (task.AssignedToId.HasValue && task.AssignedToId.Value != triggeredByUserId)
        {
            await CreateNotificationAsync(
                db,
                task.AssignedToId.Value,
                "new_task",
                "Nueva tarea asignada",
                $"{creatorName} creó la tarea '{task.Title}' y te la asignó",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }

        // Notificar a todos los miembros del proyecto (excepto al creador y al asignado si ya fue notificado)
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == task.ProjectId && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var memberId in projectMembers)
        {
            // No notificar al asignado dos veces
            if (task.AssignedToId.HasValue && task.AssignedToId.Value == memberId)
                continue;

            await CreateNotificationAsync(
                db,
                memberId,
                "new_task",
                "Nueva tarea creada",
                $"{creatorName} creó la tarea '{task.Title}' en el proyecto",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyNewCalendarEventAsync(
        ChroneTaskDbContext db,
        PersonalCalendarEvent calendarEvent,
        Guid triggeredByUserId)
    {
        // Para eventos del calendario personal, solo notificar al usuario mismo si tiene recordatorio
        // La notificación de recordatorio ya se maneja en el controlador
        // Aquí podemos agregar una notificación de confirmación opcional
        if (calendarEvent.HasReminder)
        {
            await CreateNotificationAsync(
                db,
                triggeredByUserId,
                "calendar_event_created",
                "Evento del calendario creado",
                $"Se creó el evento '{calendarEvent.Title}' con recordatorio",
                calendarEvent.RelatedProjectId,
                calendarEvent.RelatedTaskId,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyNewCommentAsync(
        ChroneTaskDbContext db,
        TaskComment comment,
        Guid projectId,
        Guid taskId,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que comentó
        var creator = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var creatorName = creator?.FullName ?? "Un usuario";

        // Obtener la tarea
        var task = await db.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId);

        // Notificar al asignado de la tarea si existe y no es el que comentó
        if (task != null && task.AssignedToId.HasValue && task.AssignedToId.Value != triggeredByUserId)
        {
            await CreateNotificationAsync(
                db,
                task.AssignedToId.Value,
                "new_comment",
                "Nuevo comentario en tarea",
                $"{creatorName} comentó en la tarea '{task.Title}'",
                projectId,
                taskId,
                triggeredByUserId);
        }

        // Notificar a todos los miembros del proyecto (excepto al que comentó)
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == projectId && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var memberId in projectMembers)
        {
            // No notificar al asignado dos veces
            if (task != null && task.AssignedToId.HasValue && task.AssignedToId.Value == memberId)
                continue;

            await CreateNotificationAsync(
                db,
                memberId,
                "new_comment",
                "Nuevo comentario en tarea",
                $"{creatorName} comentó en la tarea '{task?.Title ?? "Tarea"}'",
                projectId,
                taskId,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyNewProjectCommentAsync(
        ChroneTaskDbContext db,
        ProjectComment comment,
        Guid projectId,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que comentó
        var creator = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var creatorName = creator?.FullName ?? "Un usuario";

        // Obtener el proyecto
        var project = await db.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId);

        // Notificar a todos los miembros del proyecto (excepto al que comentó)
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == projectId && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var memberId in projectMembers)
        {
            await CreateNotificationAsync(
                db,
                memberId,
                "new_project_comment",
                "Nuevo comentario en proyecto",
                $"{creatorName} comentó en el proyecto '{project?.Name ?? "Proyecto"}'",
                projectId,
                null,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyProjectMemberAddedAsync(
        ChroneTaskDbContext db,
        Guid projectId,
        Guid addedUserId,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que agregó al miembro
        var adder = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var adderName = adder?.FullName ?? "Un usuario";

        // Obtener el proyecto
        var project = await db.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId);

        // Notificar al usuario que fue agregado
        await CreateNotificationAsync(
            db,
            addedUserId,
            "project_member_added",
            "Agregado a proyecto",
            $"{adderName} te agregó al proyecto '{project?.Name ?? "Proyecto"}'",
            projectId,
            null,
            triggeredByUserId);

        // Notificar a otros miembros del proyecto sobre el nuevo miembro
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == projectId && pm.UserId != triggeredByUserId && pm.UserId != addedUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        var addedUser = await db.Users
            .FirstOrDefaultAsync(u => u.Id == addedUserId);
        var addedUserName = addedUser?.FullName ?? "Un usuario";

        foreach (var memberId in projectMembers)
        {
            await CreateNotificationAsync(
                db,
                memberId,
                "project_member_added",
                "Nuevo miembro en proyecto",
                $"{addedUserName} fue agregado al proyecto '{project?.Name ?? "Proyecto"}'",
                projectId,
                null,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyTaskAssignedAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        Guid? previousAssignedToId,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que asignó la tarea
        var assigner = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var assignerName = assigner?.FullName ?? "Un usuario";

        // Si se asignó a un usuario nuevo
        if (task.AssignedToId.HasValue && task.AssignedToId.Value != triggeredByUserId)
        {
            // Si cambió de asignado
            if (previousAssignedToId.HasValue && previousAssignedToId.Value != task.AssignedToId.Value)
            {
                // Notificar al nuevo asignado
                await CreateNotificationAsync(
                    db,
                    task.AssignedToId.Value,
                    "task_assigned",
                    "Tarea asignada",
                    $"{assignerName} te asignó la tarea '{task.Title}'",
                    task.ProjectId,
                    task.Id,
                    triggeredByUserId);

                // Notificar al anterior asignado (si existe y no es el que asignó)
                if (previousAssignedToId.Value != triggeredByUserId)
                {
                    await CreateNotificationAsync(
                        db,
                        previousAssignedToId.Value,
                        "task_unassigned",
                        "Tarea desasignada",
                        $"La tarea '{task.Title}' ya no está asignada a ti",
                        task.ProjectId,
                        task.Id,
                        triggeredByUserId);
                }
            }
            // Si se asignó por primera vez
            else if (!previousAssignedToId.HasValue)
            {
                await CreateNotificationAsync(
                    db,
                    task.AssignedToId.Value,
                    "task_assigned",
                    "Tarea asignada",
                    $"{assignerName} te asignó la tarea '{task.Title}'",
                    task.ProjectId,
                    task.Id,
                    triggeredByUserId);
            }
        }
        // Si se desasignó la tarea
        else if (previousAssignedToId.HasValue && !task.AssignedToId.HasValue && previousAssignedToId.Value != triggeredByUserId)
        {
            await CreateNotificationAsync(
                db,
                previousAssignedToId.Value,
                "task_unassigned",
                "Tarea desasignada",
                $"La tarea '{task.Title}' ya no está asignada a ti",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }
    }

    public static async SystemTask NotifyNewProjectNoteAsync(
        ChroneTaskDbContext db,
        ProjectNote note,
        Guid triggeredByUserId)
    {
        // Obtener el nombre del usuario que creó la nota
        var creator = await db.Users
            .FirstOrDefaultAsync(u => u.Id == triggeredByUserId);
        var creatorName = creator?.FullName ?? "Un usuario";

        // Obtener el proyecto para verificar si es organizacional o personal
        var project = await db.Projects
            .FirstOrDefaultAsync(p => p.Id == note.ProjectId);

        if (project == null) return;

        // Si es un proyecto organizacional, notificar a todos los miembros de la organización
        if (project.OrganizationId.HasValue)
        {
            var orgMembers = await db.OrganizationMembers
                .Where(om => om.OrganizationId == project.OrganizationId.Value && om.UserId != triggeredByUserId)
                .Select(om => om.UserId)
                .ToListAsync();

            foreach (var memberId in orgMembers)
            {
                await CreateNotificationAsync(
                    db,
                    memberId,
                    "new_project_note",
                    "Nueva nota del proyecto",
                    $"{creatorName} agregó una nota al proyecto",
                    note.ProjectId,
                    null,
                    triggeredByUserId);
            }
        }

        // Notificar a TODOS los miembros del proyecto (excepto al creador)
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == note.ProjectId && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var memberId in projectMembers)
        {
            await CreateNotificationAsync(
                db,
                memberId,
                "new_project_note",
                "Nueva nota del proyecto",
                $"{creatorName} agregó una nota al proyecto",
                note.ProjectId,
                null,
                triggeredByUserId);
        }
    }

    public static SystemTask NotifyNewPersonalNoteAsync(
        ChroneTaskDbContext db,
        PersonalNote note,
        Guid triggeredByUserId)
    {
        // Para notas personales, solo notificar al usuario mismo (opcional)
        // O podemos no notificar ya que es personal
        // Por ahora, no notificamos para evitar spam
        return SystemTask.CompletedTask;
    }
}
