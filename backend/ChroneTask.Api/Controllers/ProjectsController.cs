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
                ActiveTaskCount = p.Tasks.Count(t => t.Status != "Done"),
                ImageUrl = p.ImageUrl,
                SlaHours = p.SlaHours,
                SlaWarningThreshold = p.SlaWarningThreshold
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
            ActiveTaskCount = project.Tasks.Count(t => t.Status != "Done"),
            ImageUrl = project.ImageUrl,
            SlaHours = project.SlaHours,
            SlaWarningThreshold = project.SlaWarningThreshold
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
            Template = string.IsNullOrWhiteSpace(request.Template) ? null : request.Template.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            SlaHours = request.SlaHours,
            SlaWarningThreshold = request.SlaWarningThreshold
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
            ActiveTaskCount = 0,
            ImageUrl = project.ImageUrl,
            SlaHours = project.SlaHours,
            SlaWarningThreshold = project.SlaWarningThreshold
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
        project.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        project.SlaHours = request.SlaHours;
        project.SlaWarningThreshold = request.SlaWarningThreshold;
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
            ActiveTaskCount = activeTaskCount,
            ImageUrl = project.ImageUrl,
            SlaHours = project.SlaHours,
            SlaWarningThreshold = project.SlaWarningThreshold
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

    // GET: api/orgs/{organizationId}/projects/{id}/members
    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<List<ProjectMemberResponse>>> GetMembers(Guid organizationId, Guid id)
    {
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario es miembro de la organización
        var isOrgMember = await _db.OrganizationMembers
            .AnyAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

        if (!isOrgMember)
            return StatusCode(403, new { message = "You are not a member of this organization" });

        var members = await _db.ProjectMembers
            .Where(m => m.ProjectId == id)
            .Include(m => m.User)
            .Select(m => new ProjectMemberResponse
            {
                UserId = m.UserId,
                UserName = m.User.FullName,
                UserEmail = m.User.Email,
                Role = m.Role
            })
            .ToListAsync();

        return Ok(members);
    }

    // POST: api/orgs/{organizationId}/projects/{id}/members
    [HttpPost("{id:guid}/members")]
    public async Task<ActionResult<ProjectMemberResponse>> AddMember(Guid organizationId, Guid id, [FromBody] AddProjectMemberRequest request)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto existe y pertenece a la organización
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId);

            if (project is null)
                return NotFound();

            // Verificar que el usuario que hace la petición es miembro de la organización
            var isOrgMember = await _db.OrganizationMembers
                .AnyAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

            if (!isOrgMember)
                return StatusCode(403, new { message = "You are not a member of this organization" });

            // Verificar que el usuario a agregar es miembro de la organización
            var isTargetUserOrgMember = await _db.OrganizationMembers
                .AnyAsync(m => m.OrganizationId == organizationId && m.UserId == request.UserId);

            if (!isTargetUserOrgMember)
                return BadRequest(new { message = "The user must be a member of the organization first" });

            // Verificar que el usuario no sea ya miembro del proyecto
            var existingMember = await _db.ProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == id && m.UserId == request.UserId);

            if (existingMember != null)
                return Conflict(new { message = "User is already a member of this project" });

            // Agregar miembro al proyecto
            var projectMember = new ProjectMember
            {
                ProjectId = id,
                UserId = request.UserId,
                Role = request.Role ?? "member"
            };

            _db.ProjectMembers.Add(projectMember);
            await _db.SaveChangesAsync();

            // Cargar información del usuario
            await _db.Entry(projectMember).Reference(m => m.User).LoadAsync();

            return Ok(new ProjectMemberResponse
            {
                UserId = projectMember.UserId,
                UserName = projectMember.User.FullName,
                UserEmail = projectMember.User.Email,
                Role = projectMember.Role
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en AddMember: {ex.Message}");
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message
            });
        }
    }

    // DELETE: api/orgs/{organizationId}/projects/{id}/members/{userId}
    [HttpDelete("{id:guid}/members/{memberUserId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid organizationId, Guid id, Guid memberUserId)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto existe y pertenece a la organización
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == organizationId);

            if (project is null)
                return NotFound();

            // Verificar que el usuario que hace la petición es miembro de la organización
            var isOrgMember = await _db.OrganizationMembers
                .AnyAsync(m => m.OrganizationId == organizationId && m.UserId == userId);

            if (!isOrgMember)
                return StatusCode(403, new { message = "You are not a member of this organization" });

            // Buscar el miembro del proyecto
            var projectMember = await _db.ProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == id && m.UserId == memberUserId);

            if (projectMember is null)
                return NotFound();

            _db.ProjectMembers.Remove(projectMember);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en RemoveMember: {ex.Message}");
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message
            });
        }
    }
}
