/**
 * Activity heatmap card — GitHub-style monthly calendar with continuous green scale.
 *
 * Color intensity is driven by work hours: 0h = transparent, max = solid emerald-500.
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHeatmapGrid } from "@/hooks/use-heatmap-grid";
import type { HeatmapDay } from "@/core/entities";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

interface HeatmapCardProps {
  data?: HeatmapDay[];
}

/**
 * Map a continuous 0–1 level to an rgba green color.
 * level=0 → transparent (no green), level=1 → solid emerald-500.
 */
function heatColor(level: number): string {
  if (level <= 0) return "rgba(128,128,128,0.12)";
  return `rgba(16,185,129,${level.toFixed(2)})`;
}

export function HeatmapCard({ data }: HeatmapCardProps) {
  const { weeks, year, month, prev, next } = useHeatmapGrid(data ?? []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">📅 活动热力图</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prev}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[80px] text-center text-[11px] text-muted-foreground">
            {year} 年 {month} 月
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={next}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-1">
        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] text-muted-foreground">{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex-1 grid grid-rows-6 gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((cell, ci) => {
                if (!cell || cell.date.startsWith("pad-")) {
                  return <div key={`e-${ci}`} />;
                }
                return (
                  <div
                    key={cell.date}
                    className="w-full h-full rounded-sm"
                    style={{ backgroundColor: heatColor(cell.level) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground shrink-0">
          <span>0h</span>
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "rgba(128,128,128,0.12)" }} />
          {[0.2, 0.4, 0.6, 0.8].map(lvl => (
            <div key={lvl} className="h-3 w-3 rounded-sm" style={{ backgroundColor: heatColor(lvl) }} />
          ))}
          <span>8h+</span>
        </div>
      </CardContent>
    </Card>
  );
}
