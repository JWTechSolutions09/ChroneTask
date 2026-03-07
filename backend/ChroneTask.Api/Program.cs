using ChroneTask.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        // SOLUCIÓN DIRECTA: Permitir TODOS los orígenes por defecto
        // Esto elimina completamente los problemas de CORS
        Console.WriteLine("🌐 CORS configurado: Permitir TODOS los orígenes (AllowAnyOrigin)");

        policy
            .AllowAnyOrigin()  // Permite cualquier origen - sin restricciones
            .AllowAnyHeader()   // Permite cualquier header
            .AllowAnyMethod();  // Permite cualquier método (GET, POST, PUT, DELETE, etc.)

        // NOTA: AllowAnyOrigin() NO es compatible con AllowCredentials()
        // Si necesitas AllowCredentials() más tarde, tendrás que usar WithOrigins() específicos
    });
});

// ✅ Controllers con configuración JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configurar JSON para usar camelCase (compatible con frontend)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// ✅ Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ChroneTask.Api", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Escribe: Bearer {tu_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


// ✅ DbContext (PostgreSQL)
// Soporta tanto connection string tradicional como DATABASE_URL de Render
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Función helper para convertir URL de PostgreSQL a connection string de Npgsql
string? ConvertPostgresUrlToConnectionString(string postgresUrl)
{
    try
    {
        // Render proporciona DATABASE_URL en formato: postgresql://user:pass@host:port/dbname
        // También puede venir con dominio completo: postgresql://user:pass@host.oregon-postgres.render.com:port/dbname
        // Convertir a formato Npgsql: Host=host;Port=port;Database=dbname;Username=user;Password=pass

        if (string.IsNullOrWhiteSpace(postgresUrl))
            return null;

        // Parsear manualmente para manejar mejor los caracteres especiales
        var uriString = postgresUrl.Trim();

        // Encontrar el inicio de las credenciales (después de ://)
        var protocolEnd = uriString.IndexOf("://");
        if (protocolEnd < 0)
            return null;

        var startIndex = protocolEnd + 3; // Después de "://"
        var atIndex = uriString.IndexOf('@', startIndex);

        if (atIndex <= startIndex)
            return null;

        // Extraer userInfo (usuario:contraseña)
        var userInfoPart = uriString.Substring(startIndex, atIndex - startIndex);
        var colonIndex = userInfoPart.IndexOf(':');

        if (colonIndex <= 0)
            return null;

        var username = userInfoPart.Substring(0, colonIndex);
        var password = userInfoPart.Substring(colonIndex + 1);

        // Decodificar la contraseña (puede estar URL-encoded)
        password = Uri.UnescapeDataString(password);

        // Extraer host, puerto y base de datos (después de @)
        var afterAt = uriString.Substring(atIndex + 1);
        var pathIndex = afterAt.IndexOf('/');
        var hostPort = pathIndex > 0 ? afterAt.Substring(0, pathIndex) : afterAt;
        var database = pathIndex > 0 ? afterAt.Substring(pathIndex + 1) : "postgres";

        // Separar host y puerto
        var colonPortIndex = hostPort.LastIndexOf(':');
        string host;
        int port;

        if (colonPortIndex > 0)
        {
            host = hostPort.Substring(0, colonPortIndex);
            if (int.TryParse(hostPort.Substring(colonPortIndex + 1), out port))
            {
                // Puerto válido
            }
            else
            {
                port = 5432;
            }
        }
        else
        {
            host = hostPort;
            port = 5432;
        }

        // Limpiar la base de datos (puede tener parámetros de query)
        if (database.Contains('?'))
        {
            database = database.Substring(0, database.IndexOf('?'));
        }
        if (database.Contains('#'))
        {
            database = database.Substring(0, database.IndexOf('#'));
        }
        database = database.Trim();

        // Si la base de datos está vacía, usar "postgres" por defecto
        if (string.IsNullOrEmpty(database))
        {
            database = "postgres";
        }

        Console.WriteLine($"🔍 Parsed connection: Host={host}, Port={port}, Database={database}, Username={username}");
        Console.WriteLine($"🔍 Password length: {password?.Length ?? 0} characters");

        var connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";

        // Log parcial de la connection string (sin mostrar la contraseña completa)
        var safeLog = connectionString.Replace($"Password={password}", "Password=***");
        Console.WriteLine($"🔍 Connection string: {safeLog}");

        return connectionString;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error procesando URL de PostgreSQL: {ex.Message}");
        Console.WriteLine($"   Stack trace: {ex.StackTrace}");
        if (!string.IsNullOrEmpty(postgresUrl))
        {
            var preview = postgresUrl.Length > 100 ? postgresUrl.Substring(0, 100) + "..." : postgresUrl;
            Console.WriteLine($"   URL recibida (preview): {preview}");
        }
    }
    return null;
}

// Si la connection string está vacía o contiene variables no expandidas, intentar DATABASE_URL
if (string.IsNullOrEmpty(connectionString) || connectionString.Contains("${"))
{
    // Intentar usar DATABASE_URL de Render
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        var converted = ConvertPostgresUrlToConnectionString(databaseUrl);
        if (!string.IsNullOrEmpty(converted))
        {
            connectionString = converted;
            Console.WriteLine($"✅ Connection string construida desde DATABASE_URL");
        }
    }
}
// Si la connection string viene en formato URI de PostgreSQL, convertirla automáticamente
else if (connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
         connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
{
    var converted = ConvertPostgresUrlToConnectionString(connectionString);
    if (!string.IsNullOrEmpty(converted))
    {
        connectionString = converted;
        Console.WriteLine($"✅ Connection string convertida desde formato URI de PostgreSQL");
    }
}

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Connection string no configurado. Verifica ConnectionStrings__DefaultConnection o DATABASE_URL");
}

Console.WriteLine($"🔗 Usando base de datos: {connectionString.Split(';').FirstOrDefault(s => s.StartsWith("Database="))?.Replace("Database=", "") ?? "N/A"}");

builder.Services.AddDbContext<ChroneTaskDbContext>(options =>
    options.UseNpgsql(connectionString));

// ✅ JWT
var jwt = builder.Configuration.GetSection("JWT");
var secretKey = jwt["SecretKey"];

// Si no hay SecretKey configurado, usar uno por defecto (solo para desarrollo)
if (string.IsNullOrWhiteSpace(secretKey))
{
    Console.WriteLine("⚠️ JWT SecretKey no configurado. Usando clave por defecto (NO SEGURO PARA PRODUCCIÓN)");
    secretKey = "your-development-secret-key-change-in-production-min-32-chars";
}

Console.WriteLine($"🔐 JWT configurado - Issuer: {jwt["Issuer"]}, Audience: {jwt["Audience"]}, SecretKey length: {secretKey?.Length ?? 0}");

var key = Encoding.UTF8.GetBytes(secretKey ?? string.Empty);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwt["Issuer"],
        ValidAudience = jwt["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// ✅ Ejecutar migraciones automáticamente al iniciar
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ChroneTaskDbContext>();
        Console.WriteLine("🔄 Verificando estado de la base de datos...");

        // Verificar si las tablas ya existen (caso: se ejecutó el script SQL manualmente)
        var canConnect = dbContext.Database.CanConnect();
        if (canConnect)
        {
            // Verificar si la tabla Organizations existe
            var organizationsTableExists = false;
            try
            {
                var connection = dbContext.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                    connection.Open();
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Organizations')";
                var result = command.ExecuteScalar();
                organizationsTableExists = result != null && Convert.ToBoolean(result);
                if (connection.State == System.Data.ConnectionState.Open)
                    connection.Close();
            }
            catch
            {
                // Si hay error verificando, asumir que no existe
                organizationsTableExists = false;
            }

            if (organizationsTableExists)
            {
                // Verificar si __EFMigrationsHistory existe y tiene registros
                var migrationsHistoryExists = false;
                var hasMigrations = false;
                try
                {
                    var connection = dbContext.Database.GetDbConnection();
                    if (connection.State != System.Data.ConnectionState.Open)
                        connection.Open();
                    using var command = connection.CreateCommand();
                    command.CommandText = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__EFMigrationsHistory')";
                    var result = command.ExecuteScalar();
                    migrationsHistoryExists = result != null && Convert.ToBoolean(result);

                    if (migrationsHistoryExists)
                    {
                        command.CommandText = "SELECT COUNT(*) FROM \"__EFMigrationsHistory\"";
                        var count = command.ExecuteScalar();
                        hasMigrations = count != null && Convert.ToInt32(count) > 0;
                    }

                    if (connection.State == System.Data.ConnectionState.Open)
                        connection.Close();
                }
                catch
                {
                    migrationsHistoryExists = false;
                    hasMigrations = false;
                }

                if (!migrationsHistoryExists || !hasMigrations)
                {
                    Console.WriteLine("⚠️ Las tablas ya existen pero no hay historial de migraciones.");
                    Console.WriteLine("⚠️ Se asume que las tablas fueron creadas manualmente. La aplicación continuará sin ejecutar migraciones.");
                    Console.WriteLine("✅ Base de datos lista para usar");
                }
                else
                {
                    // Hay historial de migraciones, aplicar solo las faltantes
                    Console.WriteLine("🔄 Aplicando migraciones faltantes...");
                    dbContext.Database.Migrate();
                    Console.WriteLine("✅ Migraciones aplicadas correctamente");
                }
            }
            else
            {
                // Las tablas no existen, ejecutar migraciones normalmente
                Console.WriteLine("🔄 Aplicando migraciones de base de datos...");
                dbContext.Database.Migrate();
                Console.WriteLine("✅ Migraciones aplicadas correctamente");
            }
        }
        else
        {
            Console.WriteLine("⚠️ No se puede conectar a la base de datos. Las migraciones se omitirán.");
        }
    }
}
catch (PostgresException pgEx) when (pgEx.SqlState == "42P07")
{
    // Error: relation already exists
    Console.WriteLine("⚠️ Las tablas ya existen en la base de datos.");
    Console.WriteLine("⚠️ Se asume que las tablas fueron creadas manualmente. La aplicación continuará sin ejecutar migraciones.");
    Console.WriteLine("✅ Base de datos lista para usar");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error aplicando migraciones: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
    }
    // No lanzar excepción aquí para permitir que la aplicación inicie
    // Las migraciones se pueden ejecutar manualmente si es necesario
}

// ✅ CORS debe estar ANTES de cualquier otro middleware
// IMPORTANTE: UseCors debe estar antes de UseRouting y otros middlewares
app.UseCors("Frontend");

// ✅ Middleware de manejo de excepciones para asegurar que CORS se envíe incluso en errores
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        // Log del error
        Console.WriteLine($"❌ Error no manejado: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
        }

        // Solo modificar la respuesta si no ha comenzado
        if (!context.Response.HasStarted)
        {
            // Asegurar que los headers de CORS se envíen incluso en errores
            context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
            context.Response.Headers.Add("Access-Control-Allow-Headers", "*");

            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";

            var errorResponse = new
            {
                error = "Internal Server Error",
                message = app.Environment.IsDevelopment() ? ex.Message : "An error occurred while processing your request",
                stackTrace = app.Environment.IsDevelopment() ? ex.StackTrace : null,
                innerException = app.Environment.IsDevelopment() && ex.InnerException != null ? ex.InnerException.Message : null
            };

            await context.Response.WriteAsJsonAsync(errorResponse);
        }
        else
        {
            // Si la respuesta ya comenzó, re-lanzar la excepción
            throw;
        }
    }
});

// ✅ Swagger solo en Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => Results.Ok(new
{
    name = "ChroneTask API",
    status = "running",
    docs = "/swagger"
}));

app.Run();
