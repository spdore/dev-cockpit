/**
 * Project data-access repository.
 *
 * Encapsulates all SQL queries related to the projects table.
 */

import { BaseRepository } from "./base-repository";
import { mapProject } from "@/shared/mappers";
import type { Project, CreateProjectInput, UpdateProjectInput } from "@/core/entities";

export class ProjectRepository extends BaseRepository {
  /** Retrieve all projects with computed task stats. */
  findAll(): Project[] {
    const rows = this.db
      .prepare(
        `SELECT p.*,
                COUNT(t.id) AS task_count,
                ROUND(AVG(CASE WHEN t.status = 'done' THEN 100 ELSE 0 END)) AS completion_rate
         FROM projects p
         LEFT JOIN tasks t ON t.project_id = p.id
         GROUP BY p.id
         ORDER BY p.created_at`
      )
      .all() as Record<string, unknown>[];
    return rows.map(mapProject);
  }

  /** Find a single project by ID. Returns undefined if not found. */
  findById(id: string): Project | undefined {
    const row = this.db
      .prepare(
        `SELECT p.*,
                COUNT(t.id) AS task_count,
                ROUND(AVG(CASE WHEN t.status = 'done' THEN 100 ELSE 0 END)) AS completion_rate
         FROM projects p
         LEFT JOIN tasks t ON t.project_id = p.id
         WHERE p.id = ?
         GROUP BY p.id`
      )
      .get(id) as Record<string, unknown> | undefined;
    return row ? mapProject(row) : undefined;
  }

  /** Get the first project (used as fallback for uncategorized tasks). */
  findFirst(): Project | undefined {
    const rows = this.findAll();
    return rows.length > 0 ? rows[0] : undefined;
  }

  /** Create a new project. Returns the generated ID. */
  create(input: CreateProjectInput): string {
    const id = input.name
      ? `proj-${crypto.randomUUID().slice(0, 8)}`
      : this.generateId("proj");

    this.db
      .prepare(
        `INSERT INTO projects (id, name, description, color, status, repo_url, start_date, target_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.name,
        input.description ?? "",
        input.color ?? "#8B5CF6",
        input.status ?? "active",
        input.repoUrl ?? "",
        input.startDate ?? null,
        input.targetDate ?? null
      );
    return id;
  }

  /** Update fields of an existing project. Throws if project not found. */
  update(id: string, input: UpdateProjectInput): void {
    const allowed = ["name", "description", "color", "status", "repo_url", "start_date", "target_date"] as const;
    const sets: string[] = [];
    const vals: unknown[] = [];

    const inputMap: Record<string, unknown> = {
      name: input.name,
      description: input.description,
      color: input.color,
      status: input.status,
      repo_url: input.repoUrl,
      start_date: input.startDate,
      target_date: input.targetDate,
    };

    for (const col of allowed) {
      if (inputMap[col] !== undefined) {
        sets.push(`${col} = ?`);
        vals.push(inputMap[col]);
      }
    }

    if (sets.length === 0) return;

    sets.push("updated_at = datetime('now')");
    vals.push(id);
    const result = this.db.prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    this.assertAffected(result, "项目");
  }

  /** Delete a project and its associated tasks (CASCADE). */
  delete(id: string): void {
    const result = this.db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    this.assertAffected(result, "项目");
  }
}
