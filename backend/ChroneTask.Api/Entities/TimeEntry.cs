using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class TimeEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TaskId { get; set; }
    public Task Task { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public int? DurationMinutes { get; set; } // Si es manual, este campo se usa

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsManual { get; set; } = false; // true = registro manual, false = timer

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
