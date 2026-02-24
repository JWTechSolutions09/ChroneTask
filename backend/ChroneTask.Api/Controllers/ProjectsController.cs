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
[Route("api/orgs/{organizationId:guid}/projects")]
public class ProjectsController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public ProjectsController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/orgs/{organizationId}/projects
    [HttpGet]
    public async Task<ActionResult<List<ProjectResponse>>> GetAll(Guid organizationId)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro de la organización
        var isOrgMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

        if (!isOrgMember)
            return StatusCode(403, new { message = "You are not a member of this organization" });

        var projects = await _db.Projects
            .Where(p => p.OrganizationId == organizationId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                OrganizationId = p.OrganizationId,
                Template = p.Template,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                TaskCount = p.Tasks.Count,
                ActiveTaskCount = p.Tasks.Count(t => t.Status != "Done")
            })
            .ToListAsync();

        return Ok(projects);
    }

    // GET: api/orgs/{organizationId}/projects/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectResponse>> GetById(Guid organizationId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var project = await _db.Projects
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId);

        if (project is null)
            return NotFound();

        // Verificar que el usuario es miembro de la organización
        var isOrgMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

        if (!isOrgMember)
            return StatusCode(403, new { message = "You are not a member of this organization" });

        return Ok(new ProjectResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            OrganizationId = project.OrganizationId,
            Template = project.Template,
            IsActive = project.IsActive,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            TaskCount = project.Tasks.Count,
            ActiveTaskCount = project.Tasks.Count(t => t.Status != "Done")
        });
    }

    // POST: api/orgs/{organizationId}/projects
    [HttpPost]
    public async Task<ActionResult<ProjectResponse>> Create(Guid organizationId, [FromBody] ProjectCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro de la organización
        var orgMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

        if (orgMember is null)
            return StatusCode(403, new { message = "You are not a member of this organization" });

        // Solo org_admin y pm pueden crear proyectos
        if (orgMember.Role != "org_admin" && orgMember.Role != "pm")
            return StatusCode(403, new { message = "Only admins and project managers can create projects" });

        var project = new Project
        {
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            OrganizationId = organizationId,
            Template = string.IsNullOrWhiteSpace(request.Template) ? null : request.Template.Trim()
        };

        _db.Projects.Add(project);

        // Agregar al creador como miembro del proyecto con rol PM
        _db.ProjectMembers.Add(new ProjectMember
        {
            Project = project,
            UserId = userId,
            Role = "pm"
        });

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { organizationId, id = project.Id }, new ProjectResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            OrganizationId = project.OrganizationId,
            Template = project.Template,
            IsActive = project.IsActive,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            TaskCount = 0,
            ActiveTaskCount = 0
        });
    }

    // PATCH: api/orgs/{organizationId}/projects/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<ProjectResponse>> Update(Guid organizationId, Guid id, [FromBody] ProjectCreateRequest request)
    {
        var userId = UserContext.GetUserId(User);

        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId);

        if (project is null)
            return NotFound();

        // Verificar permisos: debe ser miembro del proyecto y tener rol pm o org_admin
        var projectMember = await _db.ProjectMembers
            .FirstOrDefaultAsync(m => m.ProjectId == id && m.UserId == userId);

        var orgMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

        var canEdit = (projectMember != null && (projectMember.Role == "pm")) ||
                      (orgMember != null && orgMember.Role == "org_admin");

        if (!canEdit)
            return StatusCode(403, new { message = "You don't have permission to edit this project" });

        project.Name = request.Name.Trim();
        project.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        project.Template = string.IsNullOrWhiteSpace(request.Template) ? null : request.Template.Trim();
        project.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var taskCount = await _db.Tasks.CountAsync(t => t.ProjectId == id);
        var activeTaskCount = await _db.Tasks.CountAsync(t => t.ProjectId == id && t.Status != "Done");

        return Ok(new ProjectResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            OrganizationId = project.OrganizationId,
            Template = project.Template,
            IsActive = project.IsActive,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            TaskCount = taskCount,
            ActiveTaskCount = activeTaskCount
        });
    }

    // DELETE: api/orgs/{organizationId}/projects/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid organizationId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId);

        if (project is null)
            return NotFound();

        // Solo org_admin puede eliminar proyectos
        var orgMember = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

        if (orgMember is null || orgMember.Role != "org_admin")
            return StatusCode(403, new { message = "Only organization admins can delete projects" });

        // Soft delete
        project.IsActive = false;
        project.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
