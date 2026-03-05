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
[Route("api/users/me/personal-notes")]
public class PersonalNotesController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public PersonalNotesController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/users/me/personal-notes
    [HttpGet]
    public async Task<ActionResult<List<PersonalNoteResponse>>> GetAll()
    {
        var userId = UserContext.GetUserId(User);

        var notes = await _db.PersonalNotes
            .Where(n => n.UserId == userId)
            .Include(n => n.User)
            .OrderBy(n => n.CreatedAt)
            .Select(n => new PersonalNoteResponse
            {
                Id = n.Id,
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

    // POST: api/users/me/personal-notes
    [HttpPost]
    public async Task<ActionResult<PersonalNoteResponse>> Create([FromBody] ProjectNoteCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var note = new PersonalNote
        {
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

        _db.PersonalNotes.Add(note);
        await _db.SaveChangesAsync();

        await _db.Entry(note).Reference(n => n.User).LoadAsync();

        return Ok(new PersonalNoteResponse
        {
            Id = note.Id,
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

    // PATCH: api/users/me/personal-notes/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<PersonalNoteResponse>> Update(Guid id, [FromBody] ProjectNoteCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var note = await _db.PersonalNotes
            .Include(n => n.User)
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (note is null)
            return NotFound();

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

        return Ok(new PersonalNoteResponse
        {
            Id = note.Id,
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

    // DELETE: api/users/me/personal-notes/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var note = await _db.PersonalNotes
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (note is null)
            return NotFound();

        _db.PersonalNotes.Remove(note);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
