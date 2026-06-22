"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api, type ProjectData, type TaskData } from "@/lib/api-client";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, PROJECT_STATUS_CONFIG, PROJECT_COLORS } from "@/lib/constants";
import { getPriority, getTaskStatus } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, ExternalLink, CalendarDays, GitBranch, Plus, Search, Edit3, Trash2, ArrowUpDown, Hash, X } from "lucide-react";
import Link from "next/link";

interface PageProps { params: Promise<{ id: string }>; }

type SortMode = "recent" | "name" | "priority";
type StatusFilter = "all" | "todo" | "in_progress" | "review" | "done";

const EMPTY_TASK = { title:"",content:"",priority:"medium",status:"todo",startDate:"",dueDate:"",tags:"" };

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: projects = [], mutate: mutateProjects } = useSWR<ProjectData[]>("projects", api.getProjects);
  const project = projects.find(p => p.id === id);
  const { data: detail, mutate: mutateDetail } = useSWR(project ? `proj-${id}` : null, () => api.getProjectTasks(id));

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [showProjEdit, setShowProjEdit] = useState(false);
  const [projForm, setProjForm] = useState({ name:"",description:"",color:"",status:"",repoUrl:"",startDate:"",targetDate:"" });

  const tasks = detail?.tasks ?? [];

  let filtered = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  if (statusFilter !== "all") filtered = filtered.filter(t => t.status === statusFilter);
  if (sortMode === "name") filtered = [...filtered].sort((a,b) => a.title.localeCompare(b.title));
  else if (sortMode === "priority") { const o:Record<string,number>={urgent:0,high:1,medium:2,low:3}; filtered = [...filtered].sort((a,b) => (o[a.priority]??2)-(o[b.priority]??2)); }

  if (!project) return <div className="p-6 text-sm text-muted-foreground">项目未找到</div>;

  const st = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];
  const todoCount = tasks.filter(t=>t.status==="todo").length;
  const inProgressCount = tasks.filter(t=>t.status==="in_progress").length;
  const doneCount = tasks.filter(t=>t.status==="done").length;
  const completionRate = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const openCreate = () => { setEditingTask(null); setTaskForm(EMPTY_TASK); setShowTaskDialog(true); };
  const openEdit = (t: TaskData) => { setEditingTask(t); setTaskForm({ title:t.title, content:t.content, priority:t.priority, status:t.status, startDate:t.startDate?.split("T")[0]||"", dueDate:t.dueDate?.split("T")[0]||"", tags:(t.tags||[]).join(", ") }); setShowTaskDialog(true); };

  const handleTaskSubmit = async () => {
    if (!taskForm.title.trim()) return;
    if (taskForm.startDate && taskForm.dueDate && taskForm.dueDate < taskForm.startDate) { alert("截止日期不能早于开始日期"); return; }
    const body = {
      title: taskForm.title, content: taskForm.content, projectId: id,
      priority: taskForm.priority, status: taskForm.status,
      startDate: taskForm.startDate || null, dueDate: taskForm.dueDate || null,
      tags: taskForm.tags ? taskForm.tags.split(",").map((s:string)=>s.trim()).filter(Boolean) : [],
    };
    if (editingTask) { await api.updateTask(editingTask.id, body); }
    else { await api.createTask(body); }
    setShowTaskDialog(false); mutateDetail(); mutateProjects();
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (confirm(`确定删除 "${title}"？`)) { await api.deleteTask(taskId); mutateDetail(); mutateProjects(); }
  };

  const handleToggleTask = async (taskId: string) => { await api.toggleTask(taskId); mutateDetail(); mutateProjects(); };

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/projects"><ArrowLeft className="mt-1 h-5 w-5 text-muted-foreground hover:text-foreground" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full" style={{backgroundColor:project.color}} />
              <h1 className="text-xl font-semibold">{project.name}</h1>
              <Badge variant="outline" className={st?.color}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${st?.dot}`} />{st?.label}</Badge>
            </div>
            {project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setProjForm({ name: project.name, description: project.description, color: project.color, status: project.status, repoUrl: project.repoUrl, startDate: project.startDate?.split("T")[0] || "", targetDate: project.targetDate?.split("T")[0] || "" }); setShowProjEdit(true); }}><Edit3 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={async () => { if (confirm("确定删除？")) { await api.deleteProject(id); router.push("/projects"); } }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{tasks.length}</p><p className="text-[10px] text-muted-foreground">总任务</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-400">{inProgressCount}</p><p className="text-[10px] text-muted-foreground">进行中</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{doneCount}</p><p className="text-[10px] text-muted-foreground">已完成</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{completionRate}%</p><Progress value={completionRate} className="mt-1 h-1" /></CardContent></Card>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {project.repoUrl && <a href={project.repoUrl} target="_blank" className="flex items-center gap-1 hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" />{project.repoUrl.replace("https://github.com/","")}</a>}
        {project.startDate && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />开始: {project.startDate.split("T")[0]}</span>}
        {project.targetDate && <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" />截止: {project.targetDate.split("T")[0]}</span>}
      </div>

      {/* Task Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="搜索任务..." value={search} onChange={e=>setSearch(e.target.value)} className="h-9 pl-8 text-xs w-full" />{search && <button onClick={()=>setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}</div>
          <Select value={statusFilter} onValueChange={v=>setStatusFilter((v??"all") as StatusFilter)}><SelectTrigger className="h-9 w-24 text-[10px]"><SelectValue placeholder="状态" /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem>{Object.entries(TASK_STATUS_CONFIG).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
          <Select value={sortMode} onValueChange={v=>setSortMode(v as SortMode)}><SelectTrigger className="h-9 w-24 text-[10px]"><ArrowUpDown className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">默认</SelectItem><SelectItem value="name">按名称</SelectItem><SelectItem value="priority">按优先级</SelectItem></SelectContent></Select>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" />新建任务</Button>
      </div>

      {/* Task List */}
      <div className="space-y-1">
        {filtered.map(task => {
          const prio = getPriority(task.priority);
          const status = getTaskStatus(task.status);
          return (
            <Card key={task.id} className="group transition-colors hover:bg-muted/30">
              <CardContent className="flex items-center gap-3 p-3">
                <button onClick={()=>handleToggleTask(task.id)} className="shrink-0"><div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${task.status==="done"?"border-emerald-500 bg-emerald-500":"border-muted-foreground/30 hover:border-emerald-400"}`}>{task.status==="done"&&<svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}</div></button>
                <span className={`h-2 w-2 shrink-0 rounded-full ${prio.dot}`} />
                <div className="min-w-0 flex-1">
                  <Link href={`/tasks/${task.id}`} className={`text-sm hover:underline ${task.status==="done"?"line-through text-muted-foreground/50":""}`}>{task.title}</Link>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] ${status.color}`}>{status.label}</span>
                    {task.dueDate && <span className="text-[10px] text-muted-foreground">📅 {task.dueDate.split("T")[0]}</span>}
                    {(task.tags||[]).slice(0,2).map(tag=><span key={tag} className="text-[10px] text-blue-400/70"><Hash className="mr-0.5 inline h-2.5 w-2.5" />{tag}</span>)}
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>openEdit(task)}><Edit3 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={()=>handleDeleteTask(task.id,task.title)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">{search||statusFilter!=="all"?"没有匹配的任务":"暂无任务，点击「新建任务」开始"}</div>}
      </div>

      {/* Task Create/Edit Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask?"编辑任务":"新建任务"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">标题 *</label><Input value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})} className="mt-1 h-9 text-sm" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">描述</label><Textarea value={taskForm.content} onChange={e=>setTaskForm({...taskForm,content:e.target.value})} className="mt-1 text-xs min-h-[60px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">优先级</label><Select value={taskForm.priority} onValueChange={v=>setTaskForm({...taskForm,priority:v??"medium"})}><SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-xs font-medium text-muted-foreground">状态</label><Select value={taskForm.status} onValueChange={v=>setTaskForm({...taskForm,status:v??"todo"})}><SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TASK_STATUS_CONFIG).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">开始日期</label><Input type="date" value={taskForm.startDate} onChange={e=>setTaskForm({...taskForm,startDate:e.target.value})} className="mt-1 h-10 text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">截止日期</label><Input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm({...taskForm,dueDate:e.target.value})} className="mt-1 h-10 text-sm" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">标签 (逗号分隔)</label><Input placeholder="如: bug, frontend" value={taskForm.tags} onChange={e=>setTaskForm({...taskForm,tags:e.target.value})} className="mt-1 h-10 text-sm" /></div>
          </div>
          <DialogFooter><Button variant="outline" size="sm" onClick={()=>setShowTaskDialog(false)}>取消</Button><Button size="sm" onClick={handleTaskSubmit}>{editingTask?"保存":"创建"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Edit Dialog */}
      <Dialog open={showProjEdit} onOpenChange={setShowProjEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑项目信息</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">名称</label><Input value={projForm.name} onChange={e=>setProjForm({...projForm,name:e.target.value})} className="mt-1 h-9 text-sm" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">描述</label><Textarea value={projForm.description} onChange={e=>setProjForm({...projForm,description:e.target.value})} className="mt-1 text-xs min-h-[60px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">状态</label><Select value={projForm.status} onValueChange={v=>setProjForm({...projForm,status:v??"active"})}><SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PROJECT_STATUS_CONFIG).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-xs font-medium text-muted-foreground">颜色</label><div className="mt-1 flex gap-1.5 flex-wrap">{PROJECT_COLORS.map(c=><button key={c} onClick={()=>setProjForm({...projForm,color:c})} className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${projForm.color===c?"ring-2 ring-foreground ring-offset-1":""}`} style={{backgroundColor:c}} />)}</div></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">仓库地址</label><Input value={projForm.repoUrl} onChange={e=>setProjForm({...projForm,repoUrl:e.target.value})} className="mt-1 h-10 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">开始日期</label><Input type="date" value={projForm.startDate} onChange={e=>setProjForm({...projForm,startDate:e.target.value})} className="mt-1 h-10 text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">截止日期</label><Input type="date" value={projForm.targetDate} onChange={e=>setProjForm({...projForm,targetDate:e.target.value})} className="mt-1 h-10 text-sm" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={()=>setShowProjEdit(false)}>取消</Button>
            <Button size="sm" onClick={async ()=>{ if(projForm.startDate&&projForm.targetDate&&projForm.targetDate<projForm.startDate){alert("截止日期不能早于开始日期");return;} await api.updateProject(id, { name:projForm.name, description:projForm.description, color:projForm.color, status:projForm.status, repoUrl:projForm.repoUrl, startDate:projForm.startDate||null, targetDate:projForm.targetDate||null }); setShowProjEdit(false); mutateProjects(); }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
