using System.ComponentModel.DataAnnotations;

namespace ChroneTask.Api.Entities;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? Slug { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<OrganizationMember> OrganizationMembers { get; set; } = new List<OrganizationMember>();
}
