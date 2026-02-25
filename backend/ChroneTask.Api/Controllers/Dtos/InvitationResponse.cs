namespace ChroneTask.Api.Dtos;

public class InvitationResponse
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? InvitationLink { get; set; }
    public string? Email { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
