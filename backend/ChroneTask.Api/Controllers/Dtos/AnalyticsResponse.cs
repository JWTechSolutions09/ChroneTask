namespace ChroneTask.Api.Dtos;

public class AnalyticsResponse
{
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int PendingTasks { get; set; }
    public int OverdueTasks { get; set; }
    public int SlaMet { get; set; }
    public int SlaMissed { get; set; }
    public List<MemberActivityResponse> MemberActivities { get; set; } = new();
    public List<ProjectBlockedResponse> ProjectsWithBlockages { get; set; } = new();
    public List<TaskDueSoonResponse> TasksDueSoon { get; set; } = new();
    public List<MemberInactivityResponse> InactiveMembers { get; set; } = new();
}

public class MemberActivityResponse
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public int CompletedTasks { get; set; }
    public int PendingTasks { get; set; }
    public int TotalMinutes { get; set; }
}

public class ProjectBlockedResponse
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int BlockedTasksCount { get; set; }
}

public class TaskDueSoonResponse
{
    public Guid TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public int HoursUntilDue { get; set; }
}

public class MemberInactivityResponse
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public int DaysSinceLastActivity { get; set; }
}
