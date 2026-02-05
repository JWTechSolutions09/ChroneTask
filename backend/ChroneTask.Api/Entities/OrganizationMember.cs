namespace ChroneTask.Api.Entities;

public class OrganizationMember
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Role { get; set; } = "member"; // org_admin, pm, member

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
