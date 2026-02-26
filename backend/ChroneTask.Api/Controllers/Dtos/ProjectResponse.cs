namespace ChroneTask.Api.Dtos;

public class ProjectResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid OrganizationId { get; set; }
    public string? Template { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int TaskCount { get; set; }
    public int ActiveTaskCount { get; set; }
    public string? ImageUrl { get; set; }
    public int? SlaHours { get; set; }
    public int? SlaWarningThreshold { get; set; }
}
