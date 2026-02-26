namespace ChroneTask.Api.Dtos;

public class ProjectCommentCreateRequest
{
    public string Content { get; set; } = string.Empty;
    public bool IsPinned { get; set; } = false;
    public string? Color { get; set; }
    public List<CommentAttachmentRequest>? Attachments { get; set; }
}
