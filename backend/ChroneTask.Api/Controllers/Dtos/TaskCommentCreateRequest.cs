namespace ChroneTask.Api.Dtos;

public class TaskCommentCreateRequest
{
    public string Content { get; set; } = string.Empty;
    public Guid? ParentCommentId { get; set; }
    public List<CommentAttachmentRequest>? Attachments { get; set; }
    public List<string>? Mentions { get; set; } // List of user IDs mentioned
}
