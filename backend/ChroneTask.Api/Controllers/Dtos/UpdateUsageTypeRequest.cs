using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class UpdateUsageTypeRequest
{
    [Required]
    public string UsageType { get; set; } = string.Empty; // "personal", "team", "business"
}
