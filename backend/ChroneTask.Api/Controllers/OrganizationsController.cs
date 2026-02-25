using ChroneTask.Api.Data;
using ChroneTask.Api.Dtos;
using ChroneTask.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ChroneTask.Api.Helpers;
using OrganizationInvitation = ChroneTask.Api.Entities.OrganizationInvitation;

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
        try
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
        catch (Exception ex)
        {
            // Log del error para debugging
            Console.WriteLine($"❌ Error en GetAll: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message,
                details = ex.InnerException?.Message 
            });
        }
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
        try
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
        catch (Exception ex)
        {
            // Log del error para debugging
            Console.WriteLine($"❌ Error en Create: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message,
                details = ex.InnerException?.Message 
            });
        }
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

    // POST: api/orgs/{id}/invitations
    [HttpPost("{id:guid}/invitations")]
    public async Task<ActionResult<InvitationResponse>> CreateInvitation(Guid id, [FromBody] CreateInvitationRequest request)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            var org = await _db.Organizations
                .Include(o => o.OrganizationMembers)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (org is null) return NotFound();

            // Verificar que el usuario es admin de la organización
            var member = org.OrganizationMembers.FirstOrDefault(m => m.UserId == userId);
            if (member is null || member.Role != "org_admin")
                return StatusCode(403, new { message = "Only organization admins can create invitations" });

            // Generar token único
            var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"); // Token largo y único

            var invitation = new OrganizationInvitation
            {
                OrganizationId = id,
                CreatedByUserId = userId,
                Token = token,
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant(),
                Role = request.Role ?? "member",
                ExpiresAt = DateTime.UtcNow.AddDays(request.ExpirationDays ?? 30)
            };

            _db.OrganizationInvitations.Add(invitation);
            await _db.SaveChangesAsync();

            // Construir el link de invitación (usar URL del frontend)
            // En producción, esto debería venir de configuración
            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://chronetask.pages.dev";
            var invitationLink = $"{frontendUrl}/register?invite={token}";

            return Ok(new InvitationResponse
            {
                Id = invitation.Id,
                Token = invitation.Token,
                InvitationLink = invitationLink,
                Email = invitation.Email,
                Role = invitation.Role,
                ExpiresAt = invitation.ExpiresAt,
                CreatedAt = invitation.CreatedAt
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en CreateInvitation: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message,
                details = ex.InnerException?.Message 
            });
        }
    }

    // GET: api/orgs/{id}/invitations
    [HttpGet("{id:guid}/invitations")]
    public async Task<ActionResult<List<InvitationResponse>>> GetInvitations(Guid id)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            var org = await _db.Organizations
                .Include(o => o.OrganizationMembers)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (org is null) return NotFound();

            // Verificar que el usuario es admin de la organización
            var member = org.OrganizationMembers.FirstOrDefault(m => m.UserId == userId);
            if (member is null || member.Role != "org_admin")
                return StatusCode(403, new { message = "Only organization admins can view invitations" });

            var invitations = await _db.OrganizationInvitations
                .Where(i => i.OrganizationId == id)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new InvitationResponse
                {
                    Id = i.Id,
                    Token = i.Token,
                    Email = i.Email,
                    Role = i.Role,
                    IsUsed = i.IsUsed,
                    UsedAt = i.UsedAt,
                    ExpiresAt = i.ExpiresAt,
                    CreatedAt = i.CreatedAt
                })
                .ToListAsync();

            // Construir links para cada invitación (usar URL del frontend)
            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://chronetask.pages.dev";
            foreach (var invitation in invitations)
            {
                invitation.InvitationLink = $"{frontendUrl}/register?invite={invitation.Token}";
            }

            return Ok(invitations);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GetInvitations: {ex.Message}");
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message
            });
        }
    }

    // DELETE: api/orgs/{id}/invitations/{invitationId}
    [HttpDelete("{id:guid}/invitations/{invitationId:guid}")]
    public async Task<IActionResult> DeleteInvitation(Guid id, Guid invitationId)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            var org = await _db.Organizations
                .Include(o => o.OrganizationMembers)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (org is null) return NotFound();

            // Verificar que el usuario es admin de la organización
            var member = org.OrganizationMembers.FirstOrDefault(m => m.UserId == userId);
            if (member is null || member.Role != "org_admin")
                return StatusCode(403, new { message = "Only organization admins can delete invitations" });

            var invitation = await _db.OrganizationInvitations
                .FirstOrDefaultAsync(i => i.Id == invitationId && i.OrganizationId == id);

            if (invitation is null) return NotFound();

            _db.OrganizationInvitations.Remove(invitation);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en DeleteInvitation: {ex.Message}");
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message
            });
        }
    }
}
