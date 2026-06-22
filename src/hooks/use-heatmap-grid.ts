/**
 * Hook: Monthly heatmap calendar grid with navigation.
 *
 * Builds a GitHub-style 7-column × 6-row grid for the selected month.
 * Provides month/year state and prev/next navigation.
 */

import { useState, useMemo } from "react";
import { buildHeatmapGrid, type HeatmapCell } from "@/shared/date-utils";
import type { HeatmapDay } from "@/core/entities";

export function useHeatmapGrid(data: HeatmapDay[] = []) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  /** Filter heatmap data to the selected month. */
  const monthData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return data.filter((d) => d.date.startsWith(prefix));
  }, [year, month, data]);

  /** Build a date → cell lookup map, mapping hours to count. */
  const dateMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    for (const d of monthData) map.set(d.date, {
      date: d.date,
      count: Math.round(d.hours * 100), // store hours*100 for precision, display divides back
      level: d.level,
    });
    return map;
  }, [monthData]);

  /** Build the 6×7 grid with padding. */
  const weeks = useMemo(
    () => buildHeatmapGrid(year, month, dateMap),
    [year, month, dateMap],
  );

  const prev = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const next = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return { weeks, year, month, prev, next };
}
