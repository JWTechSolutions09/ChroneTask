using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class CommentReaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TaskCommentId { get; set; }
    public TaskComment TaskComment { get; set; } = null!;

    [Required]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(20)]
    public string Emoji { get; set; } = string.Empty; // "👍", "❤️", "😄", etc.

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
