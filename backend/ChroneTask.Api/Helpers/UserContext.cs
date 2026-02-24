using System.Security.Claims;

namespace ChroneTask.Api.Helpers;

public static class UserContext
{
    public static Guid GetUserId(ClaimsPrincipal user)
    {
        // TEMPORALMENTE DESHABILITADO: Retornar un Guid por defecto cuando no hay autenticación
        var id = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrWhiteSpace(id))
        {
            // TEMPORAL: Retornar un Guid por defecto en lugar de lanzar excepción
            // TODO: Restaurar la validación cuando se reactive la autenticación
            return Guid.Empty; // O puedes usar un Guid específico para testing
        }

        if (!Guid.TryParse(id, out var userId))
            throw new UnauthorizedAccessException("Invalid user ID format in token");

        return userId;
    }
}
