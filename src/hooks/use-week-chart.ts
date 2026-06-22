/**
 * Hook: Current week daily work hours for the cognitive card bar chart.
 *
 * Merges generated week days (Mon–Sun) with actual daily summary data.
 */

import { useMemo } from "react";
import { getCurrentWeekDays } from "@/shared/date-utils";
import type { DailySummary } from "@/core/entities";

export interface WeekBarDay {
  date: string;
  label: string;
  isToday: boolean;
  workHours: number;
  mood: string;
}

export function useWeekChart(weekSummaries: DailySummary[]) {
  return useMemo(() => {
    const generated = getCurrentWeekDays();
    const summaryMap = new Map<string, { workHours: number; mood: string }>();
    for (const s of weekSummaries) {
      summaryMap.set(s.date, { workHours: s.workHours, mood: s.mood });
    }

    const days: WeekBarDay[] = generated.map((d) => {
      const s = summaryMap.get(d.date);
      return { ...d, workHours: s?.workHours ?? 0, mood: s?.mood ?? "" };
    });

    const totalWeekHours = days.reduce((sum, d) => sum + d.workHours, 0);
    const maxHours = Math.max(...days.map((d) => d.workHours), 1);

    return { days, totalWeekHours, maxHours };
  }, [weekSummaries]);
}
