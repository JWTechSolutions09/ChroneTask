using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    [MaxLength(50)]
    public string? Template { get; set; } // "Software", "Operaciones", "Soporte"

    [MaxLength(500)]
    public string? ImageUrl { get; set; } // URL de imagen del proyecto

    // SLA Configuration
    public int? SlaHours { get; set; } // SLA in hours (null = no SLA)
    public int? SlaWarningThreshold { get; set; } // Warning threshold in hours (e.g., 80% of SLA)

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
    public ICollection<ProjectComment> Comments { get; set; } = new List<ProjectComment>();
    public ICollection<ProjectNote> Notes { get; set; } = new List<ProjectNote>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
