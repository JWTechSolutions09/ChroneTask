namespace ChroneTask.Api.Dtos;

public class PersonalCalendarEventResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Color { get; set; }
    public string? Type { get; set; }
    public bool AllDay { get; set; }
    public bool HasReminder { get; set; }
    public int? ReminderMinutesBefore { get; set; }
    public Guid? RelatedTaskId { get; set; }
    public Guid? RelatedProjectId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
