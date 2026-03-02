namespace ChroneTask.Api.Dtos;

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? UsageType { get; set; } // Permitir actualizar UsageType desde UpdateProfile
}
