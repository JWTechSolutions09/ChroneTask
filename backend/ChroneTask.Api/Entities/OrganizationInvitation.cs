namespace ChroneTask.Api.Entities;

public class OrganizationInvitation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public string Token { get; set; } = string.Empty; // Token único para el link de invitación
    public string? Email { get; set; } // Email opcional del invitado

    public string Role { get; set; } = "member"; // Rol que tendrá el usuario al unirse

    public bool IsUsed { get; set; } = false; // Si ya fue usada
    public DateTime? UsedAt { get; set; } // Cuándo fue usada
    public Guid? UsedByUserId { get; set; } // Usuario que usó la invitación

    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30); // Expira en 30 días
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
