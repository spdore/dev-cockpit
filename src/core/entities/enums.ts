/**
 * Enum-like type definitions and validators for domain entities.
 *
 * TypeScript does not have runtime enums that validate strings at runtime,
 * so we provide const arrays and type guards alongside the type aliases.
 */

// ── Task Priority ──

export const TASK_PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export function isTaskPriority(value: unknown): value is TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority);
}

// ── Task Status ──

export const TASK_STATUSES = ["inbox", "todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

// ── Project Status ──

export const PROJECT_STATUSES = ["active", "maintaining", "paused", "planned", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus);
}

// ── Cognitive Load Status ──

export const LOAD_STATUSES = ["healthy", "warning", "critical", "insufficient_data"] as const;
export type LoadStatus = (typeof LOAD_STATUSES)[number];

// ── AI Action Types ──

export const ACTION_TYPES = ["create", "update", "delete", "query", "none"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export function isActionType(value: unknown): value is ActionType {
  return ACTION_TYPES.includes(value as ActionType);
}

// ── AI Entity Types ──

export const ENTITY_TYPES = ["project", "task", "status", "milestone", "none"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];
