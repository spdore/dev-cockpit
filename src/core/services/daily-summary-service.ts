/**
 * Daily summary business logic service.
 */

import type { DailySummaryRepository } from "@/core/repositories/daily-summary-repository";
import type { StatusStats, DailySummaryInput } from "@/core/entities";
import { toLocalDateString } from "@/shared/date-utils";

export class DailySummaryService {
  constructor(private readonly summaryRepo: DailySummaryRepository) {}

  /** Get today's status + all summaries (for journal page). */
  getStatusStats(): StatusStats {
    const todayStr = toLocalDateString(new Date());
    const today = this.summaryRepo.findByDate(todayStr);
    const weekSummaries = this.summaryRepo.findAll();

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
