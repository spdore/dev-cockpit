/**
 * Task data-access repository.
 *
 * Encapsulates all SQL queries for the tasks table.
 */

import { BaseRepository } from "./base-repository";
import { NotFoundError } from "@/shared/errors";
import { mapTask } from "@/shared/mappers";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/core/entities";

export class TaskRepository extends BaseRepository {
  /** Retrieve all tasks joined with their project. */
  findAll(): Task[] {
    const rows = this.db
      .prepare(
        `SELECT t.*, p.name AS project_name, p.color AS project_color
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         ORDER BY t.created_at DESC`
      )
      .all() as Record<string, unknown>[];
    return rows.map(mapTask);
  }

  /** Find a single task by ID. */
  findById(id: string): Task | undefined {
    const row = this.db
      .prepare(
        `SELECT t.*, p.name AS project_name, p.color AS project_color
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE t.id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;
    return row ? mapTask(row) : undefined;
  }

  /** Get all tasks belonging to a specific project. */
  findByProject(projectId: string): Task[] {
    const rows = this.db
      .prepare(
        `SELECT t.*, p.name AS project_name, p.color AS project_color
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE t.project_id = ?
         ORDER BY t.created_at DESC`
      )
      .all(projectId) as Record<string, unknown>[];
    return rows.map(mapTask);
  }

  /** Create a new task. Returns the generated ID. */
  create(input: CreateTaskInput): string {
    const id = this.generateId("task");
    this.db
      .prepare(
        `INSERT INTO tasks (id, title, content, project_id, priority, status, start_date, due_date, tags, today_order, subtasks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.title,
        input.content ?? "",
        input.projectId ?? "",
        input.priority ?? "medium",
        input.status ?? "todo",
        input.startDate ?? null,
        input.dueDate ?? null,
        JSON.stringify(input.tags ?? []),
        input.todayOrder ?? null,
        input.subtasks ? JSON.stringify(input.subtasks) : null
      );
    return id;
  }

  /** Update fields of an existing task. Throws if task not found. */
  update(id: string, input: UpdateTaskInput): void {
    const fieldMap: Record<string, string> = {
      title: "title",
      content: "content",
      projectId: "project_id",
      priority: "priority",
      status: "status",
      startDate: "start_date",
      dueDate: "due_date",
      tags: "tags",
      todayOrder: "today_order",
      subtasks: "subtasks",
      completedAt: "completed_at",
    };

    const sets: string[] = [];
    const vals: unknown[] = [];

    for (const [key, col] of Object.entries(fieldMap)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        sets.push(`${col} = ?`);
        // Serialize arrays/objects
        vals.push(
          key === "tags" ? JSON.stringify(value) :
          key === "subtasks" ? JSON.stringify(value) :
          value
        );
      }
    }

    if (sets.length === 0) return;

    vals.push(id);
    const result = this.db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    this.assertAffected(result, "任务");
  }

  /** Toggle a task between "done" and "todo". Returns new status and completed_at. */
  toggle(id: string): { status: string; completedAt: string | null } {
    const row = this.db.prepare("SELECT status FROM tasks WHERE id = ?").get(id) as { status: string } | undefined;
    if (!row) throw new NotFoundError("任务");

    const newStatus = row.status === "done" ? "todo" : "done";
    const completedAt = newStatus === "done" ? new Date().toISOString() : null;
    this.db
      .prepare("UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?")
      .run(newStatus, completedAt, id);
    return { status: newStatus, completedAt };
  }

  /** Reorder tasks in today's focus list. */
  reorder(orderedIds: string[]): void {
    const stmt = this.db.prepare("UPDATE tasks SET today_order = ? WHERE id = ?");
    const tx = this.db.transaction((ids: string[]) => {
      for (let i = 0; i < ids.length; i++) {
        stmt.run(i, ids[i]);
      }
    });
    tx(orderedIds);
  }

  /** Delete a task by ID. Throws if not found. */
  delete(id: string): void {
    const result = this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    this.assertAffected(result, "任务");
  }
}
