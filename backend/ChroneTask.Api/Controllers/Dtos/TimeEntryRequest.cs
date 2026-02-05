using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class TimeEntryRequest
{
    [Required]
    public Guid TaskId { get; set; }

    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public int? DurationMinutes { get; set; } // Para registro manual

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsManual { get; set; } = false;
}
