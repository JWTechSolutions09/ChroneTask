using ChroneTask.Api.Data;
using ChroneTask.Api.Dtos;
using ChroneTask.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ChroneTask.Api.Helpers;

namespace ChroneTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/orgs")]
public class OrganizationsController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public OrganizationsController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/orgs
    [HttpGet]
    public async Task<ActionResult<List<OrganizationResponse>>> GetAll()
    {
        var userId = UserContext.GetUserId(User);

        var items = await _db.OrganizationMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.Organization)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrganizationResponse
            {
                Id = o.Id,
                Name = o.Name,
                Slug = o.Slug,
                IsActive = o.IsActive,
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }


    // GET: api/orgs/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrganizationResponse>> GetById(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var org = await _db.Organizations
            .Include(o => o.OrganizationMembers)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (org is null) return NotFound();

        // Verificar que el usuario es miembro de la organización
        var isMember = org.OrganizationMembers.Any(m => m.UserId == userId);
        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this organization" });

        return Ok(new OrganizationResponse
        {
            Id = org.Id,
            Name = org.Name,
            Slug = org.Slug,
            IsActive = org.IsActive,
            CreatedAt = org.CreatedAt
        });
    }

    // POST: api/orgs
    [HttpPost]
    public async Task<ActionResult<OrganizationResponse>> Create([FromBody] OrganizationCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            var existsSlug = await _db.Organizations.AnyAsync(x => x.Slug == request.Slug);
            if (existsSlug)
                return Conflict(new { message = "Slug already exists." });
        }

        var org = new Organization
        {
            Name = request.Name.Trim(),
            Slug = string.IsNullOrWhiteSpace(request.Slug) ? null : request.Slug.Trim()
        };

        _db.Organizations.Add(org);

        _db.OrganizationMembers.Add(new OrganizationMember
        {
            Organization = org,
            UserId = userId,
            Role = "org_admin"
        });

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = org.Id }, new OrganizationResponse
        {
            Id = org.Id,
            Name = org.Name,
            Slug = org.Slug,
            IsActive = org.IsActive,
            CreatedAt = org.CreatedAt
        });
    }


    // PATCH: api/orgs/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<OrganizationResponse>> Update(Guid id, [FromBody] OrganizationCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var org = await _db.Organizations
            .Include(o => o.OrganizationMembers)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (org is null) return NotFound();

        // Verificar que el usuario es miembro de la organización
        var isMember = org.OrganizationMembers.Any(m => m.UserId == userId);
        if (!isMember)
            return StatusCode(403, new { message = "You are not a member of this organization" });

        if (!string.IsNullOrWhiteSpace(request.Slug) && request.Slug != org.Slug)
        {
            var existsSlug = await _db.Organizations.AnyAsync(x => x.Slug == request.Slug);
            if (existsSlug)
                return Conflict(new { message = "Slug already exists." });
        }

        org.Name = request.Name.Trim();
        org.Slug = string.IsNullOrWhiteSpace(request.Slug) ? null : request.Slug.Trim();

        await _db.SaveChangesAsync();

        return Ok(new OrganizationResponse
        {
            Id = org.Id,
            Name = org.Name,
            Slug = org.Slug,
            IsActive = org.IsActive,
            CreatedAt = org.CreatedAt
        });
    }

    // DELETE: api/orgs/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var org = await _db.Organizations
            .Include(o => o.OrganizationMembers)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (org is null) return NotFound();

        // Verificar que el usuario es admin de la organización
        var member = org.OrganizationMembers.FirstOrDefault(m => m.UserId == userId);
        if (member is null)
            return StatusCode(403, new { message = "You are not a member of this organization" });

        if (member.Role != "org_admin")
            return StatusCode(403, new { message = "Only organization admins can delete organizations" });

        _db.Organizations.Remove(org);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
