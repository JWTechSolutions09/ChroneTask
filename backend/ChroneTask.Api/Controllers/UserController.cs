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
        var userId = UserContext.GetUserId(User);

        // Verificar que el usuario existe
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return NotFound();

        // Crear el proyecto - EXACTAMENTE como en ProjectsController
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

        // Agregar al usuario como miembro del proyecto - EXACTAMENTE como en ProjectsController
        _db.ProjectMembers.Add(new ProjectMember
        {
            Project = project, // Usar Project (navegación) como en el código original
            UserId = userId,
            Role = "pm" // Usar "pm" como en el código original, no "owner"
        });

        // Guardar TODO en un solo SaveChangesAsync - EXACTAMENTE como en ProjectsController
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

    // GET: api/users/me/projects/{id}/members
    [HttpGet("me/projects/{id:guid}/members")]
    public async Task<ActionResult<List<ProjectMemberResponse>>> GetPersonalProjectMembers(Guid id)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto es personal y pertenece al usuario
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

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
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GetPersonalProjectMembers: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // POST: api/users/me/projects/{id}/members
    [HttpPost("me/projects/{id:guid}/members")]
    public async Task<ActionResult<ProjectMemberResponse>> AddPersonalProjectMember(Guid id, [FromBody] AddProjectMemberRequest request)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto es personal y pertenece al usuario
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

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
            Console.WriteLine($"❌ Error en AddPersonalProjectMember: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // DELETE: api/users/me/projects/{id}/members/{userId}
    [HttpDelete("me/projects/{id:guid}/members/{memberUserId:guid}")]
    public async Task<IActionResult> RemovePersonalProjectMember(Guid id, Guid memberUserId)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto es personal y pertenece al usuario
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

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
            Console.WriteLine($"❌ Error en RemovePersonalProjectMember: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // GET: api/users/me/projects/{id}/notes
    [HttpGet("me/projects/{id:guid}/notes")]
    public async Task<ActionResult<List<ProjectNoteResponse>>> GetPersonalProjectNotes(Guid id)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto es personal y pertenece al usuario
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

            // Verificar que el usuario es miembro del proyecto
            var isMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == id && m.UserId == userId);

            if (!isMember)
                return StatusCode(403, new { message = "You are not a member of this project" });

            var notes = await _db.ProjectNotes
                .Where(n => n.ProjectId == id)
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
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GetPersonalProjectNotes: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // POST: api/users/me/projects/{id}/notes
    [HttpPost("me/projects/{id:guid}/notes")]
    public async Task<ActionResult<ProjectNoteResponse>> CreatePersonalProjectNote(Guid id, [FromBody] ProjectNoteCreateRequest request)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto es personal y pertenece al usuario
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

            // Verificar que el usuario es miembro del proyecto
            var isMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == id && m.UserId == userId);

            if (!isMember)
                return StatusCode(403, new { message = "You are not a member of this project" });

            var note = new ProjectNote
            {
                ProjectId = id,
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
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en CreatePersonalProjectNote: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // PATCH: api/users/me/projects/{id}/notes/{noteId}
    [HttpPatch("me/projects/{id:guid}/notes/{noteId:guid}")]
    public async Task<ActionResult<ProjectNoteResponse>> UpdatePersonalProjectNote(Guid id, Guid noteId, [FromBody] ProjectNoteCreateRequest request)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto es personal y pertenece al usuario
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

            var note = await _db.ProjectNotes
                .Include(n => n.User)
                .FirstOrDefaultAsync(n => n.Id == noteId && n.ProjectId == id);

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
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en UpdatePersonalProjectNote: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }

    // DELETE: api/users/me/projects/{id}/notes/{noteId}
    [HttpDelete("me/projects/{id:guid}/notes/{noteId:guid}")]
    public async Task<IActionResult> DeletePersonalProjectNote(Guid id, Guid noteId)
    {
        try
        {
            var userId = UserContext.GetUserId(User);

            // Verificar que el proyecto es personal y pertenece al usuario
            var project = await _db.Projects
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId && p.OrganizationId == null);

            if (project is null)
                return NotFound();

            var note = await _db.ProjectNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.ProjectId == id);

            if (note is null)
                return NotFound();

            // Solo el autor o PM puede eliminar
            var isAuthor = note.UserId == userId;
            var isPM = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == id && m.UserId == userId && m.Role == "pm");

            if (!isAuthor && !isPM)
                return StatusCode(403, new { message = "You don't have permission to delete this note" });

            _db.ProjectNotes.Remove(note);
            await _db.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en DeletePersonalProjectNote: {ex.Message}");
            return StatusCode(500, new
            {
                error = "Internal Server Error",
                message = ex.Message
            });
        }
    }
}
