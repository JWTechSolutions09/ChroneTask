using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class PersonalCalendarEventCreateRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [MaxLength(20)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? Type { get; set; }

    public bool AllDay { get; set; } = false;

    public bool HasReminder { get; set; } = false;

    public int? ReminderMinutesBefore { get; set; }

    public Guid? RelatedTaskId { get; set; }

    public Guid? RelatedProjectId { get; set; }
}
