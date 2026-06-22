/**
 * Daily summary business logic service.
 */

import type { DailySummaryRepository } from "@/core/repositories/daily-summary-repository";
import type { StatusStats, DailySummaryInput } from "@/core/entities";

export class DailySummaryService {
  constructor(private readonly summaryRepo: DailySummaryRepository) {}

  /** Get today's status + this week's summaries. */
  getStatusStats(): StatusStats {
    const todayStr = new Date().toISOString().split("T")[0]!;
    const today = this.summaryRepo.findByDate(todayStr);
    const weekSummaries = this.summaryRepo.findRecent(7);

    return {
      workHoursToday: today?.workHours ?? 0,
      todaySummary: today ? { content: today.content, mood: today.mood } : null,
      weekSummaries,
    };
  }

  /** Insert or update a daily summary. */
  addOrUpdate(input: DailySummaryInput): string {
    return this.summaryRepo.upsert(input);
  }
}
