namespace ChroneTask.Api.Dtos;

public class ProjectNoteCreateRequest
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? Color { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public double? Width { get; set; }
    public double? Height { get; set; }
    public string? CanvasData { get; set; }
    public string? ImageUrl { get; set; }
}
