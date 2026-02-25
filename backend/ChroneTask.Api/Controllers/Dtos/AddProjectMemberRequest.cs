namespace ChroneTask.Api.Dtos;

public class AddProjectMemberRequest
{
    public Guid UserId { get; set; }
    public string? Role { get; set; } = "member"; // "pm", "member", "viewer"
}
