using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class OrganizationCreateRequest
{
    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? Slug { get; set; }
}
