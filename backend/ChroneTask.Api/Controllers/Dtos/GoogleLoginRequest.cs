namespace ChroneTask.Api.Dtos;

public class GoogleLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? ProfilePictureUrl { get; set; }
}
