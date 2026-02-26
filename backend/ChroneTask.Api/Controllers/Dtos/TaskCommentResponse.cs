namespace ChroneTask.Api.Dtos;

public class TaskCommentResponse
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public Guid? ParentCommentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<TaskCommentResponse> Replies { get; set; } = new();
    public List<CommentAttachmentResponse> Attachments { get; set; } = new();
    public List<CommentReactionResponse> Reactions { get; set; } = new();
}
