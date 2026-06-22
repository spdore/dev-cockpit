"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api, type TaskData, type ProjectData } from "@/lib/api-client";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/constants";
import { getPriority, getTaskStatus } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CalendarDays, Hash, Edit3, Trash2, Save, X } from "lucide-react";
import Link from "next/link";

interface PageProps { params: Promise<{ id: string }>; }

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: tasks = [], mutate } = useSWR<TaskData[]>("tasks", api.getTasks);
  const { data: projects = [] } = useSWR<ProjectData[]>("projects", api.getProjects);
  const task = tasks.find(t => t.id === id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title:"",content:"",projectId:"",priority:"medium",status:"todo",startDate:"",dueDate:"",tags:"" });

  if (!task) return <div className="p-6 text-sm text-muted-foreground">任务未找到</div>;

  const prio = getPriority(task.priority);
  const st = getTaskStatus(task.status);

  const startEdit = () => { setForm({ title:task.title, content:task.content, projectId:task.projectId, priority:task.priority, status:task.status, startDate:task.startDate?.split("T")[0]||"", dueDate:task.dueDate?.split("T")[0]||"", tags:(task.tags||[]).join(", ") }); setEditing(true); };

  const handleSave = async () => {
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) { alert("截止日期不能早于开始日期"); return; }
    await api.updateTask(id, { title:form.title, content:form.content, projectId:form.projectId, priority:form.priority, status:form.status, startDate:form.startDate||null, dueDate:form.dueDate||null, tags:form.tags?form.tags.split(",").map((s:string)=>s.trim()).filter(Boolean):[] });
    setEditing(false); mutate();
  };

  const handleDelete = async () => { if (confirm("确定删除？")) { await api.deleteTask(id); mutate(); router.push("/tasks"); } };

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/tasks"><ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" /></Link>
        <div className="flex gap-1">
          {editing ? <><Button variant="ghost" size="sm" onClick={()=>setEditing(false)}><X className="mr-1 h-4 w-4" />取消</Button><Button size="sm" onClick={handleSave}><Save className="mr-1 h-4 w-4" />保存</Button></> : <><Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEdit}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button></>}
        </div>
      </div>

      {editing ? (
        <Card><CardContent className="p-4 space-y-4">
          <div><label className="text-xs font-medium text-muted-foreground">标题</label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="mt-1 h-9 text-sm" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">描述</label><Textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} className="mt-1 text-xs min-h-[100px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">项目</label><Select value={form.projectId} onValueChange={v=>setForm({...form,projectId:v??""})}><SelectTrigger className="mt-1 h-10 text-sm"><SelectValue placeholder="选择项目" /></SelectTrigger><SelectContent>{projects.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-xs font-medium text-muted-foreground">优先级</label><Select value={form.priority} onValueChange={v=>setForm({...form,priority:v??"medium"})}><SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-xs font-medium text-muted-foreground">状态</label><Select value={form.status} onValueChange={v=>setForm({...form,status:v??"todo"})}><SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TASK_STATUS_CONFIG).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-xs font-medium text-muted-foreground">标签</label><Input placeholder="逗号分隔" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} className="mt-1 h-10 text-sm" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">开始日期</label><Input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="mt-1 h-10 text-sm" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">截止日期</label><Input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="mt-1 h-10 text-sm" /></div>
          </div>
        </CardContent></Card>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-3 mb-2"><span className={`h-3 w-3 rounded-full ${prio.dot}`} /><h1 className="text-xl font-semibold">{task.title}</h1><Badge variant="outline" className={st.color}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</Badge></div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link href={`/projects/${task.projectId}`}><Badge variant="outline" className="text-[10px]" style={{borderColor:task.project.color+"40",color:task.project.color}}>{task.project.name}</Badge></Link>
              <Badge variant="outline" className="text-[10px]">{prio.label}优先级</Badge>
              {task.startDate && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{task.startDate.split("T")[0]}</span>}
              {task.dueDate && <span className="flex items-center gap-1">→ {task.dueDate.split("T")[0]}</span>}
            </div>
          </div>
          {task.content && <Card><CardContent className="p-4"><p className="text-sm whitespace-pre-wrap">{task.content}</p></CardContent></Card>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card><CardContent className="p-3 text-center"><p className="text-xs font-medium">{prio.label}</p><p className="text-[10px] text-muted-foreground">优先级</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs font-medium">{st.label}</p><p className="text-[10px] text-muted-foreground">状态</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs font-medium">{task.createdAt?.split("T")[0]||"—"}</p><p className="text-[10px] text-muted-foreground">创建</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs font-medium">{task.completedAt?.split("T")[0]||"—"}</p><p className="text-[10px] text-muted-foreground">完成</p></CardContent></Card>
          </div>
          {(task.tags||[]).length>0 && <div className="flex flex-wrap items-center gap-1.5"><Hash className="h-3.5 w-3.5 text-muted-foreground" />{task.tags.map(tag=><Badge key={tag} variant="outline" className="text-[10px] text-blue-400">{tag}</Badge>)}</div>}
                  </>
      )}
    </div>
  );
}
