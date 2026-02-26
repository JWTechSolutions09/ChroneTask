namespace ChroneTask.Api.Dtos;

public class CommentAttachmentResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
    public DateTime CreatedAt { get; set; }
}
