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
[Route("api/orgs/{organizationId:guid}/projects/{projectId:guid}/comments")]
public class ProjectCommentsController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public ProjectCommentsController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/orgs/{organizationId}/projects/{projectId}/comments
    [HttpGet]
    public async Task<ActionResult<List<ProjectCommentResponse>>> GetAll(Guid organizationId, Guid projectId)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        var comments = await _db.ProjectComments
            .Where(c => c.ProjectId == projectId)
            .Include(c => c.User)
            .Include(c => c.Attachments)
            .OrderByDescending(c => c.IsPinned)
            .ThenByDescending(c => c.CreatedAt)
            .Select(c => new ProjectCommentResponse
            {
                Id = c.Id,
                ProjectId = c.ProjectId,
                UserId = c.UserId,
                UserName = c.User.FullName,
                UserAvatar = c.User.ProfilePictureUrl,
                Content = c.Content,
                IsPinned = c.IsPinned,
                Color = c.Color,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                Attachments = c.Attachments.Select(a => new CommentAttachmentResponse
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FileUrl = a.FileUrl,
                    FileType = a.FileType,
                    FileSize = a.FileSize,
                    CreatedAt = a.CreatedAt
                }).ToList()
            })
            .ToListAsync();

        return Ok(comments);
    }

    // POST: api/orgs/{organizationId}/projects/{projectId}/comments
    [HttpPost]
    public async Task<ActionResult<ProjectCommentResponse>> Create(Guid organizationId, Guid projectId, [FromBody] ProjectCommentCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        var comment = new ProjectComment
        {
            ProjectId = projectId,
            UserId = userId,
            Content = request.Content.Trim(),
            IsPinned = request.IsPinned,
            Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim()
        };

        _db.ProjectComments.Add(comment);
        await _db.SaveChangesAsync();

        // Agregar adjuntos si existen
        if (request.Attachments != null && request.Attachments.Any())
        {
            foreach (var attReq in request.Attachments)
            {
                var attachment = new CommentAttachment
                {
                    ProjectCommentId = comment.Id,
                    FileName = attReq.FileName,
                    FileUrl = attReq.FileUrl,
                    FileType = attReq.FileType,
                    FileSize = attReq.FileSize
                };
                _db.CommentAttachments.Add(attachment);
            }
            await _db.SaveChangesAsync();
        }

        await _db.Entry(comment).Reference(c => c.User).LoadAsync();
        await _db.Entry(comment).Collection(c => c.Attachments).LoadAsync();

        return Ok(new ProjectCommentResponse
        {
            Id = comment.Id,
            ProjectId = comment.ProjectId,
            UserId = comment.UserId,
            UserName = comment.User.FullName,
            UserAvatar = comment.User.ProfilePictureUrl,
            Content = comment.Content,
            IsPinned = comment.IsPinned,
            Color = comment.Color,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            Attachments = comment.Attachments.Select(a => new CommentAttachmentResponse
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize,
                CreatedAt = a.CreatedAt
            }).ToList()
        });
    }

    // PATCH: api/orgs/{organizationId}/projects/{projectId}/comments/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<ProjectCommentResponse>> Update(Guid organizationId, Guid projectId, Guid id, [FromBody] ProjectCommentCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var comment = await _db.ProjectComments
            .Include(c => c.User)
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.Id == id && c.ProjectId == projectId);

        if (comment is null)
            return NotFound();

        // Solo el autor puede editar
        if (comment.UserId != userId)
            return StatusCode(403, new { message = "You can only edit your own comments" });

        comment.Content = request.Content.Trim();
        comment.IsPinned = request.IsPinned;
        comment.Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim();
        comment.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new ProjectCommentResponse
        {
            Id = comment.Id,
            ProjectId = comment.ProjectId,
            UserId = comment.UserId,
            UserName = comment.User.FullName,
            UserAvatar = comment.User.ProfilePictureUrl,
            Content = comment.Content,
            IsPinned = comment.IsPinned,
            Color = comment.Color,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            Attachments = comment.Attachments.Select(a => new CommentAttachmentResponse
            {
                Id = a.Id,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                FileType = a.FileType,
                FileSize = a.FileSize,
                CreatedAt = a.CreatedAt
            }).ToList()
        });
    }

    // DELETE: api/orgs/{organizationId}/projects/{projectId}/comments/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid organizationId, Guid projectId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var comment = await _db.ProjectComments
            .FirstOrDefaultAsync(c => c.Id == id && c.ProjectId == projectId);

        if (comment is null)
            return NotFound();

        // Solo el autor o PM puede eliminar
        var isAuthor = comment.UserId == userId;
        var isPM = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId && m.Role == "pm");

        if (!isAuthor && !isPM)
            return StatusCode(403, new { message = "You don't have permission to delete this comment" });

        _db.ProjectComments.Remove(comment);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
