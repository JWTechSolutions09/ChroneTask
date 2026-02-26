using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class Task
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = "Task"; // "Task", "Bug", "Story", "Epic"

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "To Do"; // "To Do", "In Progress", "Blocked", "Review", "Done"

    [MaxLength(20)]
    public string? Priority { get; set; } // "Low", "Medium", "High", "Critical"

    public Guid? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    // Time tracking
    public int? EstimatedMinutes { get; set; } // Tiempo estimado en minutos
    public int TotalMinutes { get; set; } = 0; // Tiempo real acumulado

    [MaxLength(100)]
    public string? Tags { get; set; } // Comma-separated tags

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
