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
[Route("api/projects/{projectId:guid}/tasks/{taskId:guid}/comments")]
public class TaskCommentsController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public TaskCommentsController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/projects/{projectId}/tasks/{taskId}/comments
    [HttpGet]
    public async Task<ActionResult<List<TaskCommentResponse>>> GetAll(Guid projectId, Guid taskId)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        var comments = await _db.TaskComments
            .Where(c => c.TaskId == taskId && c.ParentCommentId == null)
            .Include(c => c.User)
            .Include(c => c.Attachments)
            .Include(c => c.Reactions)
                .ThenInclude(r => r.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.Attachments)
            .Include(c => c.Replies)
                .ThenInclude(r => r.Reactions)
                    .ThenInclude(r => r.User)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        var result = comments.Select(c => MapToResponse(c)).ToList();

        return Ok(result);
    }

    // POST: api/projects/{projectId}/tasks/{taskId}/comments
    [HttpPost]
    public async Task<ActionResult<TaskCommentResponse>> Create(Guid projectId, Guid taskId, [FromBody] TaskCommentCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        // Si es una respuesta, verificar que el comentario padre existe
        if (request.ParentCommentId.HasValue)
        {
            var parentExists = await _db.TaskComments
                .AnyAsync(c => c.Id == request.ParentCommentId.Value && c.TaskId == taskId);

            if (!parentExists)
                return BadRequest(new { message = "Parent comment not found" });
        }

        var comment = new TaskComment
        {
            TaskId = taskId,
            UserId = userId,
            ParentCommentId = request.ParentCommentId,
            Content = request.Content.Trim()
        };

        _db.TaskComments.Add(comment);
        await _db.SaveChangesAsync();

        // Agregar adjuntos si existen
        if (request.Attachments != null && request.Attachments.Any())
        {
            foreach (var attReq in request.Attachments)
            {
                var attachment = new CommentAttachment
                {
                    TaskCommentId = comment.Id,
                    FileName = attReq.FileName,
                    FileUrl = attReq.FileUrl,
                    FileType = attReq.FileType,
                    FileSize = attReq.FileSize
                };
                _db.CommentAttachments.Add(attachment);
            }
            await _db.SaveChangesAsync();
        }

        // Crear notificaciones para @mentions
        if (request.Mentions != null && request.Mentions.Any())
        {
            foreach (var mentionedUserId in request.Mentions)
            {
                var mentionedUser = await _db.Users.FindAsync(Guid.Parse(mentionedUserId));
                if (mentionedUser != null)
                {
                    var task = await _db.Tasks.FindAsync(taskId);
                    var notification = new Notification
                    {
                        UserId = mentionedUser.Id,
                        Type = "new_comment",
                        Title = "Mencionado en comentario",
                        Message = $"Has sido mencionado en un comentario de la tarea: {task?.Title}",
                        ProjectId = projectId,
                        TaskId = taskId,
                        TriggeredByUserId = userId
                    };
                    _db.Notifications.Add(notification);
                }
            }
            await _db.SaveChangesAsync();
        }

        await _db.Entry(comment).Reference(c => c.User).LoadAsync();
        await _db.Entry(comment).Collection(c => c.Attachments).LoadAsync();
        await _db.Entry(comment).Collection(c => c.Reactions).LoadAsync();
        await _db.Entry(comment).Collection(c => c.Replies).LoadAsync();

        return Ok(MapToResponse(comment));
    }

    // POST: api/projects/{projectId}/tasks/{taskId}/comments/{id}/reactions
    [HttpPost("{id:guid}/reactions")]
    public async Task<ActionResult<CommentReactionResponse>> AddReaction(Guid projectId, Guid taskId, Guid id, [FromBody] string emoji)
    {
        var userId = UserContext.GetUserId(User);

        var comment = await _db.TaskComments
            .FirstOrDefaultAsync(c => c.Id == id && c.TaskId == taskId);

        if (comment is null)
            return NotFound();

        // Verificar que no existe ya esta reacción del usuario
        var existingReaction = await _db.CommentReactions
            .FirstOrDefaultAsync(r => r.TaskCommentId == id && r.UserId == userId && r.Emoji == emoji);

        if (existingReaction != null)
        {
            // Si ya existe, eliminarla (toggle)
            _db.CommentReactions.Remove(existingReaction);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        var reaction = new CommentReaction
        {
            TaskCommentId = id,
            UserId = userId,
            Emoji = emoji
        };

        _db.CommentReactions.Add(reaction);
        await _db.SaveChangesAsync();

        await _db.Entry(reaction).Reference(r => r.User).LoadAsync();

        return Ok(new CommentReactionResponse
        {
            Id = reaction.Id,
            UserId = reaction.UserId,
            UserName = reaction.User.FullName,
            Emoji = reaction.Emoji,
            CreatedAt = reaction.CreatedAt
        });
    }

    // DELETE: api/projects/{projectId}/tasks/{taskId}/comments/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid taskId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var comment = await _db.TaskComments
            .FirstOrDefaultAsync(c => c.Id == id && c.TaskId == taskId);

        if (comment is null)
            return NotFound();

        // Solo el autor o PM puede eliminar
        var isAuthor = comment.UserId == userId;
        var isPM = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId && m.Role == "pm");

        if (!isAuthor && !isPM)
            return StatusCode(403, new { message = "You don't have permission to delete this comment" });

        _db.TaskComments.Remove(comment);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private TaskCommentResponse MapToResponse(TaskComment comment)
    {
        return new TaskCommentResponse
        {
            Id = comment.Id,
            TaskId = comment.TaskId,
            UserId = comment.UserId,
            UserName = comment.User.FullName,
            UserAvatar = comment.User.ProfilePictureUrl,
            ParentCommentId = comment.ParentCommentId,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            Replies = comment.Replies.OrderBy(r => r.CreatedAt).Select(r => MapToResponse(r)).ToList(),
            Attachments = comment.Attachments.Select(a => new CommentAttachmentResponse
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize,
                CreatedAt = a.CreatedAt
            }).ToList(),
            Reactions = comment.Reactions.Select(r => new CommentReactionResponse
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.User.FullName,
                Emoji = r.Emoji,
                CreatedAt = r.CreatedAt
            }).ToList()
        };
    }
}
