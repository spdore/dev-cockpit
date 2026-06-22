"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/lib/constants";
import { api, type ProjectData } from "@/lib/api-client";

interface QuickCaptureProps {
  onCapture: (data: TaskFormData) => void;
}

export interface TaskFormData {
  title: string; content: string; projectId: string;
  priority: string; status: string;
  startDate: string; dueDate: string; tags: string;
}

export function QuickCapture({ onCapture }: QuickCaptureProps) {
  const { data: projects = [] } = useSWR<ProjectData[]>("projects", api.getProjects);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<TaskFormData>({
    title: "", content: "", projectId: "", priority: "medium", status: "todo",
    startDate: "", dueDate: "", tags: "",
  });
  const [captured, setCaptured] = useState(false);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) { alert("截止日期不能早于开始日期"); return; }
    onCapture(form);
    setForm({ title: "", content: "", projectId: "", priority: "medium", status: "todo", startDate: "", dueDate: "", tags: "" });
    setShow(false);
    setCaptured(true);
    setTimeout(() => setCaptured(false), 1500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">💡 快速捕获</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShow(!show)}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {captured && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <Lightbulb className="h-3 w-3" />已捕获到收件箱
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {show && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">任务标题 *</label>
                <Input placeholder="任务标题..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 h-10 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">详细描述</label>
                <Textarea placeholder="任务的具体内容和要求..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1 text-sm min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">所属项目</label>
                  <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v ?? "" })}>
                    <SelectTrigger className="mt-1 h-10 text-sm"><SelectValue placeholder="选择项目" /></SelectTrigger>
                    <SelectContent>{projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">优先级</label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v ?? "medium" })}>
                    <SelectTrigger className="mt-1 h-10 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k,v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-medium text-muted-foreground">开始日期</label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 h-10 text-sm" /></div>
                <div><label className="text-[10px] font-medium text-muted-foreground">截止日期</label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1 h-10 text-sm" /></div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">标签 (逗号分隔)</label>
                <Input placeholder="如: bug, frontend, urgent" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="mt-1 h-10 text-sm" />
              </div>
              <Button size="sm" className="w-full" onClick={handleSubmit}>创建任务</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!show && !captured && (
          <p className="text-[11px] text-muted-foreground/50">点击 + 新建任务，填写标题、所属项目、优先级等详细信息。</p>
        )}
      </CardContent>
    </Card>
  );
}
