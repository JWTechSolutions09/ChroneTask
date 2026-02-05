namespace ChroneTask.Api.Entities;

public class ProjectMember
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Role { get; set; } = "member"; // "pm", "member", "viewer"

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
