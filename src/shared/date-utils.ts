/**
 * Date & time utility functions.
 *
 * Pure functions extracted from dashboard/calendar/heatmap components.
 * No React dependencies — usable on both server and client.
 */

// ═══════════════════════════════════════════════════════════
// Week helpers
// ═══════════════════════════════════════════════════════════

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;

/** A single day entry in a week view. */
export interface WeekDay {
  date: string;
  label: string;
  isToday: boolean;
}

/**
 * Build an array of 7 days for the current week (Monday → Sunday).
 * Includes `isToday` flag for highlighting the current day.
 */
export function getCurrentWeekDays(): WeekDay[] {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]!;
  const dayOfWeek = now.getDay(); // 0=Sun

  // Monday of current week
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0]!;
    days.push({
      date: dateStr,
      label: WEEKDAY_LABELS[i]!,
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

/**
 * Get the Monday date of the current week, optionally offset by N weeks.
 * @param weekOffset 0 = current week, -1 = last week, +1 = next week
 */
export function getWeekStart(weekOffset = 0): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
  return monday;
}

/** Format a week range string from a Monday date. */
export function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;
}

// ═══════════════════════════════════════════════════════════
// Heatmap grid
// ═══════════════════════════════════════════════════════════

/** A cell in the monthly heatmap grid. */
export interface HeatmapCell {
  date: string;
  count: number;
  level: number;
}

/**
 * Build a 6-row × 7-column heatmap grid for a given month.
 * Pads incomplete first/last rows with null so every row has exactly 7 slots.
 */
export function buildHeatmapGrid(
  year: number,
  month: number,
  dateMap: Map<string, HeatmapCell>,
): (HeatmapCell | null)[][] {
  const result: (HeatmapCell | null)[][] = [];
  let currentRow: (HeatmapCell | null)[] = [];

  // Pad first row: find which weekday the 1st falls on (1=Mon, 7=Sun)
  const firstDay = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDay.getDay() || 7; // normalize Sun 0→7
  for (let i = 1; i < startDayOfWeek; i++) {
    currentRow.push(null);
  }

  // Fill days of the month
  const lastDay = new Date(year, month, 0);
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const ds = d.toISOString().split("T")[0]!;
    currentRow.push(dateMap.get(ds) ?? { date: ds, count: 0, level: 0 });
    if (currentRow.length === 7) {
      result.push(currentRow);
      currentRow = [];
    }
  }

  // Pad incomplete last row
  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push(null);
    }
    result.push(currentRow);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════
// Formatting
// ═══════════════════════════════════════════════════════════

/** Format a Date as a Chinese locale date string. */
export function formatDateCN(date: Date = new Date()): string {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/** Get today's date as YYYY-MM-DD string. */
export function todayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

/** Compute days between two date strings. */
export function daysBetween(from: string, to: string): number {
  const f = new Date(from);
  const t = new Date(to);
  return Math.ceil((t.getTime() - f.getTime()) / 86400000);
}
