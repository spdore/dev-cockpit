"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Save, PencilLine, Trash2, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Summary { date: string; content: string; workHours: number; mood: string; }
const MOODS = ["😊","💪","🤔","😎","😤","🌴","🎨","🧐","😴","🤩"];

export default function JournalPage() {
  const { data: dash, mutate } = useSWR("dashboard", api.getDashboard);
  const summaries: Summary[] = dash?.statusStats?.weekSummaries ?? [];
  const today = new Date().toISOString().split("T")[0]!;

  const [editing, setEditing] = useState<Summary | null>(null);
  const [content, setContent] = useState("");
  const [hours, setHours] = useState("");
  const [mood, setMood] = useState("😊");
  const [showNew, setShowNew] = useState(false);
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const refMonth = new Date(); refMonth.setMonth(refMonth.getMonth()+monthOffset);
  const refStr = `${refMonth.getFullYear()}-${String(refMonth.getMonth()+1).padStart(2,"0")}`;

  const filtered = summaries.filter(s => {
    if (moodFilter && s.mood !== moodFilter) return false;
    if (monthOffset !== 0 && !s.date.startsWith(refStr)) return false;
    return true;
  });

  // Group by date for list view
  const grouped = useMemo(() => {
    const g = new Map<string, Summary[]>();
    for (const s of filtered) {
      const k = s.date;
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(s);
    }
    return Array.from(g.entries()).sort((a,b)=>b[0].localeCompare(a[0]));
  }, [filtered]);

  // Mood word cloud data
  const moodCounts = useMemo(() => {
    const m = new Map<string,number>();
    for (const s of summaries) m.set(s.mood,(m.get(s.mood)||0)+1);
    return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]);
  }, [summaries]);

  const maxCount = Math.max(...moodCounts.map(([,c])=>c), 1);

  const startEdit = (s: Summary) => { setEditing(s); setContent(s.content); setHours(String(s.workHours)); setMood(s.mood); setShowNew(false); };
  const startNew = () => { setEditing(null); setContent(""); setHours(""); setMood("😊"); setShowNew(true); };
  const cancel = () => { setEditing(null); setShowNew(false); };

  const handleSave = async () => {
    const date = editing?.date || today;
    await api.addDailySummary({ date, content, workHours: parseFloat(hours) || 0, mood });
    cancel(); mutate();
  };

  const handleDelete = async (date: string) => {
    if (!confirm("删除这条记录？")) return;
    // Delete by saving empty content
    await api.addDailySummary({ date, content: "", workHours: 0, mood: "" });
    mutate();
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">📋 状态</h1><p className="mt-0.5 text-sm text-muted-foreground">{summaries.length} 条记录</p></div>
        <Button size="sm" onClick={startNew}><Plus className="mr-1 h-4 w-4" />新建记录</Button>
      </div>

      {/* Mood word cloud */}
      {moodCounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium">心情分布</CardTitle></CardHeader>
          <CardContent>
            <div className="relative h-28 flex items-center justify-center">
              {moodCounts.map(([m,c],i)=>{
                // Center = most frequent → largest, periphery = less frequent → smaller
                const isTop=moodCounts[0]&&moodCounts[0][0]===m;
                const size=isTop?44:20+Math.round((c/maxCount)*20);
                const opacity=isTop?1:0.4+((c/maxCount)*0.5);
                // Radial positioning for non-center items
                const angle=(i*(360/(moodCounts.length-1||1)))*Math.PI/180;
                const radius=isTop?0:60;
                const x=Math.cos(angle)*radius;
                const y=Math.sin(angle)*radius;
                return (
                  <button key={m} onClick={()=>setMoodFilter(moodFilter===m?null:m)}
                    className={cn("absolute transition-all hover:scale-125",moodFilter===m?"scale-125 ring-2 ring-primary rounded-lg p-1":"")}
                    style={{
                      fontSize:size,
                      opacity,
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      zIndex: isTop?10:1,
                    }}
                    title={`${m} ${c} 次`}>{m}</button>
                );
              })}
            </div>
            {moodFilter && <p className="text-center text-[10px] text-muted-foreground mt-2">筛选: {moodFilter} <button onClick={()=>setMoodFilter(null)} className="ml-1 hover:text-foreground"><X className="h-3 w-3 inline" /></button></p>}
          </CardContent>
        </Card>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={()=>setMonthOffset(o=>o-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-sm font-medium">{refMonth.getFullYear()} 年 {refMonth.getMonth()+1} 月</span>
        <Button variant="ghost" size="sm" onClick={()=>setMonthOffset(o=>o+1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Edit / New form */}
      {(showNew || editing) && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <PencilLine className="h-4 w-4" />
              {editing ? `编辑 ${editing.date}` : "新建记录"}
            </div>
            <Textarea placeholder="今天完成了什么？有什么收获和思考？" value={content} onChange={e=>setContent(e.target.value)} className="min-h-[200px] text-base leading-relaxed resize-y" autoFocus />
            <div className="flex items-center gap-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <Input type="number" step="0.5" min="0" max="24" placeholder="工时" value={hours} onChange={e=>setHours(e.target.value)} className="h-10 w-24 text-sm" />
              <span className="text-[10px] text-muted-foreground">h</span>
              <div className="flex gap-0.5">{MOODS.map(m=><button key={m} onClick={()=>setMood(m)} className={`text-lg p-0.5 rounded transition-all ${mood===m?"bg-primary/20 ring-1 ring-primary scale-110":"grayscale hover:grayscale-0"}`}>{m}</button>)}</div>
              <div className="flex-1" />
              <Button size="sm" onClick={handleSave}><Save className="mr-1 h-3.5 w-3.5" />保存</Button>
              <Button variant="ghost" size="sm" onClick={cancel}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List grouped by date */}
      <div className="space-y-4">
        {grouped.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">暂无记录</p>
        ) : (
          grouped.map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 sticky top-0 bg-background py-1">
                {new Date(date+"T00:00:00").toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric",weekday:"long"})}
              </p>
              <div className="space-y-1">
                {items.map(s => (
                  <div key={s.date+s.mood} className="group flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors cursor-pointer" onClick={()=>startEdit(s)}>
                    <span className="text-xl shrink-0">{s.mood||"📝"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs line-clamp-2">{s.content||"（无内容）"}</p>
                      {s.workHours>0&&<span className="text-[10px] text-muted-foreground">{s.workHours}h</span>}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>startEdit(s)} className="p-1 hover:bg-muted rounded"><PencilLine className="h-3 w-3 text-muted-foreground" /></button>
                      <button onClick={()=>handleDelete(s.date)} className="p-1 hover:bg-muted rounded"><Trash2 className="h-3 w-3 text-red-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

