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
            try
            {
                // Primero obtener los proyectos sin las relaciones para evitar problemas
                var projects = await _db.Projects
                    .Where(p => p.UserId == userId && p.OrganizationId == null && p.IsActive)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                // Luego construir las respuestas con los conteos de tareas
                var projectResponses = new List<ProjectResponse>();
                foreach (var project in projects)
                {
                    var taskCount = await _db.Tasks.CountAsync(t => t.ProjectId == project.Id);
                    var activeTaskCount = await _db.Tasks.CountAsync(t => t.ProjectId == project.Id && t.Status != "Done");

                    projectResponses.Add(new ProjectResponse
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

                return Ok(projectResponses);
            }
            catch (Exception queryEx) when (
                queryEx.Message.Contains("column") && queryEx.Message.Contains("UserId") ||
                queryEx.Message.Contains("does not exist") ||
                (queryEx.InnerException != null && (
                    queryEx.InnerException.Message.Contains("column") && queryEx.InnerException.Message.Contains("UserId") ||
                    queryEx.InnerException.Message.Contains("does not exist")
                ))
            )
            {
                // Error específico: columna UserId no existe (migración no ejecutada)
                Console.WriteLine($"⚠️ Columna UserId no existe en Projects. La migración no se ha ejecutado.");
                Console.WriteLine($"⚠️ Error: {queryEx.Message}");
                if (queryEx.InnerException != null)
                {
                    Console.WriteLine($"⚠️ InnerException: {queryEx.InnerException.Message}");
                }
                return Ok(new List<ProjectResponse>());
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                Console.WriteLine($"⚠️ Error de base de datos en GetPersonalProjects: {dbEx.Message}");
                if (dbEx.InnerException != null)
                {
                    Console.WriteLine($"⚠️ InnerException: {dbEx.InnerException.Message}");
                }
                return Ok(new List<ProjectResponse>());
            }
            catch (InvalidOperationException invalidOpEx)
            {
                Console.WriteLine($"⚠️ Error de operación en GetPersonalProjects: {invalidOpEx.Message}");
                return Ok(new List<ProjectResponse>());
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GetPersonalProjects: {ex.Message}");
            Console.WriteLine($"❌ Tipo: {ex.GetType().Name}");
            Console.WriteLine($"❌ StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"❌ InnerException: {ex.InnerException.Message}");
                Console.WriteLine($"❌ InnerException Tipo: {ex.InnerException.GetType().Name}");
            }

            // Retornar lista vacía en lugar de error 500 para evitar romper el frontend
            return Ok(new List<ProjectResponse>());
        }
    }

    // POST: api/users/me/projects
    [HttpPost("me/projects")]
    public async Task<ActionResult<ProjectResponse>> CreatePersonalProject([FromBody] ProjectCreateRequest request)
    {
        try
        {
            // Validación manual más robusta
            if (request == null)
            {
                Console.WriteLine("❌ CreatePersonalProject: Request es null");
                return BadRequest(new { message = "Request body is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                Console.WriteLine("❌ CreatePersonalProject: Name es requerido");
                return BadRequest(new { message = "Name is required" });
            }

            var userId = UserContext.GetUserId(User);
            Console.WriteLine($"✅ CreatePersonalProject: UserId = {userId}");

            // Verificar que el usuario existe
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user is null)
            {
                Console.WriteLine($"❌ CreatePersonalProject: Usuario {userId} no encontrado");
                return NotFound(new { message = "User not found" });
            }

            Console.WriteLine($"✅ CreatePersonalProject: Usuario encontrado: {user.Email}");

            // Crear el proyecto
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

            Console.WriteLine($"✅ CreatePersonalProject: Proyecto creado: {project.Name}, UserId = {project.UserId}");

            _db.Projects.Add(project);
            Console.WriteLine("✅ CreatePersonalProject: Proyecto agregado al contexto");

            // Guardar primero el proyecto para obtener el ID
            await _db.SaveChangesAsync();
            Console.WriteLine($"✅ CreatePersonalProject: Proyecto guardado con ID = {project.Id}");

            // Agregar al usuario como miembro del proyecto con rol "owner"
            var projectMember = new ProjectMember
            {
                ProjectId = project.Id, // Usar ProjectId en lugar de Project para evitar problemas
                UserId = userId,
                Role = "owner" // Rol especial para proyectos personales
            };

            _db.ProjectMembers.Add(projectMember);
            Console.WriteLine($"✅ CreatePersonalProject: ProjectMember agregado: ProjectId = {projectMember.ProjectId}, UserId = {projectMember.UserId}");

            await _db.SaveChangesAsync();
            Console.WriteLine("✅ CreatePersonalProject: ProjectMember guardado exitosamente");

            var response = new ProjectResponse
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
            };

            Console.WriteLine($"✅ CreatePersonalProject: Proyecto creado exitosamente: {response.Id}");
            return CreatedAtAction(nameof(GetPersonalProjects), new { }, response);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
        {
            Console.WriteLine($"❌ CreatePersonalProject - DbUpdateException: {dbEx.Message}");
            Console.WriteLine($"❌ InnerException: {dbEx.InnerException?.Message}");
            Console.WriteLine($"❌ StackTrace: {dbEx.StackTrace}");

            return StatusCode(500, new
            {
                error = "Database Error",
                message = dbEx.Message,
                innerException = dbEx.InnerException?.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ CreatePersonalProject - Exception: {ex.Message}");
            Console.WriteLine($"❌ Tipo: {ex.GetType().Name}");
            Console.WriteLine($"❌ StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"❌ InnerException: {ex.InnerException.Message}");
                Console.WriteLine($"❌ InnerException Tipo: {ex.InnerException.GetType().Name}");
                if (ex.InnerException.InnerException != null)
                {
                    Console.WriteLine($"❌ InnerException.InnerException: {ex.InnerException.InnerException.Message}");
                }
            }

            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message,
                innerException = ex.InnerException?.Message,
                type = ex.GetType().Name
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
