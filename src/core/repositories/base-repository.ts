/**
 * Abstract base class for all repositories.
 *
 * Provides shared database access and utility methods.
 * Each concrete repository receives the Database instance via constructor.
 */

import type Database from "better-sqlite3";
import { NotFoundError } from "@/shared/errors";

export abstract class BaseRepository {
  /** @param db — the SQLite database connection */
  constructor(protected readonly db: Database.Database) {}

  /**
   * Generate a simple unique ID for a new entity.
   * Uses crypto.randomUUID() for collision-resistant IDs.
   */
  protected generateId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  /**
   * Assert that exactly one row was affected by a write operation.
   * Throws NotFoundError if no rows changed (entity doesn't exist).
   */
  protected assertAffected(result: { changes: number }, entity: string): void {
    if (result.changes === 0) {
      throw new NotFoundError(entity);
    }
  }
}
