using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class TaskComment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = null!;

    [Required]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [MaxLength(36)]
    public Guid? ParentCommentId { get; set; } // For threaded replies
    public TaskComment? ParentComment { get; set; }

    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty; // Rich text content (HTML)

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<TaskComment> Replies { get; set; } = new List<TaskComment>();
    public ICollection<CommentAttachment> Attachments { get; set; } = new List<CommentAttachment>();
    public ICollection<CommentReaction> Reactions { get; set; } = new List<CommentReaction>();
}
