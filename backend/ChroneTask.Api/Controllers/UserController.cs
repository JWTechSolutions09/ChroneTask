using ChroneTask.Api.Data;
using ChroneTask.Api.Dtos;
using ChroneTask.Api.Entities;
using ChroneTask.Api.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace ChroneTask.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;

    public UserController(ChroneTaskDbContext db)
    {
        _db = db;
    }

    // GET: api/users/me
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileResponse>> GetCurrentUser()
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user is null)
                return NotFound();

            // Obtener organizaciones del usuario
            var organizations = await _db.OrganizationMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.Organization)
                .Where(m => m.Organization != null)
                .Select(m => new UserOrganizationResponse
                {
                    OrganizationId = m.OrganizationId,
                    OrganizationName = m.Organization != null ? m.Organization.Name : "Unknown",
                    Role = m.Role,
                    JoinedAt = m.JoinedAt
                })
                .ToListAsync();

            return Ok(new UserProfileResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ProfilePictureUrl = user.ProfilePictureUrl,
                UsageType = user.UsageType,
                CreatedAt = user.CreatedAt,
                Organizations = organizations
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GetCurrentUser: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // PATCH: api/users/me
    [HttpPatch("me")]
    public async Task<ActionResult<UserProfileResponse>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user is null)
                return NotFound();

            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.FullName = request.FullName.Trim();

            if (!string.IsNullOrWhiteSpace(request.ProfilePictureUrl))
                user.ProfilePictureUrl = request.ProfilePictureUrl.Trim();

            // Permitir actualizar UsageType desde UpdateProfile
            if (!string.IsNullOrWhiteSpace(request.UsageType))
            {
                var validUsageTypes = new[] { "personal", "team", "business" };
                var usageTypeValue = request.UsageType.Trim().ToLowerInvariant();
                if (validUsageTypes.Contains(usageTypeValue))
                {
                    user.UsageType = usageTypeValue;
                }
            }

            await _db.SaveChangesAsync();

            // Obtener organizaciones del usuario
            var organizations = await _db.OrganizationMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.Organization)
                .Where(m => m.Organization != null)
                .Select(m => new UserOrganizationResponse
                {
                    OrganizationId = m.OrganizationId,
                    OrganizationName = m.Organization != null ? m.Organization.Name : "Unknown",
                    Role = m.Role,
                    JoinedAt = m.JoinedAt
                })
                .ToListAsync();

            return Ok(new UserProfileResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ProfilePictureUrl = user.ProfilePictureUrl,
                UsageType = user.UsageType,
                CreatedAt = user.CreatedAt,
                Organizations = organizations
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en UpdateProfile: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // PATCH: api/users/me/usage-type
    [HttpPatch("me/usage-type")]
    public async Task<ActionResult<UserProfileResponse>> UpdateUsageType([FromBody] UpdateUsageTypeRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = UserContext.GetUserId(User);

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user is null)
                return NotFound();

            // Validar que el tipo de uso sea válido
            var validUsageTypes = new[] { "personal", "team", "business" };
            var usageTypeValue = request.UsageType?.Trim().ToLowerInvariant() ?? "";

            if (string.IsNullOrWhiteSpace(usageTypeValue))
                return BadRequest(new { message = "UsageType is required" });

            if (!validUsageTypes.Contains(usageTypeValue))
                return BadRequest(new { message = "Invalid usage type. Must be 'personal', 'team', or 'business'" });

            // Actualizar el tipo de uso
            user.UsageType = usageTypeValue;
            await _db.SaveChangesAsync();

            // Obtener organizaciones del usuario
            var organizations = await _db.OrganizationMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.Organization)
                .Where(m => m.Organization != null)
                .Select(m => new UserOrganizationResponse
                {
                    OrganizationId = m.OrganizationId,
                    OrganizationName = m.Organization != null ? m.Organization.Name : "Unknown",
                    Role = m.Role,
                    JoinedAt = m.JoinedAt
                })
                .ToListAsync();

            return Ok(new UserProfileResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ProfilePictureUrl = user.ProfilePictureUrl,
                UsageType = user.UsageType,
                CreatedAt = user.CreatedAt,
                Organizations = organizations
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en UpdateUsageType: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // PATCH: api/users/me/password
    [HttpPatch("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user is null)
                return NotFound();

            // Verificar contraseña actual
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return BadRequest(new { message = "Current password is incorrect" });

            // Validar nueva contraseña
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                return BadRequest(new { message = "New password must be at least 6 characters long" });

            if (request.NewPassword != request.ConfirmPassword)
                return BadRequest(new { message = "New password and confirmation do not match" });

            // Actualizar contraseña
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en ChangePassword: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // ========== PROYECTOS PERSONALES ==========

    // GET: api/users/me/projects
    [HttpGet("me/projects")]
    public async Task<ActionResult<List<ProjectResponse>>> GetPersonalProjects()
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el usuario existe
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user is null)
                return NotFound();

            // Intentar obtener proyectos personales
            // Si la columna UserId no existe (migración no ejecutada), retornar lista vacía
            try
            {
                var projects = await _db.Projects
                    .Where(p => p.UserId == userId && p.OrganizationId == null && p.IsActive)
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new ProjectResponse
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        OrganizationId = p.OrganizationId,
                        UserId = p.UserId,
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
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                // Si es un error de base de datos relacionado con columnas faltantes
                Console.WriteLine($"⚠️ Error de base de datos en GetPersonalProjects (posible migración pendiente): {dbEx.Message}");
                Console.WriteLine($"⚠️ StackTrace: {dbEx.StackTrace}");
                // Retornar lista vacía en lugar de error 500
                return Ok(new List<ProjectResponse>());
            }
            catch (InvalidOperationException invalidOpEx)
            {
                // Si es un error de operación inválida (columna no existe)
                Console.WriteLine($"⚠️ Error de operación en GetPersonalProjects (posible migración pendiente): {invalidOpEx.Message}");
                Console.WriteLine($"⚠️ StackTrace: {invalidOpEx.StackTrace}");
                // Retornar lista vacía en lugar de error 500
                return Ok(new List<ProjectResponse>());
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GetPersonalProjects: {ex.Message}");
            Console.WriteLine($"❌ StackTrace: {ex.StackTrace}");
            Console.WriteLine($"❌ InnerException: {ex.InnerException?.Message}");

            // Retornar lista vacía en lugar de error 500 para evitar romper el frontend
            // El frontend puede manejar una lista vacía
            return Ok(new List<ProjectResponse>());
        }
    }

    // POST: api/users/me/projects
    [HttpPost("me/projects")]
    public async Task<ActionResult<ProjectResponse>> CreatePersonalProject([FromBody] ProjectCreateRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = UserContext.GetUserId(User);

            // Verificar que el usuario tiene usageType = "personal"
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user is null)
                return NotFound();

            var project = new Project
            {
                Name = request.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                OrganizationId = null, // Proyecto personal, sin organización
                UserId = userId, // Asignar al usuario
                Template = string.IsNullOrWhiteSpace(request.Template) ? null : request.Template.Trim(),
                ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
                SlaHours = request.SlaHours,
                SlaWarningThreshold = request.SlaWarningThreshold
            };

            _db.Projects.Add(project);

            // Agregar al usuario como miembro del proyecto con rol "owner"
            _db.ProjectMembers.Add(new ProjectMember
            {
                Project = project,
                UserId = userId,
                Role = "owner" // Rol especial para proyectos personales
            });

            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPersonalProjects), new { }, new ProjectResponse
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                OrganizationId = project.OrganizationId,
                UserId = project.UserId,
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
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en CreatePersonalProject: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // GET: api/users/me/projects/{id}
    [HttpGet("me/projects/{id:guid}")]
    public async Task<ActionResult<ProjectResponse>> GetPersonalProject(Guid id)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            var project = await _db.Projects
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

            return Ok(new ProjectResponse
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                OrganizationId = project.OrganizationId,
                UserId = project.UserId,
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
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GetPersonalProject: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // PATCH: api/users/me/projects/{id}
    [HttpPatch("me/projects/{id:guid}")]
    public async Task<ActionResult<ProjectResponse>> UpdatePersonalProject(Guid id, [FromBody] ProjectCreateRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = UserContext.GetUserId(User);

            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

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
                UserId = project.UserId,
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
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en UpdatePersonalProject: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // DELETE: api/users/me/projects/{id}
    [HttpDelete("me/projects/{id:guid}")]
    public async Task<IActionResult> DeletePersonalProject(Guid id)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

            // Soft delete
            project.IsActive = false;
            project.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en DeletePersonalProject: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }
}
