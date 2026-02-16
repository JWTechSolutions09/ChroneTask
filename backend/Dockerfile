# Dockerfile para Backend (ASP.NET Core)
# Para uso con docker-compose (context: ./backend)
# Si usas Render con Root Directory: backend/ChroneTask.Api
# usa el Dockerfile en backend/ChroneTask.Api/Dockerfile

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar el archivo .csproj desde la subcarpeta
COPY ["ChroneTask.Api/ChroneTask.Api.csproj", "ChroneTask.Api/"]
RUN dotnet restore "ChroneTask.Api/ChroneTask.Api.csproj"

# Copiar el resto del código
COPY . .

# Build y publish
WORKDIR "/src/ChroneTask.Api"
RUN dotnet build "ChroneTask.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ChroneTask.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ChroneTask.Api.dll"]
