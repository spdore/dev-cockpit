"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, CheckCircle2, Circle } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPriority } from "@/lib/constants";
import type { FocusTask } from "@/lib/types";
import Link from "next/link";

interface TodayFocusProps {
  tasks: FocusTask[];
  onToggle: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
}

function SortableTaskItem({ task, completed, onToggle }: { task: FocusTask; completed: boolean; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const priority = getPriority(task.priority);

  return (
    <div ref={setNodeRef} style={style} className={cn("group relative", isDragging && "z-50")}>
      <div className={cn("flex items-start gap-2 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/50", isDragging && "bg-muted/50 shadow-lg")}>
        <button onClick={() => onToggle(task.id)} className="mt-0.5 shrink-0">
          <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all", completed ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30 hover:border-emerald-400")}>
            {completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}><CheckCircle2 className="h-4 w-4 text-white" /></motion.div>}
          </div>
        </button>
        <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1">
          <p className={cn("text-sm leading-snug hover:underline", completed && "line-through text-muted-foreground/50")}>{task.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={cn("text-[11px]", priority.color)}>{priority.label}</span>
            {task.dueDate && <span className="text-[11px] text-muted-foreground">· 📅 {task.dueDate.split("T")[0]}</span>}
            <Badge variant="outline" className="h-4 px-1 text-[10px]" style={{ borderColor: task.project.color + "40", color: task.project.color }}>{task.project.name}</Badge>
          </div>
        </Link>
        {/* Drag handle — right side */}
        <button {...attributes} {...listeners} className="mt-0.5 shrink-0 cursor-grab touch-none opacity-0 group-hover:opacity-100 transition-opacity" tabIndex={-1}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

export function TodayFocus({ tasks, onToggle, onReorder }: TodayFocusProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const pendingTasks = tasks.filter((t) => !completedIds.has(t.id));
  const visibleTasks = showAll ? pendingTasks : pendingTasks.slice(0, 5);
  const pendingIds = visibleTasks.map((t) => t.id);

  const handleToggle = (id: string) => {
    setCompletedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    setTimeout(() => onToggle(id), 600);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = pendingTasks.findIndex((t) => t.id === active.id);
    const newIdx = pendingTasks.findIndex((t) => t.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1 && onReorder) onReorder(oldIdx, newIdx);
  };

  const renderTask = (task: FocusTask, completed: boolean) => {
    const priority = getPriority(task.priority);
    return (
      <motion.div key={task.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, height: 0 }} transition={{ duration: 0.25 }} className="group relative">
        <div className="flex items-start gap-2 rounded-lg border border-transparent p-2">
          <button onClick={() => handleToggle(task.id)} className="mt-0.5 shrink-0"><div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground/30" /></button>
          <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1">
            <p className="text-sm leading-snug hover:underline">{task.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px]" style={{ color: priority.color.replace("text-", "") }}>{priority.label}</span>
              <Badge variant="outline" className="h-4 px-1 text-[10px]" style={{ borderColor: task.project.color + "40", color: task.project.color }}>{task.project.name}</Badge>
            </div>
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">📍 今日焦点</CardTitle></CardHeader>
      <CardContent className="flex-1 space-y-1 overflow-y-auto">
        {pendingTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Circle className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">暂无进行中的任务 👀</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">开始一个任务后会自动出现在这里</p>
          </div>
        )}
        {mounted ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pendingIds} strategy={verticalListSortingStrategy}>
              <AnimatePresence>
                {visibleTasks.map((task) => <SortableTaskItem key={task.id} task={task} completed={completedIds.has(task.id)} onToggle={handleToggle} />)}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        ) : (
          <AnimatePresence>
            {visibleTasks.map((task) => renderTask(task, completedIds.has(task.id)))}
          </AnimatePresence>
        )}
        {pendingTasks.length > 5 && (
          <button onClick={() => setShowAll(!showAll)} className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground py-1">
            {showAll ? `收起 ▲` : `展开更多 (${pendingTasks.length - 5}) ▼`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
