/**
 * Dashboard aggregation service.
 *
 * Combines data from multiple repositories to produce the
 * consolidated dashboard response. All task data flows
 * through the repository layer as fully-mapped Task objects.
 */

import type { TaskRepository } from "@/core/repositories/task-repository";
import type { ProjectRepository } from "@/core/repositories/project-repository";
import type { AchievementRepository } from "@/core/repositories/achievement-repository";
import type { DailySummaryRepository } from "@/core/repositories/daily-summary-repository";
import type { MilestoneRepository } from "@/core/repositories/milestone-repository";
import { toLocalDateString } from "@/shared/date-utils";
import type {
  DashboardData,
  Task,
  FocusTask,
  WeekStats,
  HeatmapDay,
  StatusStats,
  ActiveTask,
} from "@/core/entities";

export class DashboardService {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly achievementRepo: AchievementRepository,
    private readonly dailySummaryRepo: DailySummaryRepository,
    private readonly milestoneRepo: MilestoneRepository,
  ) {}

  /** Aggregate all dashboard data from repositories. */
  getDashboardData(): DashboardData {
    const allTasks = this.taskRepo.findAll();

    // Auto-check & unlock daily-hours achievements
    this.checkDailyHourAchievements();

    return {
      todayTasks:    this.buildTodayTasks(allTasks),
      weekStats:     this.buildWeekStats(allTasks),
      statusStats:   this.buildStatusStats(),
      heatmapData:   this.buildHeatmap(allTasks),
      achievements:  this.achievementRepo.findAll(),
      activeTasks:   this.buildActiveTasks(allTasks),
      milestones:    this.milestoneRepo.findAll(),
    };
  }

  /** Check today's work hours and auto-unlock matching achievements. */
  private checkDailyHourAchievements(): void {
    const todayStr = toLocalDateString(new Date());
    const today = this.dailySummaryRepo.findByDate(todayStr);
    const todayHours = today?.workHours ?? 0;
    if (todayHours <= 0) return;

    const achievements = this.achievementRepo.findAll();
    const now = new Date().toISOString();
    for (const a of achievements) {
      if (a.unlockedAt) continue; // already unlocked
      if (a.conditionType === "daily_hours" && todayHours >= a.conditionValue) {
        this.achievementRepo.unlock(a.id, now);
      }
    }
  }

  // ── Private helpers ──

  /**
   * Build today's focus list:
   * All active tasks (in_progress + review), pinned first, then the rest.
   */
  private buildTodayTasks(tasks: Task[]): FocusTask[] {
    const active = tasks.filter(t => t.status === "in_progress" || t.status === "review");
    const pinned = active.filter(t => t.todayOrder != null).sort((a, b) => (a.todayOrder ?? 99) - (b.todayOrder ?? 99));
    const unpinned = active.filter(t => t.todayOrder == null);

    const seen = new Set(pinned.map(t => t.id));
    const result = [...pinned];
    for (const t of unpinned) {
      if (!seen.has(t.id)) { result.push(t); seen.add(t.id); }
    }

    return result as unknown as FocusTask[];
  }

  /** Compute this week's completion statistics. */
  private buildWeekStats(tasks: Task[]): WeekStats {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1);
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekTasks = tasks.filter(t => {
      if (!t.completedAt) return true;
      return new Date(t.completedAt) >= weekStart;
    });

    const completed = thisWeekTasks.filter(t => t.status === "done").length;
    const inProgress = thisWeekTasks.filter(t => t.status === "in_progress").length;
    const pending = thisWeekTasks.filter(t => !["done", "in_progress"].includes(t.status)).length;
    const total = thisWeekTasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Today's project activity
    const today = toLocalDateString(now);
    const todayProjects = new Map<string, { projectId: string; projectName: string; projectColor: string; completedToday: number }>();
    for (const t of tasks) {
      if (t.status === "done" && t.completedAt?.startsWith(today)) {
        const key = t.projectId;
        const entry = todayProjects.get(key);
        if (entry) {
          entry.completedToday++;
        } else {
          todayProjects.set(key, {
            projectId: t.projectId,
            projectName: t.project.name,
            projectColor: t.project.color,
            completedToday: 1,
          });
        }
      }
    }

    return {
      completed,
      inProgress,
      pending,
      completionRate,
      todayProjectActivity: Array.from(todayProjects.values()),
    };
  }

  /** Build the last 90 days activity heatmap from daily work hours. */
  private buildHeatmap(_tasks: Task[]): HeatmapDay[] {
    // Aggregate work hours per day from daily summaries
    const summaries = this.dailySummaryRepo.findRecent(90);
    const hoursMap = new Map<string, number>();
    for (const s of summaries) {
      hoursMap.set(s.date, (hoursMap.get(s.date) || 0) + s.workHours);
    }

    const days: HeatmapDay[] = [];
    const maxHours = Math.max(...hoursMap.values(), 1);
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateString(d);
      const hours = hoursMap.get(dateStr) || 0;
      // Continuous 0–1 level based on hours relative to max
      const level = hours > 0 ? Math.min(hours / Math.max(maxHours, 8), 1) : 0;
      days.push({ date: dateStr, hours, level });
    }
    return days;
  }

  /** Build cognitive status stats from daily summaries. */
  private buildStatusStats(): StatusStats {
    const today = new Date();
    const todayStr = toLocalDateString(today);
    const todaySummary = this.dailySummaryRepo.findByDate(todayStr);

    // Calculate current week Monday–Sunday
    const dayOfWeek = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekStart = toLocalDateString(monday);
    const weekEnd = toLocalDateString(sunday);

    const weekSummaries = this.dailySummaryRepo.findByDateRange(weekStart, weekEnd);
    const workHoursToday = todaySummary?.workHours ?? 0;

    return {
      workHoursToday,
      todaySummary: todaySummary ? { content: todaySummary.content, mood: todaySummary.mood } : null,
      weekSummaries,
    };
  }

  /** Build active (in-progress + review) task list for the table. */
  private buildActiveTasks(tasks: Task[]): ActiveTask[] {
    return tasks
      .filter(t => t.status === "in_progress" || t.status === "review")
      .map(t => ({
        id: t.id,
        priority: t.priority,
        project: t.project,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate ?? undefined,
      }));
  }
}
