namespace ChroneTask.Api.Dtos;

public class TimeEntryResponse
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Description { get; set; }
    public bool IsManual { get; set; }
    public DateTime CreatedAt { get; set; }
}
