/**
 * Row-to-entity mapping functions.
 *
 * Converts raw database row objects (snake_case columns) into
 * typed domain entities (camelCase fields). All row parsing is
 * centralized here — no API route should map rows manually.
 */

import type {
  Project,
  ProjectRef,
  Task,
  Achievement,
  DailySummary,
  Conversation,
  ChatMessage,
  Subtask,
  FocusTask,
  ActiveTask,
} from "@/core/entities";

// ═══════════════════════════════════════════════════════════
// JSON parsers (extracted from db.ts)
// ═══════════════════════════════════════════════════════════

/** Safely parse a JSON string array, returning [] on failure. */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

/** Safely parse subtasks JSON, returning [] on failure. */
export function parseSubtasks(raw: string | null | undefined): Subtask[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ═══════════════════════════════════════════════════════════
// Entity mappers
// ═══════════════════════════════════════════════════════════

/** Map a project row (with joined task stats) to a Project entity. */
export function mapProject(row: Record<string, unknown>): Project {
  return {
    id:             String(row.id ?? ""),
    name:           String(row.name ?? ""),
    description:    String(row.description ?? ""),
    color:          String(row.color ?? "#6B7280"),
    status:         String(row.status ?? "active") as Project["status"],
    repoUrl:        String(row.repo_url ?? ""),
    startDate:      (row.start_date as string) ?? null,
    targetDate:     (row.target_date as string) ?? null,
    taskCount:      Number(row.task_count ?? 0),
    completionRate: Math.round(Number(row.completion_rate ?? 0)),
  };
}

/** Map a task row (with joined project fields) to a Task entity. */
export function mapTask(row: Record<string, unknown>): Task {
  return {
    id:          String(row.id ?? ""),
    title:       String(row.title ?? ""),
    content:     String(row.content ?? ""),
    projectId:   String(row.project_id ?? ""),
    project: {
      id:    String(row.project_id ?? ""),
      name:  String(row.project_name ?? ""),
      color: String(row.project_color ?? "#6B7280"),
    },
    priority:    String(row.priority ?? "medium") as Task["priority"],
    status:      String(row.status ?? "todo") as Task["status"],
    startDate:   (row.start_date as string) ?? null,
    dueDate:     (row.due_date as string) ?? null,
    tags:        parseTags(row.tags as string),
    createdAt:   String(row.created_at ?? ""),
    completedAt: (row.completed_at as string) ?? null,
    todayOrder:  row.today_order != null ? Number(row.today_order) : null,
    subtasks:    parseSubtasks(row.subtasks as string | null),
  };
}

/** Map a task row to a FocusTask (subset used on dashboard). */
export function mapFocusTask(row: Record<string, unknown>): FocusTask {
  return {
    id:          String(row.id ?? ""),
    title:       String(row.title ?? ""),
    content:     String(row.content ?? ""),
    projectId:   String(row.project_id ?? ""),
    project: {
      id:    String(row.project_id ?? ""),
      name:  String(row.project_name ?? ""),
      color: String(row.project_color ?? "#6B7280"),
    },
    priority:    String(row.priority ?? "medium") as FocusTask["priority"],
    status:      String(row.status ?? "todo") as FocusTask["status"],
    startDate:   (row.start_date as string) ?? null,
    dueDate:     (row.due_date as string) ?? null,
    tags:        parseTags(row.tags as string),
    todayOrder:  row.today_order != null ? Number(row.today_order) : null,
    completedAt: (row.completed_at as string) ?? null,
  };
}

/** Map a task row to an ActiveTask (table row on dashboard). */
export function mapActiveTask(row: Record<string, unknown>): ActiveTask {
  return {
    id:       String(row.id ?? ""),
    priority: String(row.priority ?? "medium") as ActiveTask["priority"],
    project: {
      id:    String(row.project_id ?? ""),
      name:  String(row.project_name ?? ""),
      color: String(row.project_color ?? "#6B7280"),
    },
    title:  String(row.title ?? ""),
    status: String(row.status ?? "todo") as ActiveTask["status"],
    dueDate: (row.due_date as string) ?? undefined,
  };
}

/** Map an achievement row to an Achievement entity. */
export function mapAchievement(row: Record<string, unknown>): Achievement {
  return {
    id:             String(row.id ?? ""),
    title:          String(row.title ?? ""),
    description:    String(row.description ?? ""),
    icon:           String(row.icon ?? "🏆"),
    conditionType:  String(row.condition_type ?? ""),
    conditionValue: Number(row.condition_value ?? 1),
    unlockedAt:     (row.unlocked_at as string) ?? null,
  };
}

/** Map a daily summary row to a DailySummary entity. */
export function mapDailySummary(row: Record<string, unknown>): DailySummary {
  return {
    date:      String(row.date ?? ""),
    content:   String(row.content ?? ""),
    workHours: Number(row.work_hours ?? 0),
    mood:      String(row.mood ?? ""),
  };
}

/** Map a conversation row to a Conversation entity. */
export function mapConversation(row: Record<string, unknown>): Conversation {
  return {
    id:        String(row.id ?? ""),
    title:     String(row.title ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

/** Map a chat message row to a ChatMessage entity. */
export function mapChatMessage(row: Record<string, unknown>): ChatMessage {
  let action = null;
  try {
    const raw = row.action as string | null;
    if (raw) action = JSON.parse(raw);
  } catch { /* keep null */ }
  return {
    id:             Number(row.id ?? 0),
    conversationId: String(row.conversation_id ?? "default"),
    role:           (row.role as "user" | "ai") ?? "ai",
    content:        String(row.content ?? ""),
    action,
    executed:       Boolean(row.executed),
    error:          (row.error as string) ?? null,
    createdAt:      String(row.created_at ?? ""),
  };
}
