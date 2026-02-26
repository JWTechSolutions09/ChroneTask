using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; } // User who receives the notification
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // "task_status_change", "task_completed", "task_blocked", "new_comment", "sla_warning", "task_overdue"

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(1000)]
    public string? Message { get; set; }

    [MaxLength(36)]
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }

    [MaxLength(36)]
    public Guid? TaskId { get; set; }
    public Task? Task { get; set; }

    [MaxLength(36)]
    public Guid? TriggeredByUserId { get; set; } // User who generated the event
    public User? TriggeredByUser { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
