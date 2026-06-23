/**
 * Domain entity interfaces and DTOs for DevCockpit.
 *
 * Entities represent the core data shapes used across the application.
 * DTOs (Data Transfer Objects) define the shape of data entering/leaving the API.
 */

import type { TaskPriority, TaskStatus, ProjectStatus, ActionType, EntityType } from "./enums";

// ═══════════════════════════════════════════════════════════════════════
// Project
// ═══════════════════════════════════════════════════════════════════════

/** Lightweight project reference (used as a nested field in tasks). */
export interface ProjectRef {
  /** Unique project identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Hex color code (e.g. "#8B5CF6"). */
  color: string;
}

/** Full project entity returned by the API. */
export interface Project {
  id: string;
  name: string;
  /** Markdown-compatible description. */
  description: string;
  /** Hex color code. */
  color: string;
  status: ProjectStatus;
  /** Remote Git repository URL (may be empty). */
  repoUrl: string;
  /** ISO-8601 date string or null. */
  startDate: string | null;
  /** ISO-8601 date string or null. */
  targetDate: string | null;
  /** Total number of associated tasks. */
  taskCount: number;
  /** Percentage of tasks completed (0-100). */
  completionRate: number;
}

/** Input for creating a new project. */
export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
  repoUrl?: string;
  startDate?: string | null;
  targetDate?: string | null;
}

/** Input for updating an existing project (all fields optional). */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
  repoUrl?: string;
  startDate?: string | null;
  targetDate?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// Task
// ═══════════════════════════════════════════════════════════════════════

/** A sub-task item. */
export interface Subtask {
  title: string;
  done: boolean;
}

/** Full task entity returned by the API. */
export interface Task {
  id: string;
  title: string;
  /** Detailed description / body. */
  content: string;
  projectId: string;
  project: ProjectRef;
  priority: TaskPriority;
  status: TaskStatus;
  /** ISO-8601 date string or null. */
  startDate: string | null;
  /** ISO-8601 date string or null. */
  dueDate: string | null;
  tags: string[];
  /** ISO-8601 datetime string. */
  createdAt: string;
  /** ISO-8601 datetime string or null when not completed. */
  completedAt: string | null;
  /** Position in today's focus list (lower = first). */
  todayOrder: number | null;
  /** Parsed sub-task checklist. */
  subtasks: Subtask[];
}

/** Lightweight task reference for dashboard aggregation. */
export interface ActiveTask {
  id: string;
  priority: TaskPriority;
  project: ProjectRef;
  title: string;
  status: TaskStatus;
  dueDate?: string;
}

/** Task as displayed in the today-focus panel. */
export interface FocusTask {
  id: string;
  title: string;
  content: string;
  projectId: string;
  project: ProjectRef;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string | null;
  dueDate: string | null;
  tags: string[];
  todayOrder: number | null;
  completedAt: string | null;
}

/** Input for creating a task. */
export interface CreateTaskInput {
  title: string;
  content?: string;
  projectId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  tags?: string[];
  todayOrder?: number | null;
  subtasks?: Subtask[];
}

/** Input for updating a task (all fields optional). */
export interface UpdateTaskInput {
  title?: string;
  content?: string;
  projectId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  tags?: string[];
  todayOrder?: number | null;
  subtasks?: Subtask[] | null;
  completedAt?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// Achievement
// ═══════════════════════════════════════════════════════════════════════

/** Full achievement entity returned by the API. */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Type of condition (e.g. "task_count", "streak"). */
  conditionType: string;
  /** Threshold value to unlock. */
  conditionValue: number;
  /** ISO-8601 datetime when unlocked, or null. */
  unlockedAt: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// Daily Summary
// ═══════════════════════════════════════════════════════════════════════

/** A single daily work summary. */
export interface DailySummary {
  /** ISO-8601 date string (YYYY-MM-DD). */
  date: string;
  /** Free-text journal entry. */
  content: string;
  /** Hours worked (decimal). */
  workHours: number;
  /** Mood emoji. */
  mood: string;
}

export interface DailySummaryInput {
  date: string;
  content: string;
  workHours: number;
  mood: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Chat / AI
// ═══════════════════════════════════════════════════════════════════════

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: string;
  role: "user" | "ai";
  content: string;
  action: ActionPayload | null;
  executed: boolean;
  error: string | null;
  createdAt: string;
}

export interface ActionPayload {
  type: ActionType;
  entity: EntityType;
  data: Record<string, unknown>;
  executed?: boolean;
}

export interface ChatMessageInput {
  conversationId: string;
  role: "user" | "ai";
  content: string;
  action?: ActionPayload | ActionPayload[] | null;
  executed?: boolean;
  error?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════
// Dashboard Aggregation
// ═══════════════════════════════════════════════════════════════════════

/** Weekly task completion statistics. */
export interface WeekStats {
  completed: number;
  inProgress: number;
  pending: number;
  /** Percentage 0-100. */
  completionRate: number;
  todayProjectActivity: {
    projectId: string;
    projectName: string;
    projectColor: string;
    completedToday: number;
  }[];
}

/** A single day in the activity heatmap. */
export interface HeatmapDay {
  date: string;
  /** Hours worked that day. */
  hours: number;
  /** Continuous intensity 0–1 for color interpolation. */
  level: number;
}

/** Cognitive / status statistics for the dashboard. */
export interface StatusStats {
  workHoursToday: number;
  todaySummary: { content: string; mood: string } | null;
  weekSummaries: DailySummary[];
}

/** Aggregated dashboard data returned by GET /api/dashboard. */
export interface DashboardData {
  todayTasks: FocusTask[];
  weekStats: WeekStats;
  statusStats: StatusStats;
  heatmapData: HeatmapDay[];
  achievements: Achievement[];
  activeTasks: ActiveTask[];
}
