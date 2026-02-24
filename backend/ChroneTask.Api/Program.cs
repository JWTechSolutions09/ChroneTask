using ChroneTask.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;


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

// ✅ Controllers
builder.Services.AddControllers();

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
        var uri = new Uri(postgresUrl);
        var userInfo = uri.UserInfo.Split(':');
        if (userInfo.Length >= 2)
        {
            var host = uri.Host;
            var port = uri.Port > 0 ? uri.Port : 5432; // Puerto por defecto de PostgreSQL
            var database = uri.LocalPath.TrimStart('/');
            var username = userInfo[0];
            var password = Uri.UnescapeDataString(userInfo[1]);
            
            return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error procesando URL de PostgreSQL: {ex.Message}");
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
var secretKey = jwt["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey no configurado");
var key = Encoding.UTF8.GetBytes(secretKey);

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
        Console.WriteLine("🔄 Aplicando migraciones de base de datos...");
        dbContext.Database.Migrate();
        Console.WriteLine("✅ Migraciones aplicadas correctamente");
    }
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
