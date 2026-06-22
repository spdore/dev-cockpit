"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface TodayProjectActivity { projectId: string; projectName: string; projectColor: string; completedToday: number; }

interface WeekOverviewProps {
  stats: { completed: number; inProgress: number; pending: number; completionRate: number; todayProjectActivity: TodayProjectActivity[] };
}

function ProgressRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const sw = 6; const r = (size - sw) / 2; const circ = 2 * Math.PI * r; const off = circ - (percent / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-muted/20" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} className="text-primary transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-base font-bold tabular-nums">{percent}%</span>
    </div>
  );
}

export function WeekOverview({ stats }: WeekOverviewProps) {
  const totalThisWeek = stats.completed + stats.inProgress + stats.pending;
  const weekProgress = totalThisWeek > 0 ? Math.round((stats.completed / totalThisWeek) * 100) : 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">📊 本周概览</CardTitle></CardHeader>
      <CardContent className="flex-1 space-y-3 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center"><p className="text-xl font-bold tabular-nums text-emerald-400">{stats.completed}</p><p className="text-[10px] text-muted-foreground">已完成</p></div>
          <div className="text-center"><p className="text-xl font-bold tabular-nums text-amber-400">{stats.inProgress}</p><p className="text-[10px] text-muted-foreground">进行中</p></div>
          <div className="text-center"><p className="text-xl font-bold tabular-nums text-blue-400">{stats.pending}</p><p className="text-[10px] text-muted-foreground">待开始</p></div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ProgressRing percent={weekProgress} size={64} />
          <p className="text-[10px] text-muted-foreground tabular-nums">{stats.completed}/{totalThisWeek} 任务</p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">今日活跃</p>
          {stats.todayProjectActivity.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/50 text-center py-1">暂无</p>
          ) : (
            stats.todayProjectActivity.map((p, i) => (
              <Link key={p.projectId || `act-${i}`} href={`/projects/${p.projectId}`} className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted/50 transition-colors">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.projectColor }} />
                <span className="min-w-0 flex-1 truncate text-[11px] hover:underline">{p.projectName}</span>
                <span className="text-[11px] font-medium tabular-nums">{p.completedToday}</span>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
