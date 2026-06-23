export interface ProjectRef {
  id: string; name: string; color: string;
}

export interface Project {
  id: string; name: string; description: string;
  color: string; status: string;
  repoUrl: string; startDate: string | null; targetDate: string | null;
  taskCount: number; completionRate: number;
}

export interface Subtask {
  title: string; done: boolean;
}

export interface FocusTask {
  id: string; title: string; content: string;
  project: ProjectRef;
  priority: string; status: string;
  startDate: string | null; dueDate: string | null;
  tags: string[];
}

export interface WeekStats {
  completed: number; inProgress: number; pending: number; completionRate: number;
  todayProjectActivity: { projectId: string; projectName: string; projectColor: string; completedToday: number }[];
}

export interface HeatmapDay {
  date: string; count: number; level: 0 | 1 | 2 | 3 | 4;
}

export interface StatusStats {
  workHoursToday: number;
  todaySummary: { content: string; mood: string } | null;
  weekSummaries: { date: string; content: string; workHours: number; mood: string }[];
}

export interface Achievement {
  id: string; title: string; description: string; icon: string;
  conditionType: string; conditionValue: number;
  unlockedAt: string | null;
}

export interface ActiveTask {
  id: string; priority: string;
  project: ProjectRef;
  title: string; status: string;
  dueDate?: string;
}
