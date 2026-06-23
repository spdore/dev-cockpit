"use client";

import { useCallback } from "react";
import { useDashboard } from "@/hooks/use-dashboard";
import { api } from "@/lib/api-client";

import { TodayFocus } from "@/components/dashboard/today-focus";
import { WeekOverview } from "@/components/dashboard/week-overview";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { CognitiveCard } from "@/components/dashboard/cognitive-card";

import { MilestoneCard } from "@/components/dashboard/milestone-card";
import { ActiveTasksTable } from "@/components/dashboard/active-tasks-table";
import { getWeekNumber } from "@/lib/constants";

export default function DashboardPage() {
  const { todayTasks, weekStats, statusStats, heatmapData, achievements, activeTasks, isLoading, mutate } = useDashboard();
  const weekNum = getWeekNumber();
  const refresh = useCallback(() => mutate(), [mutate]);

  const handleToggle = useCallback(async (id: string) => { await api.toggleTask(id); refresh(); }, [refresh]);
  const handleReorder = useCallback(async (from: number, to: number) => {
    const ids = todayTasks.map(t => t.id); const [moved] = ids.splice(from, 1); ids.splice(to, 0, moved!);
    await api.reorderTasks(ids); refresh();
  }, [todayTasks, refresh]);

  const handleAddSummary = useCallback(async (data: { date: string; content: string; workHours: number; mood: string }) => { await api.addDailySummary(data); refresh(); }, [refresh]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground text-sm">加载中...</p></div>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">仪表盘</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">第 {weekNum} 周</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 h-[280px]">
        <TodayFocus tasks={todayTasks} onToggle={handleToggle} onReorder={handleReorder} />
        <WeekOverview stats={weekStats} />
        <CognitiveCard stats={statusStats} onAddSummary={handleAddSummary} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 h-[400px]">
        <div className="md:col-span-2"><HeatmapCard data={heatmapData} /></div>
        <MilestoneCard achievements={achievements} />
      </div>

      <ActiveTasksTable tasks={activeTasks} onStatusChange={async (taskId, newStatus) => { await api.updateTask(taskId, { status: newStatus }); refresh(); }} />
    </div>
  );
}
