/**
 * Milestone data-access repository.
 */

import { BaseRepository } from "./base-repository";
import { mapMilestone } from "@/shared/mappers";
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput } from "@/core/entities";

export class MilestoneRepository extends BaseRepository {
  /** Retrieve all milestones with joined project info. */
  findAll(): Milestone[] {
    const rows = this.db
      .prepare(
        `SELECT m.*, p.name AS project_name, p.color AS project_color
         FROM milestones m
         JOIN projects p ON m.project_id = p.id
         ORDER BY m.target_date`
      )
      .all() as Record<string, unknown>[];
    return rows.map(mapMilestone);
  }

  /** Create a new milestone. */
  create(input: CreateMilestoneInput): string {
    const id = this.generateId("ms");
    this.db
      .prepare(
        `INSERT INTO milestones (id, project_id, title, target_date, progress)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, input.projectId, input.title, input.targetDate, input.progress ?? 0);
    return id;
  }

  /** Update fields of an existing milestone. */
  update(input: UpdateMilestoneInput): void {
    const allowed = ["project_id", "title", "target_date", "progress"] as const;
    const sets: string[] = [];
    const vals: unknown[] = [];

    const inputMap: Record<string, unknown> = {
      project_id: input.projectId,
      title: input.title,
      target_date: input.targetDate,
      progress: input.progress,
    };

    for (const col of allowed) {
      if (inputMap[col] !== undefined) {
        sets.push(`${col} = ?`);
        vals.push(inputMap[col]);
      }
    }

    if (sets.length === 0) return;

    vals.push(input.id);
    const result = this.db.prepare(`UPDATE milestones SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    this.assertAffected(result, "里程碑");
  }

  /** Delete a milestone by ID. */
  delete(id: string): void {
    const result = this.db.prepare("DELETE FROM milestones WHERE id = ?").run(id);
    this.assertAffected(result, "里程碑");
  }
}
