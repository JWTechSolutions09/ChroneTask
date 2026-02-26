namespace ChroneTask.Api.Dtos;

public class NotificationResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Message { get; set; }
    public Guid? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public Guid? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public Guid? TriggeredByUserId { get; set; }
    public string? TriggeredByUserName { get; set; }
    public string? TriggeredByUserAvatar { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
