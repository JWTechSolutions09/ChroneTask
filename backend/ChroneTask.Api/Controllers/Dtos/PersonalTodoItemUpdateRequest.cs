using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class PersonalTodoItemUpdateRequest
{
    [MaxLength(500)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public bool? IsCompleted { get; set; }

    public DateTime? DueDate { get; set; }

    [MaxLength(20)]
    public string? Priority { get; set; }

    [MaxLength(20)]
    public string? Color { get; set; }

    public int? Order { get; set; }
}
