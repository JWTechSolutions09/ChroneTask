namespace ChroneTask.Api.Dtos;

public class CommentAttachmentRequest
{
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
}
