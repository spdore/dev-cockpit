"use client";

import { useState } from "react";
import useSWR from "swr";
import { api, type TaskData, type ProjectData } from "@/lib/api-client";
import { getPriority, getTaskStatus } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, X, ChevronRight, ChevronDown, FolderOpen, Pin, PinOff } from "lucide-react";
import Link from "next/link";

type SortMode = "recent" | "name" | "priority";
type StatusFilter = "all" | "todo" | "in_progress" | "review" | "done";

export default function TasksPage() {
  const { data: tasks = [], mutate } = useSWR<TaskData[]>("tasks", api.getTasks);
  const { data: projects = [] } = useSWR<ProjectData[]>("projects", api.getProjects);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleProject = (id: string) => {
    setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Group tasks by project
  const projectTasks = projects.map(p => {
    let pt = tasks.filter(t => t.projectId === p.id);
    if (search) pt = pt.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") pt = pt.filter(t => t.status === statusFilter);
    if (sortMode === "name") pt = [...pt].sort((a,b)=>a.title.localeCompare(b.title));
    else if (sortMode === "priority") { const o:Record<string,number>={urgent:0,high:1,medium:2,low:3}; pt = [...pt].sort((a,b)=>(o[a.priority]??2)-(o[b.priority]??2)); }
    return { project: p, tasks: pt };
  }).filter(p => p.tasks.length > 0 || !search); // Show all when not searching

  // Unassigned tasks (empty projectId)
  const unassigned = tasks.filter(t => !t.projectId || !projects.find(p => p.id === t.projectId));

  return (
    <div className="space-y-6 p-6">
      <div><h1 className="text-xl font-semibold">✅ 任务</h1><p className="mt-0.5 text-sm text-muted-foreground">共 {tasks.length} 个任务 · 按项目分组</p></div>

      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="搜索任务..." value={search} onChange={e=>setSearch(e.target.value)} className="h-9 pl-8 text-xs" />{search && <button onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}</div>
        <Select value={statusFilter} onValueChange={v=>setStatusFilter((v??"all") as StatusFilter)}><SelectTrigger className="h-9 w-24 text-[10px]"><SelectValue placeholder="状态" /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="todo">待开始</SelectItem><SelectItem value="in_progress">进行中</SelectItem><SelectItem value="review">审查中</SelectItem><SelectItem value="done">已完成</SelectItem></SelectContent></Select>
        <Select value={sortMode} onValueChange={v=>setSortMode(v as SortMode)}><SelectTrigger className="h-9 w-24 text-[10px]"><ArrowUpDown className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">默认</SelectItem><SelectItem value="name">按名称</SelectItem><SelectItem value="priority">按优先级</SelectItem></SelectContent></Select>
      </div>

      <div className="space-y-1">
        {projectTasks.map(({ project, tasks: pt }) => {
          const isCollapsed = collapsed.has(project.id);
          const counts = { todo: pt.filter(t=>t.status==="todo").length, in_progress: pt.filter(t=>t.status==="in_progress").length, done: pt.filter(t=>t.status==="done").length };
          return (
            <div key={project.id}>
              {/* Project header — clickable to collapse/expand */}
              <button onClick={() => toggleProject(project.id)} className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-left hover:bg-muted/50 transition-colors">
                {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                <span className="h-3 w-3 rounded-full shrink-0" style={{backgroundColor:project.color}} />
                <span className="text-sm font-medium">{project.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{pt.length} 任务</span>
                <span className="text-[10px] text-amber-400">{counts.in_progress > 0 ? `${counts.in_progress} 进行中` : ""}</span>
                <Link href={`/projects/${project.id}`} className="text-[10px] text-muted-foreground hover:text-foreground ml-1" onClick={e=>e.stopPropagation()}><FolderOpen className="h-3.5 w-3.5" /></Link>
              </button>

              {/* Tasks under this project */}
              {!isCollapsed && (
                <div className="ml-6 border-l-2 border-border/50 pl-3 space-y-0.5">
                  {pt.length === 0 ? (
                    <p className="py-2 text-[11px] text-muted-foreground/50 pl-7">暂无任务</p>
                  ) : (
                    pt.map(task => {
                      const prio = getPriority(task.priority);
                      const st = getTaskStatus(task.status);
                      return (
                        <div key={task.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors group">
                          <button onClick={(e) => { e.preventDefault(); const next = task.todayOrder !== null ? null : 0; api.updateTask(task.id, { todayOrder: next }).then(() => mutate()); }} title={task.todayOrder !== null ? "从今日焦点移除" : "添加到今日焦点"} className="shrink-0">
                            {task.todayOrder !== null ? <Pin className="h-3.5 w-3.5 text-amber-400" /> : <PinOff className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground" />}
                          </button>
                          <Link href={`/tasks/${task.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${prio.dot}`} />
                            <span className={`min-w-0 flex-1 truncate text-sm hover:underline ${task.status==="done"?"line-through text-muted-foreground/50":""}`}>{task.title}</span>
                            {st && <Badge variant="outline" className={`text-[10px] shrink-0 ${st.color} ${st.bg}`}>{st.label}</Badge>}
                            {task.dueDate && <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">{task.dueDate.split("T")[0]}</span>}
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned tasks */}
        {unassigned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 rounded-md px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-gray-400 shrink-0" />
              <span className="text-sm font-medium text-muted-foreground">未分类</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{unassigned.length} 任务</span>
            </div>
            <div className="ml-6 border-l-2 border-border/50 pl-3 space-y-0.5">
              {unassigned.map(task => {
                const prio = getPriority(task.priority);
                const st = getTaskStatus(task.status);
                return (
                  <div key={task.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30 transition-colors group">
                    <button onClick={(e) => { e.preventDefault(); const next = task.todayOrder !== null ? null : 0; api.updateTask(task.id, { todayOrder: next }).then(() => mutate()); }} title={task.todayOrder !== null ? "从今日焦点移除" : "添加到今日焦点"} className="shrink-0">
                      {task.todayOrder !== null ? <Pin className="h-3.5 w-3.5 text-amber-400" /> : <PinOff className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground" />}
                    </button>
                    <Link href={`/tasks/${task.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${prio.dot}`} />
                      <span className={`min-w-0 flex-1 truncate text-sm hover:underline ${task.status==="done"?"line-through text-muted-foreground/50":""}`}>{task.title}</span>
                      {st && <Badge variant="outline" className={`text-[10px] shrink-0 ${st.color} ${st.bg}`}>{st.label}</Badge>}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {projectTasks.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">{search ? "没有匹配的任务" : "暂无任务"}</div>}
      </div>
    </div>
  );
}
