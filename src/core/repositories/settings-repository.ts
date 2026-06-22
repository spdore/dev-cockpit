/**
 * User settings data-access repository.
 */

import { BaseRepository } from "./base-repository";

export class SettingsRepository extends BaseRepository {
  /** Read all settings as a key-value record. */
  findAll(): Record<string, string> {
    const rows = this.db
      .prepare("SELECT key, value FROM user_settings")
      .all() as { key: string; value: string }[];
    const result: Record<string, string> = {};
    for (const { key, value } of rows) {
      result[key] = value;
    }
    return result;
  }

  /** Upsert a single setting key-value pair. */
  save(key: string, value: string): void {
    this.db
      .prepare("INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)")
      .run(key, value);
  }

  /** Upsert multiple settings at once within a transaction. */
  saveBatch(settings: Record<string, string>): void {
    const stmt = this.db.prepare(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)"
    );
    const tx = this.db.transaction((entries: [string, string][]) => {
      for (const [key, value] of entries) {
        stmt.run(key, value);
      }
    });
    tx(Object.entries(settings));
  }
}
