using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChroneTask.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalProjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Hacer OrganizationId nullable
            migrationBuilder.AlterColumn<Guid>(
                name: "OrganizationId",
                table: "Projects",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            // Agregar UserId para proyectos personales
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Projects",
                type: "uuid",
                nullable: true);

            // Crear índice para UserId
            migrationBuilder.CreateIndex(
                name: "IX_Projects_UserId",
                table: "Projects",
                column: "UserId");

            // Agregar foreign key para UserId
            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Users_UserId",
                table: "Projects",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remover foreign key
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Users_UserId",
                table: "Projects");

            // Remover índice
            migrationBuilder.DropIndex(
                name: "IX_Projects_UserId",
                table: "Projects");

            // Remover UserId
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Projects");

            // Revertir OrganizationId a no nullable (solo si no hay proyectos personales)
            // Nota: Esto puede fallar si hay proyectos con OrganizationId null
            migrationBuilder.AlterColumn<Guid>(
                name: "OrganizationId",
                table: "Projects",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
