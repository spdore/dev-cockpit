const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}

export interface TaskData {
  id: string; title: string; content: string;
  projectId: string; project: { id: string; name: string; color: string };
  priority: string; status: string;
  startDate: string | null; dueDate: string | null;
  tags: string[]; createdAt: string; completedAt: string | null;
  todayOrder: number | null;
  subtasks?: { title: string; done: boolean }[];
}

export interface ProjectData {
  id: string; name: string; description: string; color: string; status: string;
  repoUrl: string; startDate: string | null; targetDate: string | null;
  taskCount: number; completionRate: number;
}

export interface DashboardData {
  todayTasks: TaskData[];
  weekStats: { completed: number; inProgress: number; pending: number; completionRate: number; todayProjectActivity: { projectId: string; projectName: string; projectColor: string; completedToday: number }[] };
  statusStats: { workHoursToday: number; todaySummary: { content: string; mood: string } | null; weekSummaries: { date: string; content: string; workHours: number; mood: string }[] };
  heatmapData: { date: string; hours: number; level: number }[];
  achievements: { id: string; title: string; description: string; icon: string; conditionType: string; conditionValue: number; unlockedAt: string | null }[];
  activeTasks: { id: string; priority: string; project: { id: string; name: string; color: string }; title: string; status: string; dueDate?: string }[];
}

export const api = {
  getDashboard:    () => request<DashboardData>("/dashboard"),
  getTasks:        () => request<TaskData[]>("/tasks"),
  createTask:      (body: Record<string, unknown>) => request<{ id: string }>("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask:      (id: string, body: Record<string, unknown>) => request<{ ok: true }>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTask:      (id: string) => request<{ ok: true }>(`/tasks/${id}`, { method: "DELETE" }),
  toggleTask:      (id: string) => request<{ status: string }>(`/tasks/${id}/toggle`, { method: "POST" }),
  reorderTasks:    (orderedIds: string[]) => request<{ ok: true }>("/tasks/reorder", { method: "POST", body: JSON.stringify({ orderedIds }) }),
  getProjects:     () => request<ProjectData[]>("/projects"),
  createProject:   (body: Record<string, unknown>) => request<{ id: string }>("/projects", { method: "POST", body: JSON.stringify(body) }),
  updateProject:   (id: string, body: Record<string, unknown>) => request<{ ok: true }>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProject:   (id: string) => request<{ ok: true }>(`/projects/${id}`, { method: "DELETE" }),
  getProjectTasks: (id: string) => request<{ project: ProjectData; tasks: TaskData[] }>(`/projects/${id}`),
  addDailySummary: (body: { date: string; content: string; workHours: number; mood: string }) => request<{ id: string }>("/daily-summary", { method: "POST", body: JSON.stringify(body) }),
  getDailySummaries: () => request<{ workHoursToday: number; todaySummary: { content: string; mood: string } | null; weekSummaries: { date: string; content: string; workHours: number; mood: string }[] }>("/daily-summary"),
};
