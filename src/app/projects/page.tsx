"use client";

import { useState } from "react";
import useSWR from "swr";
import { api, type ProjectData } from "@/lib/api-client";
import { PROJECT_STATUS_CONFIG, PROJECT_COLORS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, ArrowUpDown, X, ExternalLink, CalendarDays } from "lucide-react";
import Link from "next/link";

type SortMode = "name" | "recent" | "completion";

const EMPTY = { name:"", description:"", color:"#8B5CF6", status:"active", repoUrl:"", startDate:"", targetDate:"" };

export default function ProjectsPage() {
  const { data: projects = [], mutate } = useSWR<ProjectData[]>("projects", api.getProjects);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY);

  let filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (sortMode === "name") filtered = [...filtered].sort((a,b) => a.name.localeCompare(b.name));
  else if (sortMode === "completion") filtered = [...filtered].sort((a,b) => b.completionRate - a.completionRate);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    if (form.startDate && form.targetDate && form.targetDate < form.startDate) { alert("截止日期不能早于开始日期"); return; }
    await api.createProject({ name: form.name, description: form.description, color: form.color, status: form.status, repoUrl: form.repoUrl, startDate: form.startDate || null, targetDate: form.targetDate || null });
    setForm(EMPTY); setShowCreate(false); mutate();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-xl font-semibold">📁 项目</h1><p className="mt-0.5 text-sm text-muted-foreground">管理所有项目 · {projects.length} 个</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4" />新建项目</Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="搜索项目..." value={search} onChange={e=>setSearch(e.target.value)} className="h-9 pl-8 text-xs" />{search && <button onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}</div>
        <Select value={sortMode} onValueChange={v=>setSortMode(v as SortMode)}><SelectTrigger className="h-9 w-28 text-[10px]"><ArrowUpDown className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">默认</SelectItem><SelectItem value="name">按名称</SelectItem><SelectItem value="completion">按完成率</SelectItem></SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(project => {
          const status = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];
          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group transition-colors hover:bg-muted/30 cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{backgroundColor:project.color}} />
                    <CardTitle className="truncate text-sm font-medium group-hover:underline">{project.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{project.description}</p>}
                  <div className="flex flex-wrap items-center gap-2">
                    {status && <Badge variant="outline" className={status.color}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}</Badge>}
                    {project.repoUrl && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><ExternalLink className="h-3 w-3" />Repo</span>}
                    {project.targetDate && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><CalendarDays className="h-3 w-3" />{project.targetDate.split("T")[0]}</span>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{project.taskCount} 个任务</span><span>{project.completionRate}%</span></div>
                  <Progress value={project.completionRate} className="h-1.5" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full py-12 text-center text-sm text-muted-foreground">{search ? "没有匹配的项目" : "暂无项目"}</div>}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建项目</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">项目名称 *</label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 h-10 text-sm" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">描述</label><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 text-sm min-h-[80px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">状态</label><Select value={form.status} onValueChange={v=>setForm({...form,status:v??"active"})}><SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PROJECT_STATUS_CONFIG).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-xs font-medium text-muted-foreground">颜色</label><div className="mt-1 flex gap-1.5 flex-wrap">{PROJECT_COLORS.map(c=><button key={c} onClick={()=>setForm({...form,color:c})} className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${form.color===c?"ring-2 ring-foreground ring-offset-1":""}`} style={{backgroundColor:c}} />)}</div></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">仓库地址</label><Input placeholder="https://github.com/user/repo" value={form.repoUrl} onChange={e=>setForm({...form,repoUrl:e.target.value})} className="mt-1 h-10 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">开始日期</label><Input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="mt-1 h-10 text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">截止日期</label><Input type="date" value={form.targetDate} onChange={e=>setForm({...form,targetDate:e.target.value})} className="mt-1 h-10 text-sm" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" size="sm" onClick={()=>setShowCreate(false)}>取消</Button><Button size="sm" onClick={handleCreate}>创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
