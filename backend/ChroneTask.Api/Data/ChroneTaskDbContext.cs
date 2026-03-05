using ChroneTask.Api.Entities;
using Microsoft.EntityFrameworkCore;
using TaskEntity = ChroneTask.Api.Entities.Task;

namespace ChroneTask.Api.Data;

public class ChroneTaskDbContext : DbContext
{
    public ChroneTaskDbContext(DbContextOptions<ChroneTaskDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();
    public DbSet<OrganizationInvitation> OrganizationInvitations => Set<OrganizationInvitation>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<TaskEntity> Tasks => Set<TaskEntity>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<ProjectComment> ProjectComments => Set<ProjectComment>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<CommentAttachment> CommentAttachments => Set<CommentAttachment>();
    public DbSet<CommentReaction> CommentReactions => Set<CommentReaction>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ProjectNote> ProjectNotes => Set<ProjectNote>();
    public DbSet<PersonalNote> PersonalNotes => Set<PersonalNote>();
    public DbSet<PersonalCalendarEvent> PersonalCalendarEvents => Set<PersonalCalendarEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(120);
            entity.Property(x => x.Slug).HasMaxLength(80);
            entity.HasIndex(x => x.Slug).IsUnique().HasFilter("\"Slug\" IS NOT NULL");
        });
        modelBuilder.Entity<User>()
    .HasIndex(u => u.Email)
    .IsUnique();

        modelBuilder.Entity<OrganizationMember>(entity =>
        {
            entity.HasIndex(m => new { m.OrganizationId, m.UserId })
                .IsUnique();

            entity.HasOne(m => m.Organization)
                .WithMany(o => o.OrganizationMembers)
                .HasForeignKey(m => m.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).IsRequired().HasMaxLength(120);
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.Template).HasMaxLength(50);

            // Relación opcional con Organization (para proyectos empresariales/de equipo)
            entity.HasOne(p => p.Organization)
                .WithMany()
                .HasForeignKey(p => p.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            // Relación opcional con User (para proyectos personales)
            entity.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            // Validación: debe tener OrganizationId O UserId, pero no ambos
            // Esto se validará en el código de negocio
        });

        // ProjectMember configuration
        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(m => new { m.ProjectId, m.UserId }).IsUnique();

            entity.HasOne(m => m.Project)
                .WithMany(p => p.ProjectMembers)
                .HasForeignKey(m => m.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Task configuration
        modelBuilder.Entity<TaskEntity>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).IsRequired().HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Type).IsRequired().HasMaxLength(20);
            entity.Property(x => x.Status).IsRequired().HasMaxLength(20);
            entity.Property(x => x.Priority).HasMaxLength(20);
            entity.Property(x => x.Tags).HasMaxLength(100);

            entity.HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.AssignedTo)
                .WithMany()
                .HasForeignKey(t => t.AssignedToId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // TimeEntry configuration
        modelBuilder.Entity<TimeEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Description).HasMaxLength(500);

            entity.HasOne(te => te.Task)
                .WithMany(t => t.TimeEntries)
                .HasForeignKey(te => te.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(te => te.User)
                .WithMany()
                .HasForeignKey(te => te.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // OrganizationInvitation configuration
        modelBuilder.Entity<OrganizationInvitation>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Token).IsUnique();
            entity.Property(x => x.Token).IsRequired().HasMaxLength(100);
            entity.Property(x => x.Email).HasMaxLength(150);
            entity.Property(x => x.Role).IsRequired().HasMaxLength(20);

            entity.HasOne(i => i.Organization)
                .WithMany()
                .HasForeignKey(i => i.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.CreatedByUser)
                .WithMany()
                .HasForeignKey(i => i.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ProjectComment configuration
        modelBuilder.Entity<ProjectComment>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Content).IsRequired().HasMaxLength(5000);
            entity.Property(x => x.Color).HasMaxLength(20);

            entity.HasOne(c => c.Project)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TaskComment configuration
        modelBuilder.Entity<TaskComment>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Content).IsRequired().HasMaxLength(5000);

            entity.HasOne(c => c.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.ParentComment)
                .WithMany(p => p.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // CommentAttachment configuration
        modelBuilder.Entity<CommentAttachment>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FileName).IsRequired().HasMaxLength(500);
            entity.Property(x => x.FileUrl).IsRequired().HasMaxLength(1000);
            entity.Property(x => x.FileType).HasMaxLength(50);

            entity.HasOne(a => a.ProjectComment)
                .WithMany(c => c.Attachments)
                .HasForeignKey(a => a.ProjectCommentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.TaskComment)
                .WithMany(c => c.Attachments)
                .HasForeignKey(a => a.TaskCommentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CommentReaction configuration
        modelBuilder.Entity<CommentReaction>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Emoji).IsRequired().HasMaxLength(20);
            entity.HasIndex(x => new { x.TaskCommentId, x.UserId, x.Emoji }).IsUnique();

            entity.HasOne(r => r.TaskComment)
                .WithMany(c => c.Reactions)
                .HasForeignKey(r => r.TaskCommentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).IsRequired().HasMaxLength(50);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.Message).HasMaxLength(1000);

            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.Project)
                .WithMany(p => p.Notifications)
                .HasForeignKey(n => n.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.Task)
                .WithMany(t => t.Notifications)
                .HasForeignKey(n => n.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.TriggeredByUser)
                .WithMany()
                .HasForeignKey(n => n.TriggeredByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ProjectNote configuration
        modelBuilder.Entity<ProjectNote>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(500);
            entity.Property(x => x.Content).HasMaxLength(5000);
            entity.Property(x => x.Color).HasMaxLength(20);
            // CanvasData e ImageUrl son TEXT (sin límite) para soportar imágenes base64 grandes
            entity.Property(x => x.CanvasData).HasColumnType("text");
            entity.Property(x => x.ImageUrl).HasColumnType("text");

            entity.HasOne(n => n.Project)
                .WithMany(p => p.Notes)
                .HasForeignKey(n => n.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PersonalNote configuration
        modelBuilder.Entity<PersonalNote>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(500);
            entity.Property(x => x.Content).HasMaxLength(5000);
            entity.Property(x => x.Color).HasMaxLength(20);
            // CanvasData e ImageUrl son TEXT (sin límite) para soportar imágenes base64 grandes
            entity.Property(x => x.CanvasData).HasColumnType("text");
            entity.Property(x => x.ImageUrl).HasColumnType("text");

            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PersonalCalendarEvent configuration
        modelBuilder.Entity<PersonalCalendarEvent>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).IsRequired().HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Color).HasMaxLength(20);
            entity.Property(x => x.Type).HasMaxLength(50);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.RelatedTask)
                .WithMany()
                .HasForeignKey(e => e.RelatedTaskId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.RelatedProject)
                .WithMany()
                .HasForeignKey(e => e.RelatedProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => new { e.UserId, e.StartDate });
        });
    }
}
