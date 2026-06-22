"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { api, type TaskData } from "@/lib/api-client";
import { getTaskStatus } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import Link from "next/link";

const WEEKDAYS = ["一","二","三","四","五","六","日"];
const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
type View = "year" | "month" | "week";

export default function CalendarPage() {
  const { data: tasks = [] } = useSWR<TaskData[]>("tasks", api.getTasks);
  const { data: dash } = useSWR("dashboard", api.getDashboard);
  const summaries = dash?.statusStats?.weekSummaries ?? [];
  const statusMap = useMemo(() => { const m=new Map<string,string>(); for(const s of summaries) m.set(s.date,s.mood); return m; }, [summaries]);
  const now = new Date();
  const [view, setView] = useState<View>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()+1);
  const [weekOffset, setWeekOffset] = useState(0);

  // Reset to current date when switching views
  const switchView = (v: View) => {
    setView(v);
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth()+1);
    setWeekOffset(0);
  };

  const navigate = (dir: -1|1) => {
    if (view==="year") setYear(y=>y+dir);
    else if (view==="month"){if(month+dir<1){setMonth(12);setYear(y=>y-1)}else if(month+dir>12){setMonth(1);setYear(y=>y+1)}else setMonth(m=>m+dir);}
    else setWeekOffset(w=>w+dir);
  };

  const getTasks = (ds: string) => tasks.filter(t =>
    (t.createdAt?.startsWith(ds)) ||
    (t.completedAt?.startsWith(ds)) ||
    (t.dueDate?.startsWith(ds)) ||
    (t.startDate?.startsWith(ds))
  );

  return (
    <div className="space-y-6 p-6">
      <div><h1 className="text-xl font-semibold">📅 日历</h1><p className="mt-0.5 text-sm text-muted-foreground">按时间查看任务和项目进度</p></div>

      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["year","month","week"] as View[]).map(v=>(
            <button key={v} onClick={()=>switchView(v)} className={cn("px-3 py-1.5 text-xs font-medium transition-colors",view===v?"bg-primary text-primary-foreground":"hover:bg-muted")}>
              {v==="year"?"年":v==="month"?"月":"周"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={()=>navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold min-w-[120px] text-center">
            {view==="year"?`${year} 年`:view==="month"?`${year} 年 ${month} 月`:(()=>{const d=new Date();d.setDate(d.getDate()+weekOffset*7);const ws=new Date(d);ws.setDate(d.getDate()-d.getDay()+1);const we=new Date(ws);we.setDate(ws.getDate()+6);return `${ws.getMonth()+1}/${ws.getDate()} - ${we.getMonth()+1}/${we.getDate()}`;})()}
          </span>
          <Button variant="ghost" size="sm" onClick={()=>navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {view==="year"&&<YearView year={year} tasks={tasks} onSelectMonth={(m)=>{switchView("month");setMonth(m);}}/>}
      {view==="month"&&<MonthView year={year} month={month} tasks={tasks} statusMap={statusMap} />}
      {view==="week"&&<WeekView year={year} weekOffset={weekOffset} tasks={tasks} />}
    </div>
  );
}

// ── Year View ──
function YearView({ year, tasks, onSelectMonth }: { year: number; tasks: TaskData[]; onSelectMonth: (m:number)=>void }) {
  const now = new Date();
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({length:12},(_,m)=>m+1).map(m=>{
        const count = tasks.filter(t=>t.completedAt&&t.completedAt.startsWith(`${year}-${String(m).padStart(2,"0")}`)).length;
        const active = tasks.filter(t=>(t.createdAt&&t.createdAt.startsWith(`${year}-${String(m).padStart(2,"0")}`))||(t.dueDate&&t.dueDate.startsWith(`${year}-${String(m).padStart(2,"0")}`))).length;
        const isNow = m===now.getMonth()+1&&year===now.getFullYear();
        return (
          <Card key={m} className={cn("p-3 cursor-pointer hover:bg-muted/50 transition-colors text-center",isNow&&"ring-2 ring-primary/30")} onClick={()=>onSelectMonth(m)}>
            <p className="text-xs font-medium">{MONTHS[m-1]}</p>
            <div className="flex justify-center gap-2 mt-1">
              <span className="text-[10px] text-emerald-400">{count} 完成</span>
              <span className="text-[10px] text-muted-foreground">{active} 活跃</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Month View (6 weeks) ──
function MonthView({ year, month, tasks, statusMap }: { year: number; month: number; tasks: TaskData[]; statusMap: Map<string,string> }) {
  const today = new Date();
  const isToday = (d:number,m:number,y:number)=>today.getFullYear()===y&&today.getMonth()+1===m&&today.getDate()===d;

  const weeks = useMemo(() => {
    const fd=new Date(year,month-1,1); const sd=fd.getDay()||7;
    const cells:{day:number;month:number;year:number}[]=[];
    const prevLD=new Date(year,month-1,0).getDate();
    for(let i=sd-1;i>=1;i--) cells.push({day:prevLD-i+1,month:month-1||12,year:month===1?year-1:year});
    const dim=new Date(year,month,0).getDate();
    for(let d=1;d<=dim;d++) cells.push({day:d,month,year});
    const rem=42-cells.length;
    for(let d=1;d<=rem;d++) cells.push({day:d,month:month===12?1:month+1,year:month===12?year+1:year});
    const wks:{day:number;month:number;year:number}[][]=[];
    for(let i=0;i<cells.length;i+=7) wks.push(cells.slice(i,i+7));
    return wks;
  }, [year,month]);

  const getDayTasks = (day:number,m:number,y:number)=>{
    const ds=`${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return tasks.filter(t=>(t.createdAt&&t.createdAt.startsWith(ds))||(t.completedAt&&t.completedAt.startsWith(ds))||(t.dueDate&&t.dueDate.startsWith(ds))).slice(0,3);
  };

  return (
    <Card><CardContent className="p-2">
      <div className="grid grid-cols-7">{WEEKDAYS.map(d=><div key={d} className="py-1.5 text-center text-xs font-medium text-muted-foreground">{d}</div>)}</div>
      {weeks.map((week,wi)=>(
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell,di)=>{
            const {day, month:m, year:y}=cell; const isCM=m===month; const dayTasks=getDayTasks(day,m,y); const tdy=isToday(day,m,y);
            return (
              <div key={`${y}-${m}-${day}`} className={cn("min-h-[85px] border border-border/30 p-0.5 flex flex-col",!isCM&&"bg-muted/20",tdy&&"ring-2 ring-primary ring-inset")}>
                <div className="flex items-center justify-between">
                  <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]",tdy?"bg-primary font-bold text-primary-foreground":isCM?"text-foreground":"text-muted-foreground/40")}>{day}</span>
                  {statusMap.get(`${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`) && <span className="text-[11px]">{statusMap.get(`${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`)}</span>}
                </div>
                <div className="space-y-0.5 mt-0.5 flex-1">
                  {dayTasks.map(t=>{const st=getTaskStatus(t.status);return(
                    <Link key={t.id} href={`/tasks/${t.id}`} className="block truncate rounded px-1 py-0.5 text-[9px] hover:opacity-80" style={{backgroundColor:t.project.color+"15",borderLeft:`2px solid ${t.project.color}`}}><span>{t.title.slice(0,10)}</span><span className={`ml-1 ${st.color}`}>·{st.label}</span></Link>
                  );})}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </CardContent></Card>
  );
}

// ── Week View ──
function WeekView({ year, weekOffset, tasks }: { year: number; weekOffset: number; tasks: TaskData[] }) {
  const today = new Date();
  const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay()+1+weekOffset*7); weekStart.setHours(0,0,0,0);
  const allDays = Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d;});
  const isToday = (d:Date)=>d.toDateString()===today.toDateString();

  // Only show days with activity
  const activeDays = allDays.filter(d=>{
    const ds=d.toISOString().split("T")[0]!;
    return tasks.some(t=>(t.createdAt&&t.createdAt.startsWith(ds))||(t.completedAt&&t.completedAt.startsWith(ds))||(t.dueDate&&t.dueDate.startsWith(ds)));
  });

  if (activeDays.length===0) return <p className="py-12 text-center text-sm text-muted-foreground">本周暂无活动</p>;

  return (
    <div className="space-y-2">
      {activeDays.map(d=>{
        const ds=d.toISOString().split("T")[0]!;
        const dayTasks = tasks.filter(t=>(t.createdAt&&t.createdAt.startsWith(ds))||(t.completedAt&&t.completedAt.startsWith(ds))||(t.dueDate&&t.dueDate.startsWith(ds)));

        // Group by project
        const projMap = new Map<string,{id:string;name:string;color:string;tasks:TaskData[]}>();
        for(const t of dayTasks){
          const k=t.projectId||"__none__";
          if(!projMap.has(k)) projMap.set(k,{id:t.project.id,name:t.project.name,color:t.project.color,tasks:[]});
          projMap.get(k)!.tasks.push(t);
        }

        return (
          <Card key={ds} className={cn(isToday(d)&&"ring-2 ring-primary/30")}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3 mb-2">
                <span className={cn("text-sm font-medium",isToday(d)&&"text-primary")}>
                  {d.toLocaleDateString("zh-CN",{weekday:"long"})}
                </span>
                <span className="text-xs text-muted-foreground">{d.getMonth()+1}/{d.getDate()}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{dayTasks.length} 个任务</span>
              </div>

              <div className="space-y-1.5">
                {Array.from(projMap.values()).map(proj=>(
                  <ProjectTaskGroup key={proj.id} project={proj} />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Collapsible project task group for week view
function ProjectTaskGroup({ project }: { project: { id: string; name: string; color: string; tasks: TaskData[] } }) {
  const [open, setOpen] = useState(true);

  if (project.tasks.length===1) {
    const t=project.tasks[0]!;
    const st=getTaskStatus(t.status);
    return (
      <Link href={`/tasks/${t.id}`} className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-muted/30 text-xs">
        <span className="h-2 w-2 rounded-full shrink-0" style={{backgroundColor:project.color}} />
        <span className="text-[10px] text-muted-foreground w-16 shrink-0">{project.name}</span>
        <span className="flex-1 truncate">{t.title}</span>
        <span className={cn("text-[10px]",st.color)}>{st.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button onClick={()=>setOpen(!open)} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/30 text-xs w-full text-left">
        {open?<ChevronDown className="h-3 w-3 text-muted-foreground" />:<ChevronRightIcon className="h-3 w-3 text-muted-foreground" />}
        <span className="h-2 w-2 rounded-full shrink-0" style={{backgroundColor:project.color}} />
        <span className="font-medium">{project.name}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{project.tasks.length} 任务</span>
      </button>
      {open && (
        <div className="ml-6 border-l-2 border-border/40 pl-3 mt-0.5 space-y-0.5">
          {project.tasks.map(t=>{
            const st=getTaskStatus(t.status);
            return (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/30 text-xs">
                <span className="flex-1 truncate">{t.title}</span>
                <span className={cn("text-[10px]",st.color)}>{st.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
