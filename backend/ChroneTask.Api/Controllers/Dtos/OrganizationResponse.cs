namespace ChroneTask.Api.Dtos;

public class OrganizationResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
