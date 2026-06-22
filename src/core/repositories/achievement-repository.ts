/**
 * Achievement data-access repository.
 */

import { BaseRepository } from "./base-repository";
import { mapAchievement } from "@/shared/mappers";
import type { Achievement } from "@/core/entities";

export class AchievementRepository extends BaseRepository {
  /** Retrieve all achievements, unlocked first, then by creation date. */
  findAll(): Achievement[] {
    const rows = this.db
      .prepare("SELECT * FROM achievements ORDER BY unlocked_at DESC, created_at")
      .all() as Record<string, unknown>[];
    return rows.map(mapAchievement);
  }

  /** Mark an achievement as unlocked at the given time. */
  unlock(id: string, unlockedAt: string): void {
    this.db
      .prepare("UPDATE achievements SET unlocked_at = ? WHERE id = ? AND unlocked_at IS NULL")
      .run(unlockedAt, id);
  }
}
