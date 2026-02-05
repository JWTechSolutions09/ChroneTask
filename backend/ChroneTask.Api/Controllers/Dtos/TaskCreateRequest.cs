using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class TaskCreateRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = "Task"; // "Task", "Bug", "Story", "Epic"

    [MaxLength(20)]
    public string? Priority { get; set; } // "Low", "Medium", "High", "Critical"

    public Guid? AssignedToId { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    public int? EstimatedMinutes { get; set; }

    [MaxLength(100)]
    public string? Tags { get; set; }
}
