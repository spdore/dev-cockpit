"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPriority, getTaskStatus, TASK_STATUS_CONFIG } from "@/lib/constants";
import type { ActiveTask } from "@/lib/types";
import Link from "next/link";

interface ActiveTasksTableProps { tasks: ActiveTask[]; onStatusChange?: (taskId: string, newStatus: string) => void; }

const NEXT_STATUS: Record<string, string> = { todo: "in_progress", in_progress: "review", review: "done", done: "todo", inbox: "todo" };

export function ActiveTasksTable({ tasks, onStatusChange }: ActiveTasksTableProps) {
  const handleStatusClick = (taskId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus] || "todo";
    onStatusChange?.(taskId, next);
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base font-medium">📋 进行中的任务</CardTitle></CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-base text-muted-foreground">暂无进行中的任务</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-[11px] text-muted-foreground"><th className="w-10 pb-2 font-normal">优先级</th><th className="w-28 pb-2 font-normal">项目</th><th className="pb-2 font-normal">任务</th><th className="w-20 pb-2 font-normal">状态</th><th className="w-24 pb-2 font-normal">截止</th></tr></thead>
              <tbody>
                {tasks.map((task) => {
                  const prio = getPriority(task.priority);
                  const st = getTaskStatus(task.status);
                  return (
                    <tr key={task.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                      <td className="py-2"><span className={cn("inline-block h-2 w-2 rounded-full", prio.dot)} /></td>
                      <td className="py-2"><Link href={`/projects/${task.project.id}`}><Badge variant="outline" className="h-4 px-1 text-[11px] hover:underline" style={{borderColor:task.project.color+"40",color:task.project.color}}>{task.project.name}</Badge></Link></td>
                      <td className="py-2"><Link href={`/tasks/${task.id}`} className="text-[13px] hover:underline line-clamp-1">{task.title}</Link></td>
                      <td className="py-2">
                        <button onClick={() => handleStatusClick(task.id, task.status)} className="cursor-pointer" title="点击切换状态">
                          <Badge variant="outline" className={cn("h-4 px-1.5 text-[11px] hover:ring-1 hover:ring-primary/50 transition-all", st.color, st.bg)}>{st.label}</Badge>
                        </button>
                      </td>
                      <td className="py-2 text-[11px] text-muted-foreground">{task.dueDate ? task.dueDate.split("T")[0] : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
