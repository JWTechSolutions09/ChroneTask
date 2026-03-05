using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Dtos;

public class ProjectCreateRequest
{
    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Template { get; set; } // "Software", "Operaciones", "Soporte"

    // ImageUrl puede ser base64, por lo que no tiene límite
    public string? ImageUrl { get; set; } // URL de imagen del proyecto o base64

    public int? SlaHours { get; set; } // SLA in hours
    public int? SlaWarningThreshold { get; set; } // Warning threshold in hours
}
