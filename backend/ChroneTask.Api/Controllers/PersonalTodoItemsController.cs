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
[Route("api/users/me/todo-items")]
public class PersonalTodoItemsController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public PersonalTodoItemsController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/users/me/todo-items
    [HttpGet]
    public async Task<ActionResult<List<PersonalTodoItemResponse>>> GetAll([FromQuery] bool? completed, [FromQuery] DateTime? dueDate)
    {
        var userId = UserContext.GetUserId(User);

        var query = _db.PersonalTodoItems
            .Where(t => t.UserId == userId)
            .AsQueryable();

        if (completed.HasValue)
        {
            query = query.Where(t => t.IsCompleted == completed.Value);
        }

        if (dueDate.HasValue)
        {
            var dateStr = dueDate.Value.Date;
            query = query.Where(t => t.DueDate.HasValue && t.DueDate.Value.Date == dateStr);
        }

        var items = await query
            .OrderBy(t => t.Order)
            .ThenBy(t => t.CreatedAt)
            .Select(t => new PersonalTodoItemResponse
            {
                Id = t.Id,
                UserId = t.UserId,
                Title = t.Title,
                Description = t.Description,
                IsCompleted = t.IsCompleted,
                DueDate = t.DueDate,
                Priority = t.Priority,
                Color = t.Color,
                Order = t.Order,
                CreatedAt = t.CreatedAt,
                CompletedAt = t.CompletedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    // GET: api/users/me/todo-items/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PersonalTodoItemResponse>> GetById(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var item = await _db.PersonalTodoItems
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (item is null)
            return NotFound();

        return Ok(new PersonalTodoItemResponse
        {
            Id = item.Id,
            UserId = item.UserId,
            Title = item.Title,
            Description = item.Description,
            IsCompleted = item.IsCompleted,
            DueDate = item.DueDate,
            Priority = item.Priority,
            Color = item.Color,
            Order = item.Order,
            CreatedAt = item.CreatedAt,
            CompletedAt = item.CompletedAt,
            UpdatedAt = item.UpdatedAt
        });
    }

    // POST: api/users/me/todo-items
    [HttpPost]
    public async Task<ActionResult<PersonalTodoItemResponse>> Create([FromBody] PersonalTodoItemCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Title is required" });
        }

        // Obtener el siguiente orden
        var maxOrder = await _db.PersonalTodoItems
            .Where(t => t.UserId == userId)
            .Select(t => (int?)t.Order)
            .DefaultIfEmpty(0)
            .MaxAsync();

        var item = new PersonalTodoItem
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            DueDate = request.DueDate,
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? null : request.Priority.Trim().ToLower(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim(),
            Order = request.Order > 0 ? request.Order : (maxOrder ?? 0) + 1
        };

        _db.PersonalTodoItems.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, new PersonalTodoItemResponse
        {
            Id = item.Id,
            UserId = item.UserId,
            Title = item.Title,
            Description = item.Description,
            IsCompleted = item.IsCompleted,
            DueDate = item.DueDate,
            Priority = item.Priority,
            Color = item.Color,
            Order = item.Order,
            CreatedAt = item.CreatedAt,
            CompletedAt = item.CompletedAt,
            UpdatedAt = item.UpdatedAt
        });
    }

    // PATCH: api/users/me/todo-items/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<PersonalTodoItemResponse>> Update(Guid id, [FromBody] PersonalTodoItemUpdateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var item = await _db.PersonalTodoItems
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (item is null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            item.Title = request.Title.Trim();
        }

        if (request.Description != null)
        {
            item.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        }

        if (request.IsCompleted.HasValue)
        {
            item.IsCompleted = request.IsCompleted.Value;
            if (request.IsCompleted.Value && !item.CompletedAt.HasValue)
            {
                item.CompletedAt = DateTime.UtcNow;
            }
            else if (!request.IsCompleted.Value)
            {
                item.CompletedAt = null;
            }
        }

        if (request.DueDate.HasValue)
        {
            item.DueDate = request.DueDate.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.Priority))
        {
            item.Priority = request.Priority.Trim().ToLower();
        }

        if (!string.IsNullOrWhiteSpace(request.Color))
        {
            item.Color = request.Color.Trim();
        }

        if (request.Order.HasValue)
        {
            item.Order = request.Order.Value;
        }

        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new PersonalTodoItemResponse
        {
            Id = item.Id,
            UserId = item.UserId,
            Title = item.Title,
            Description = item.Description,
            IsCompleted = item.IsCompleted,
            DueDate = item.DueDate,
            Priority = item.Priority,
            Color = item.Color,
            Order = item.Order,
            CreatedAt = item.CreatedAt,
            CompletedAt = item.CompletedAt,
            UpdatedAt = item.UpdatedAt
        });
    }

    // DELETE: api/users/me/todo-items/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var item = await _db.PersonalTodoItems
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (item is null)
            return NotFound();

        _db.PersonalTodoItems.Remove(item);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // PATCH: api/users/me/todo-items/reorder
    [HttpPatch("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<Guid> itemIds)
    {
        var userId = UserContext.GetUserId(User);

        var items = await _db.PersonalTodoItems
            .Where(t => t.UserId == userId && itemIds.Contains(t.Id))
            .ToListAsync();

        if (items.Count != itemIds.Count)
        {
            return BadRequest(new { message = "Some items were not found" });
        }

        for (int i = 0; i < itemIds.Count; i++)
        {
            var item = items.First(t => t.Id == itemIds[i]);
            item.Order = i + 1;
            item.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return NoContent();
    }
}
