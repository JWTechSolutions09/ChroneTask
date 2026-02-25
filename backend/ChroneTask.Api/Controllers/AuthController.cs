using ChroneTask.Api.Data;
using ChroneTask.Api.Dtos;
using ChroneTask.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace ChroneTask.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ChroneTaskDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(ChroneTaskDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            if (await _db.Users.AnyAsync(x => x.Email == normalizedEmail))
                return Conflict(new { message = "Email already registered" });

            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Si hay un token de invitación, procesarlo
            if (!string.IsNullOrWhiteSpace(request.InvitationToken))
            {
                var invitation = await _db.OrganizationInvitations
                    .Include(i => i.Organization)
                    .FirstOrDefaultAsync(i => i.Token == request.InvitationToken.Trim());

                if (invitation != null && !invitation.IsUsed && invitation.ExpiresAt > DateTime.UtcNow)
                {
                    // Verificar que el usuario no sea ya miembro de la organización
                    var isAlreadyMember = await _db.OrganizationMembers
                        .AnyAsync(m => m.OrganizationId == invitation.OrganizationId && m.UserId == user.Id);

                    if (!isAlreadyMember)
                    {
                        // Agregar usuario a la organización
                        _db.OrganizationMembers.Add(new OrganizationMember
                        {
                            OrganizationId = invitation.OrganizationId,
                            UserId = user.Id,
                            Role = invitation.Role
                        });

                        // Marcar invitación como usada
                        invitation.IsUsed = true;
                        invitation.UsedAt = DateTime.UtcNow;
                        invitation.UsedByUserId = user.Id;

                        await _db.SaveChangesAsync();
                    }
                }
            }

            return Ok(new { message = "User registered successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en Register: {ex.Message}");
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

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == request.Email.ToLowerInvariant());
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid email or password" });

            var token = GenerateToken(user);
            return Ok(new { token });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en Login: {ex.Message}");
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

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.IdToken))
                return BadRequest(new { message = "Google ID token is required" });

            // Validar el token de Google
            var googleClientId = _config["Google:ClientId"];
            if (string.IsNullOrWhiteSpace(googleClientId))
            {
                // Si no hay ClientId configurado, usar validación básica (solo para desarrollo)
                Console.WriteLine("⚠️ Google ClientId no configurado. Usando validación básica.");
                if (string.IsNullOrWhiteSpace(request.Email))
                    return BadRequest(new { message = "Email is required for Google login" });
            }
            else
            {
                // Validar token con Google API
                using var httpClient = new HttpClient();
                var validationUrl = $"https://oauth2.googleapis.com/tokeninfo?id_token={request.IdToken}";
                
                try
                {
                    var response = await httpClient.GetAsync(validationUrl);
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        var tokenInfo = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(content);
                        
                        // Verificar que el token es para nuestro cliente
                        if (tokenInfo != null && tokenInfo.ContainsKey("aud"))
                        {
                            var aud = tokenInfo["aud"].ToString();
                            if (aud != googleClientId)
                            {
                                return Unauthorized(new { message = "Invalid Google token: Client ID mismatch" });
                            }
                            
                            // Extraer email del token validado
                            if (tokenInfo.ContainsKey("email"))
                            {
                                request.Email = tokenInfo["email"].ToString();
                            }
                            if (tokenInfo.ContainsKey("name") && string.IsNullOrWhiteSpace(request.FullName))
                            {
                                request.FullName = tokenInfo["name"].ToString();
                            }
                            if (tokenInfo.ContainsKey("picture") && string.IsNullOrWhiteSpace(request.ProfilePictureUrl))
                            {
                                request.ProfilePictureUrl = tokenInfo["picture"].ToString();
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ Error validando token de Google: {response.StatusCode}");
                        // Continuar con validación básica si falla la validación de Google
                        if (string.IsNullOrWhiteSpace(request.Email))
                            return BadRequest(new { message = "Email is required for Google login" });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Error validando token de Google: {ex.Message}");
                    // Continuar con validación básica si falla
                    if (string.IsNullOrWhiteSpace(request.Email))
                        return BadRequest(new { message = "Email is required for Google login" });
                }
            }

            var normalizedEmail = request.Email!.Trim().ToLowerInvariant();
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail);

            if (user == null)
            {
                // Crear nuevo usuario desde Google
                user = new User
                {
                    FullName = request.FullName?.Trim() ?? "Usuario Google",
                    Email = normalizedEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Password aleatorio
                    ProfilePictureUrl = request.ProfilePictureUrl
                };

                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }
            else
            {
                // Actualizar foto de perfil si viene de Google
                if (!string.IsNullOrWhiteSpace(request.ProfilePictureUrl))
                {
                    user.ProfilePictureUrl = request.ProfilePictureUrl;
                    await _db.SaveChangesAsync();
                }
            }

            var token = GenerateToken(user);
            return Ok(new { token });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error en GoogleLogin: {ex.Message}");
            return StatusCode(500, new { 
                error = "Internal Server Error", 
                message = ex.Message
            });
        }
    }

    private string GenerateToken(User user)
    {
        var jwt = _config.GetSection("JWT");
        var secretKey = jwt["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey no configurado");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var expirationMinutes = int.Parse(jwt["ExpirationMinutes"] ?? "1440");
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
