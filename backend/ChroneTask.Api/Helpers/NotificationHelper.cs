using ChroneTask.Api.Data;
using ChroneTask.Api.Entities;
using Microsoft.EntityFrameworkCore;
using TaskEntity = ChroneTask.Api.Entities.Task;

namespace ChroneTask.Api.Helpers;

public static class NotificationHelper
{
    public static async Task CreateNotificationAsync(
        ChroneTaskDbContext db,
        Guid userId,
        string type,
        string? title,
        string? message,
        Guid? projectId = null,
        Guid? taskId = null,
        Guid? triggeredByUserId = null)
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
    }

    public static async Task NotifyTaskStatusChangeAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        string oldStatus,
        string newStatus,
        Guid triggeredByUserId)
    {
        // Notificar al asignado si existe
        if (task.AssignedToId.HasValue && task.AssignedToId.Value != triggeredByUserId)
        {
            await CreateNotificationAsync(
                db,
                task.AssignedToId.Value,
                "task_status_change",
                "Cambio de estado de tarea",
                $"La tarea '{task.Title}' cambió de '{oldStatus}' a '{newStatus}'",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }

        // Notificar a miembros del proyecto (excepto al que hizo el cambio)
        var projectMembers = await db.ProjectMembers
            .Where(pm => pm.ProjectId == task.ProjectId && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var memberId in projectMembers)
        {
            await CreateNotificationAsync(
                db,
                memberId,
                "task_status_change",
                "Cambio de estado de tarea",
                $"La tarea '{task.Title}' cambió de '{oldStatus}' a '{newStatus}'",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }
    }

    public static async Task NotifyTaskCompletedAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        Guid triggeredByUserId)
    {
        // Notificar a miembros del proyecto
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
                $"La tarea '{task.Title}' ha sido completada",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }
    }

    public static async Task NotifyTaskBlockedAsync(
        ChroneTaskDbContext db,
        TaskEntity task,
        Guid triggeredByUserId)
    {
        // Notificar al asignado si existe
        if (task.AssignedToId.HasValue && task.AssignedToId.Value != triggeredByUserId)
        {
            await CreateNotificationAsync(
                db,
                task.AssignedToId.Value,
                "task_blocked",
                "Tarea bloqueada",
                $"La tarea '{task.Title}' ha sido bloqueada",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }

        // Notificar a PMs del proyecto
        var projectPMs = await db.ProjectMembers
            .Where(pm => pm.ProjectId == task.ProjectId && pm.Role == "pm" && pm.UserId != triggeredByUserId)
            .Select(pm => pm.UserId)
            .ToListAsync();

        foreach (var pmId in projectPMs)
        {
            await CreateNotificationAsync(
                db,
                pmId,
                "task_blocked",
                "Tarea bloqueada",
                $"La tarea '{task.Title}' ha sido bloqueada",
                task.ProjectId,
                task.Id,
                triggeredByUserId);
        }
    }

    public static async Task NotifyTaskOverdueAsync(
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

    public static async Task NotifySlaWarningAsync(
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
}
