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
[Route("api/orgs/{organizationId:guid}/projects/{projectId:guid}/notes")]
public class ProjectNotesController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public ProjectNotesController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/orgs/{organizationId}/projects/{projectId}/notes
    [HttpGet]
    public async Task<ActionResult<List<ProjectNoteResponse>>> GetAll(Guid organizationId, Guid projectId)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        var notes = await _db.ProjectNotes
            .Where(n => n.ProjectId == projectId)
            .Include(n => n.User)
            .OrderBy(n => n.CreatedAt)
            .Select(n => new ProjectNoteResponse
            {
                Id = n.Id,
                ProjectId = n.ProjectId,
                UserId = n.UserId,
                UserName = n.User.FullName,
                UserAvatar = n.User.ProfilePictureUrl,
                Title = n.Title,
                Content = n.Content,
                Color = n.Color,
                PositionX = n.PositionX,
                PositionY = n.PositionY,
                Width = n.Width,
                Height = n.Height,
                CanvasData = n.CanvasData,
                ImageUrl = n.ImageUrl,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            })
            .ToListAsync();

        return Ok(notes);
    }

    // POST: api/orgs/{organizationId}/projects/{projectId}/notes
    [HttpPost]
    public async Task<ActionResult<ProjectNoteResponse>> Create(Guid organizationId, Guid projectId, [FromBody] ProjectNoteCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro del proyecto
        var isMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);

        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this project" });

        var note = new ProjectNote
        {
            ProjectId = projectId,
            UserId = userId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim(),
            Content = string.IsNullOrWhiteSpace(request.Content) ? null : request.Content.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim(),
            PositionX = request.PositionX,
            PositionY = request.PositionY,
            Width = request.Width,
            Height = request.Height,
            CanvasData = string.IsNullOrWhiteSpace(request.CanvasData) ? null : request.CanvasData.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim()
        };

        _db.ProjectNotes.Add(note);
        await _db.SaveChangesAsync();

        await _db.Entry(note).Reference(n => n.User).LoadAsync();

        return Ok(new ProjectNoteResponse
        {
            Id = note.Id,
            ProjectId = note.ProjectId,
            UserId = note.UserId,
            UserName = note.User.FullName,
            UserAvatar = note.User.ProfilePictureUrl,
            Title = note.Title,
            Content = note.Content,
            Color = note.Color,
            PositionX = note.PositionX,
            PositionY = note.PositionY,
            Width = note.Width,
            Height = note.Height,
            CanvasData = note.CanvasData,
            ImageUrl = note.ImageUrl,
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        });
    }

    // PATCH: api/orgs/{organizationId}/projects/{projectId}/notes/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<ProjectNoteResponse>> Update(Guid organizationId, Guid projectId, Guid id, [FromBody] ProjectNoteCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var note = await _db.ProjectNotes
            .Include(n => n.User)
            .FirstOrDefaultAsync(n => n.Id == id && n.ProjectId == projectId);

        if (note is null)
            return NotFound();

        // Solo el autor puede editar
        if (note.UserId != userId)
            return StatusCode(403, new { message = "You can only edit your own notes" });

        note.Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim();
        note.Content = string.IsNullOrWhiteSpace(request.Content) ? null : request.Content.Trim();
        note.Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim();
        note.PositionX = request.PositionX;
        note.PositionY = request.PositionY;
        note.Width = request.Width;
        note.Height = request.Height;
        note.CanvasData = string.IsNullOrWhiteSpace(request.CanvasData) ? null : request.CanvasData.Trim();
        note.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        note.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new ProjectNoteResponse
        {
            Id = note.Id,
            ProjectId = note.ProjectId,
            UserId = note.UserId,
            UserName = note.User.FullName,
            UserAvatar = note.User.ProfilePictureUrl,
            Title = note.Title,
            Content = note.Content,
            Color = note.Color,
            PositionX = note.PositionX,
            PositionY = note.PositionY,
            Width = note.Width,
            Height = note.Height,
            CanvasData = note.CanvasData,
            ImageUrl = note.ImageUrl,
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        });
    }

    // DELETE: api/orgs/{organizationId}/projects/{projectId}/notes/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid organizationId, Guid projectId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var note = await _db.ProjectNotes
            .FirstOrDefaultAsync(n => n.Id == id && n.ProjectId == projectId);

        if (note is null)
            return NotFound();

        // Solo el autor o PM puede eliminar
        var isAuthor = note.UserId == userId;
        var isPM = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == userId && m.Role == "pm");

        if (!isAuthor && !isPM)
            return StatusCode(403, new { message = "You don't have permission to delete this note" });

        _db.ProjectNotes.Remove(note);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
