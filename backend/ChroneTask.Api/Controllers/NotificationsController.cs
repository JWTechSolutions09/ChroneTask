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
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public NotificationsController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/notifications
    [HttpGet]
    public async Task<ActionResult<List<NotificationResponse>>> GetAll([FromQuery] bool? unreadOnly)
    {
        var userId = UserContext.GetUserId(User);

        var query = _db.Notifications
            .Where(n => n.UserId == userId)
            .Include(n => n.Project)
            .Include(n => n.Task)
            .Include(n => n.TriggeredByUser)
            .OrderByDescending(n => n.CreatedAt)
            .AsQueryable();

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        var notifications = await query
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                ProjectId = n.ProjectId,
                ProjectName = n.Project != null ? n.Project.Name : null,
                TaskId = n.TaskId,
                TaskTitle = n.Task != null ? n.Task.Title : null,
                TriggeredByUserId = n.TriggeredByUserId,
                TriggeredByUserName = n.TriggeredByUser != null ? n.TriggeredByUser.FullName : null,
                TriggeredByUserAvatar = n.TriggeredByUser != null ? n.TriggeredByUser.ProfilePictureUrl : null,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    // GET: api/notifications/unread-count
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = UserContext.GetUserId(User);

        var count = await _db.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        return Ok(count);
    }

    // PATCH: api/notifications/{id}/read
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification is null)
            return NotFound();

        notification.IsRead = true;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: api/notifications/read-all
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = UserContext.GetUserId(User);

        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/notifications/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification is null)
            return NotFound();

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
