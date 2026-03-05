using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class PersonalTodoItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; } // Owner
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public bool IsCompleted { get; set; } = false;

    public DateTime? DueDate { get; set; } // Fecha límite opcional

    [MaxLength(20)]
    public string? Priority { get; set; } // "low", "medium", "high"

    [MaxLength(20)]
    public string? Color { get; set; } // Hex color para personalización

    public int Order { get; set; } = 0; // Orden de visualización

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
