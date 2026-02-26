using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class CommentAttachment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(36)]
    public Guid? ProjectCommentId { get; set; }
    public ProjectComment? ProjectComment { get; set; }

    [MaxLength(36)]
    public Guid? TaskCommentId { get; set; }
    public TaskComment? TaskComment { get; set; }

    [Required]
    [MaxLength(500)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string FileUrl { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? FileType { get; set; } // "pdf", "image", "zip", "document", "link"

    public long? FileSize { get; set; } // Size in bytes

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
