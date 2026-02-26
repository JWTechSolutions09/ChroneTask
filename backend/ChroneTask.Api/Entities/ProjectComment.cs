using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class ProjectComment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    [Required]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty; // Rich text content (HTML)

    public bool IsPinned { get; set; } = false;

    [MaxLength(20)]
    public string? Color { get; set; } // Hex color for the comment

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<CommentAttachment> Attachments { get; set; } = new List<CommentAttachment>();
}
