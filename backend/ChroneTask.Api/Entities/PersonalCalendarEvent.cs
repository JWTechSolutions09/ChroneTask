using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class PersonalCalendarEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [MaxLength(20)]
    public string? Color { get; set; } // Hex color for the event

    [MaxLength(50)]
    public string? Type { get; set; } // "event", "task", "reminder", "meeting", etc.

    public bool AllDay { get; set; } = false;

    public bool HasReminder { get; set; } = false;

    public int? ReminderMinutesBefore { get; set; } // Minutes before event to send reminder (e.g., 15, 30, 60, 1440 for 1 day)

    public Guid? RelatedTaskId { get; set; } // Link to a task if this event is related to a task
    public Task? RelatedTask { get; set; }

    public Guid? RelatedProjectId { get; set; } // Link to a project if this event is related to a project
    public Project? RelatedProject { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
