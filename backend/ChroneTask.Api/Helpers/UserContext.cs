using System.Security.Claims;

namespace ChroneTask.Api.Helpers;

public static class UserContext
{
    public static Guid GetUserId(ClaimsPrincipal user)
    {
        var id = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrWhiteSpace(id))
            throw new UnauthorizedAccessException("User ID claim not found in token");

        if (!Guid.TryParse(id, out var userId))
            throw new UnauthorizedAccessException("Invalid user ID format in token");

        return userId;
    }
}
