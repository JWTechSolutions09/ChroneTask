using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class PersonalTodoItemCreateRequest
{
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime? DueDate { get; set; }

    [MaxLength(20)]
    public string? Priority { get; set; } // "low", "medium", "high"

    [MaxLength(20)]
    public string? Color { get; set; }

    public int Order { get; set; } = 0;
}
