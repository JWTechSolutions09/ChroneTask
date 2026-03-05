namespace ChroneTask.Api.Dtos;

public class PersonalTodoItemResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Priority { get; set; }
    public string? Color { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
