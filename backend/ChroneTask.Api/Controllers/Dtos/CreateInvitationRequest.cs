namespace ChroneTask.Api.Dtos;

public class CreateInvitationRequest
{
    public string? Email { get; set; } // Email opcional del invitado
    public string? Role { get; set; } = "member"; // Rol que tendrá el usuario (member, pm, org_admin)
    public int? ExpirationDays { get; set; } = 30; // Días hasta que expire la invitación
}
