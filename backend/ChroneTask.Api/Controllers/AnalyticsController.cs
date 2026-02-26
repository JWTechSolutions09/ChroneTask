using ChroneTask.Api.Data;
using ChroneTask.Api.Dtos;
using ChroneTask.Api.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskEntity = ChroneTask.Api.Entities.Task;

namespace ChroneTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/orgs/{organizationId:guid}/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public AnalyticsController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/orgs/{organizationId}/analytics
    [HttpGet]
    public async Task<ActionResult<AnalyticsResponse>> GetAnalytics(
        Guid organizationId,
        [FromQuery] Guid? projectId,
        [FromQuery] Guid? memberId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro de la organización
        var isOrgMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

        if (!isOrgMember)
            return StatusCode(403, new { message = "You are not a member of this organization" });

        var now = DateTime.UtcNow;
        var defaultStartDate = startDate ?? now.AddDays(-30);
        var defaultEndDate = endDate ?? now;

        // Obtener todos los proyectos de la organización
        var projectIds = await _db.Projects
            .Where(p => p.OrganizationId == organizationId && p.IsActive)
            .Select(p => p.Id)
            .ToListAsync();

        if (projectId.HasValue)
        {
            projectIds = projectIds.Where(p => p == projectId.Value).ToList();
        }

        // Obtener todas las tareas de los proyectos
        var tasksQuery = _db.Tasks
            .Where(t => projectIds.Contains(t.ProjectId))
            .Where(t => t.CreatedAt >= defaultStartDate && t.CreatedAt <= defaultEndDate)
            .AsQueryable();

        if (memberId.HasValue)
        {
            tasksQuery = tasksQuery.Where(t => t.AssignedToId == memberId.Value);
        }

        var tasks = await tasksQuery
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .ToListAsync();

        // Si no hay proyectos, retornar datos vacíos
        if (!projectIds.Any())
        {
            return Ok(new AnalyticsResponse
            {
                TotalTasks = 0,
                CompletedTasks = 0,
                PendingTasks = 0,
                OverdueTasks = 0,
                SlaMet = 0,
                SlaMissed = 0,
                MemberActivities = new List<MemberActivityResponse>(),
                ProjectsWithBlockages = new List<ProjectBlockedResponse>(),
                TasksDueSoon = new List<TaskDueSoonResponse>(),
                InactiveMembers = new List<MemberInactivityResponse>()
            });
        }

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Status == "Done");
        var pendingTasks = tasks.Count(t => t.Status != "Done");
        var overdueTasks = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != "Done");

        // SLA Analysis
        var slaMet = 0;
        var slaMissed = 0;
        foreach (var task in tasks.Where(t => t.Status == "Done" && t.Project != null && t.Project.SlaHours.HasValue))
        {
            var updatedAt = task.UpdatedAt ?? task.CreatedAt;
            var slaDeadline = task.CreatedAt.AddHours(task.Project.SlaHours.Value);
            if (slaDeadline >= updatedAt)
            {
                slaMet++;
            }
            else
            {
                slaMissed++;
            }
        }

        // Member Activities
        var projectMembers = await _db.ProjectMembers
            .Where(pm => projectIds.Contains(pm.ProjectId))
            .Include(pm => pm.User)
            .Select(pm => new { pm.UserId, pm.User.FullName, pm.User.ProfilePictureUrl })
            .Distinct()
            .ToListAsync();

        var memberActivities = projectMembers
            .Select(pm => new MemberActivityResponse
            {
                UserId = pm.UserId,
                UserName = pm.FullName,
                UserAvatar = pm.ProfilePictureUrl,
                CompletedTasks = tasks.Count(t => t.AssignedToId == pm.UserId && t.Status == "Done"),
                PendingTasks = tasks.Count(t => t.AssignedToId == pm.UserId && t.Status != "Done"),
                TotalMinutes = tasks.Where(t => t.AssignedToId == pm.UserId).Sum(t => (int?)t.TotalMinutes) ?? 0
            })
            .OrderByDescending(m => m.CompletedTasks)
            .ToList();

        // Projects with Blockages
        var projectsWithBlockages = await _db.Projects
            .Where(p => projectIds.Contains(p.Id))
            .Select(p => new ProjectBlockedResponse
            {
                ProjectId = p.Id,
                ProjectName = p.Name,
                BlockedTasksCount = tasks.Count(t => t.ProjectId == p.Id && t.Status == "Blocked")
            })
            .Where(p => p.BlockedTasksCount > 0)
            .OrderByDescending(p => p.BlockedTasksCount)
            .ToListAsync();

        // Tasks Due Soon (next 48 hours)
        var tasksDueSoon = tasks
            .Where(t => t.DueDate.HasValue && t.DueDate.Value > now && t.DueDate.Value <= now.AddHours(48) && t.Status != "Done" && t.Project != null)
            .Select(t => new TaskDueSoonResponse
            {
                TaskId = t.Id,
                TaskTitle = t.Title,
                ProjectId = t.ProjectId,
                ProjectName = t.Project != null ? t.Project.Name : "Unknown",
                DueDate = t.DueDate,
                HoursUntilDue = (int)(t.DueDate.Value - now).TotalHours
            })
            .OrderBy(t => t.DueDate)
            .ToList();

        // Inactive Members (no activity in last 7 days)
        var projectMembersForInactivity = await _db.ProjectMembers
            .Where(pm => projectIds.Contains(pm.ProjectId))
            .Include(pm => pm.User)
            .Select(pm => new { pm.UserId, pm.User.FullName, pm.User.ProfilePictureUrl })
            .Distinct()
            .ToListAsync();

        var inactiveMembers = projectMembersForInactivity
            .Select(pm =>
            {
                var userTasks = tasks.Where(t => t.AssignedToId == pm.UserId).ToList();
                var lastUpdate = userTasks.Any()
                    ? userTasks
                        .OrderByDescending(t => t.UpdatedAt ?? t.CreatedAt)
                        .Select(t => t.UpdatedAt ?? t.CreatedAt)
                        .FirstOrDefault()
                    : default(DateTime);

                return new MemberInactivityResponse
                {
                    UserId = pm.UserId,
                    UserName = pm.FullName,
                    UserAvatar = pm.ProfilePictureUrl,
                    DaysSinceLastActivity = lastUpdate == default(DateTime)
                        ? 999
                        : (int)(now - lastUpdate).TotalDays
                };
            })
            .Where(m => m.DaysSinceLastActivity >= 7)
            .OrderByDescending(m => m.DaysSinceLastActivity)
            .ToList();

        return Ok(new AnalyticsResponse
        {
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            PendingTasks = pendingTasks,
            OverdueTasks = overdueTasks,
            SlaMet = slaMet,
            SlaMissed = slaMissed,
            MemberActivities = memberActivities,
            ProjectsWithBlockages = projectsWithBlockages,
            TasksDueSoon = tasksDueSoon,
            InactiveMembers = inactiveMembers
        });
    }
}
