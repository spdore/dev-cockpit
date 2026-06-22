"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Plus } from "lucide-react";
import { useWeekChart } from "@/hooks/use-week-chart";
import type { DailySummary } from "@/core/entities";

interface StatusCardProps {
  stats: { workHoursToday: number; todaySummary: { content: string; mood: string } | null; weekSummaries: DailySummary[] };
  onAddSummary?: (data: { date: string; content: string; workHours: number; mood: string }) => void;
}

const MOODS = ["😊","💪","🤔","😎","😤","🌴","🎨","🧐","😴","🤩"];

export function CognitiveCard({ stats, onAddSummary }: StatusCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [content, setContent] = useState("");
  const [hours, setHours] = useState("");
  const [mood, setMood] = useState("😊");

  const handleSubmit = () => { if (!content.trim()) return; onAddSummary?.({ date: new Date().toISOString().split("T")[0]!, content, workHours: parseFloat(hours) || 0, mood }); setContent(""); setHours(""); setMood("😊"); setShowDialog(false); };

  const todayMood = stats.todaySummary?.mood || "📝";
  const { days: weekDays, totalWeekHours, maxHours: maxH } = useWeekChart(stats.weekSummaries);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">📋 状态</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center space-y-4">
        {/* Today mood + week total hours */}
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <span className="text-4xl">{todayMood}</span>
            <p className="text-[10px] text-muted-foreground mt-1">今日心情</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums">{totalWeekHours.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">h</span></p>
            <p className="text-[10px] text-muted-foreground mt-1">本周工时</p>
          </div>
        </div>

        {/* Current week bar chart */}
        <div className="space-y-1.5 border-t border-border pt-3 flex-1 flex flex-col justify-end">
          <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 shrink-0"><TrendingUp className="h-3 w-3" />本周每日工时</p>
          <div className="flex items-end gap-1 flex-1 min-h-[60px]">
            {weekDays.map(d => {
              const ratio = maxH > 0 ? d.workHours / maxH : 0;
              const h = Math.max(ratio * 100, d.workHours > 0 ? 8 : 2);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end" title={`${d.date}: ${d.workHours}h ${d.mood}`}>
                  <span className={`text-[9px] tabular-nums font-medium ${d.isToday ? "text-emerald-400" : ""}`}>
                    {d.workHours > 0 ? d.workHours.toFixed(1) + "h" : ""}
                  </span>
                  <div
                    className={`w-full rounded-t transition-all hover:opacity-80 ${
                      d.isToday
                        ? "bg-emerald-400"
                        : d.workHours > 0
                          ? "bg-primary/30"
                          : "bg-muted/30"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  <span className={`text-[8px] ${d.isToday ? "text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {!stats.todaySummary && <p className="text-[11px] text-muted-foreground/50 text-center">点击 + 记录今日状态</p>}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>记录今日状态</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea placeholder="写写今天的收获..." value={content} onChange={e=>setContent(e.target.value)} className="text-sm min-h-[100px]" />
            <div className="grid grid-cols-2 gap-3">
              <div><Input type="number" step="0.5" min="0" max="24" placeholder="工时" value={hours} onChange={e=>setHours(e.target.value)} className="h-9 text-xs" /></div>
              <div className="flex flex-wrap gap-1">{MOODS.map(m=><button key={m} onClick={()=>setMood(m)} className={`text-base p-0.5 rounded ${mood===m?"bg-primary/20 ring-1 ring-primary":""}`}>{m}</button>)}</div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" size="sm" onClick={()=>setShowDialog(false)}>取消</Button><Button size="sm" onClick={handleSubmit}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
