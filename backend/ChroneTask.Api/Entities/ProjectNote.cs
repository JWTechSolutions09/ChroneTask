using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class ProjectNote
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    [Required]
    public Guid UserId { get; set; } // Creator
    public User User { get; set; } = null!;

    [MaxLength(500)]
    public string? Title { get; set; }

    [MaxLength(5000)]
    public string? Content { get; set; } // Text content or canvas data (JSON)

    [MaxLength(20)]
    public string? Color { get; set; } // Hex color for the note

    // Position and size for drag & resize
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }

    [MaxLength(1000)]
    public string? CanvasData { get; set; } // JSON for drawing data

    [MaxLength(1000)]
    public string? ImageUrl { get; set; } // Uploaded image URL

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
