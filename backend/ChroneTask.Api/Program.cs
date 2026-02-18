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
        // SOLUCIÓN SIMPLE: Permitir todos los orígenes (menos seguro pero funciona)
        // Para producción, puedes restringir esto más tarde
        var allowAllOrigins = Environment.GetEnvironmentVariable("CORS__AllowAll") == "true";

        if (allowAllOrigins)
        {
            Console.WriteLine("🌐 CORS configurado: Permitir TODOS los orígenes");
            policy
                .AllowAnyOrigin()  // Permite cualquier origen
                .AllowAnyHeader()
                .AllowAnyMethod();
            // NOTA: AllowAnyOrigin() NO es compatible con AllowCredentials()
        }
        else
        {
            // Configuración específica de orígenes (más segura)
            var allowedOrigins = (string[]?)null;
            var corsEnv = Environment.GetEnvironmentVariable("CORS__AllowedOrigins");
            if (!string.IsNullOrEmpty(corsEnv))
            {
                allowedOrigins = corsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(o => o.Trim())
                    .Where(o => !string.IsNullOrEmpty(o) && !o.Contains("${"))
                    .ToArray();
            }

            if (allowedOrigins == null || allowedOrigins.Length == 0)
            {
                var configOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>();
                if (configOrigins != null && configOrigins.Length > 0)
                {
                    allowedOrigins = configOrigins
                        .Where(o => !string.IsNullOrEmpty(o) && !o.Contains("${"))
                        .ToArray();
                }
            }

            if (allowedOrigins == null || allowedOrigins.Length == 0)
            {
                allowedOrigins = new[] { "http://localhost:5173", "http://localhost:5174" };
            }

            Console.WriteLine($"🌐 CORS configurado con orígenes: {string.Join(", ", allowedOrigins)}");

            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .SetPreflightMaxAge(TimeSpan.FromSeconds(3600));
        }
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
if (string.IsNullOrEmpty(connectionString))
{
    // Intentar usar DATABASE_URL de Render
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        // Render proporciona DATABASE_URL en formato: postgresql://user:pass@host:port/dbname
        // Convertir a formato Npgsql: Host=host;Port=port;Database=dbname;Username=user;Password=pass
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.LocalPath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
    }
}

builder.Services.AddDbContext<ChroneTaskDbContext>(options =>
    options.UseNpgsql(connectionString ?? throw new InvalidOperationException("Connection string no configurado")));

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

// ✅ CORS debe estar ANTES de cualquier otro middleware
// IMPORTANTE: UseCors debe estar antes de UseRouting y otros middlewares
app.UseCors("Frontend");

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
