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
                CreatedAt = user.CreatedAt,
                Organizations = organizations
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GetCurrentUser: {ex.Message}");
            return StatusCode(500, new { 
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
                CreatedAt = user.CreatedAt,
                Organizations = organizations
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en UpdateProfile: {ex.Message}");
            return StatusCode(500, new { 
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
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message
            });
        }
    }
}
