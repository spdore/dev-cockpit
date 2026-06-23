"use client";

import useSWR from "swr";
import { api, type DashboardData } from "@/lib/api-client";

export function useDashboard() {
  const { data, error, mutate } = useSWR<DashboardData>("dashboard", api.getDashboard);

  return {
    todayTasks: data?.todayTasks ?? [],
    weekStats: data?.weekStats ?? { completed:0,inProgress:0,pending:0,completionRate:0,todayProjectActivity:[] },
    statusStats: data?.statusStats ?? { workHoursToday:0,todaySummary:null,weekSummaries:[] },
    heatmapData: data?.heatmapData ?? [],
    achievements: data?.achievements ?? [],
    activeTasks: data?.activeTasks ?? [],
    isLoading: !data && !error,
    isError: !!error,
    mutate,
  };
}
