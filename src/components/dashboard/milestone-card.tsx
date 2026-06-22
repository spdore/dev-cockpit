"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface Achievement {
  id: string; title: string; description: string; icon: string;
  conditionType: string; conditionValue: number;
  unlockedAt: string | null;
}

interface AchievementCardProps { achievements: Achievement[]; }

const TYPE_LABELS: Record<string, string> = {
  daily_hours: "单日工时",
  task_count: "完成任务", streak: "连续打卡", weekly_complete: "完美一周",
  project_count: "多项目并行", daily_count: "单日冲刺", tag_docs: "文档积累", tag_bug: "Bug修复",
};

export function MilestoneCard({ achievements }: AchievementCardProps) {
  const unlocked = achievements.filter(a => a.unlockedAt);
  const locked = achievements.filter(a => !a.unlockedAt);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">🏆 成就</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {unlocked.length === 0 && locked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Trophy className="mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">暂无成就</p>
          </div>
        ) : (
          <>
            {/* Unlocked */}
            <div className="space-y-1.5">
              {unlocked.map((a) => (
                <div key={a.id} className="flex items-start gap-2 rounded-lg bg-primary/5 px-2.5 py-2">
                  <span className="text-lg shrink-0">{a.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">{a.description}</p>
                  </div>
                  {a.unlockedAt && <span className="ml-auto shrink-0 text-[9px] text-emerald-400 tabular-nums">已解锁</span>}
                </div>
              ))}
            </div>
            {/* Locked */}
            {locked.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">未解锁</p>
                {locked.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5 opacity-50">
                    <span className="text-lg shrink-0 grayscale">{a.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">{a.description}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">{TYPE_LABELS[a.conditionType] || ""} ×{a.conditionValue}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
