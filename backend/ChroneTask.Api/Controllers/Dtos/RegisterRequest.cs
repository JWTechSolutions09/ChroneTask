using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class RegisterRequest
{
    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string? InvitationToken { get; set; } // Token opcional de invitación
}
