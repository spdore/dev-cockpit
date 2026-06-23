/**
 * Daily summary data-access repository.
 */

import { BaseRepository } from "./base-repository";
import { mapDailySummary } from "@/shared/mappers";
import type { DailySummary, DailySummaryInput } from "@/core/entities";

export class DailySummaryRepository extends BaseRepository {
  /** Find a summary by exact date. */
  findByDate(date: string): DailySummary | undefined {
    const row = this.db
      .prepare("SELECT * FROM daily_summaries WHERE date = ?")
      .get(date) as Record<string, unknown> | undefined;
    return row ? mapDailySummary(row) : undefined;
  }

  /** Get summaries for the last N days. */
  findRecent(days: number): DailySummary[] {
    const rows = this.db
      .prepare("SELECT * FROM daily_summaries WHERE date >= date('now', ?) ORDER BY date DESC")
      .all(`-${days} days`) as Record<string, unknown>[];
    return rows.map(mapDailySummary);
  }

  /** Get summaries within a date range (inclusive). */
  findByDateRange(startDate: string, endDate: string): DailySummary[] {
    const rows = this.db
      .prepare("SELECT * FROM daily_summaries WHERE date >= ? AND date <= ? ORDER BY date ASC")
      .all(startDate, endDate) as Record<string, unknown>[];
    return rows.map(mapDailySummary);
  }

  /** Get all summaries, newest first. */
  findAll(): DailySummary[] {
    const rows = this.db
      .prepare("SELECT * FROM daily_summaries ORDER BY date DESC")
      .all() as Record<string, unknown>[];
    return rows.map(mapDailySummary);
  }

  /** Insert or replace a daily summary (upsert). */
  upsert(input: DailySummaryInput): string {
    const id = `ds-${input.date}`;
    this.db
      .prepare(
        `INSERT OR REPLACE INTO daily_summaries (id, date, content, work_hours, mood)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, input.date, input.content, input.workHours, input.mood);
    return id;
  }
}
