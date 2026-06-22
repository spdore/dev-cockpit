"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui-store";
import { api, type TaskData } from "@/lib/api-client";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Plus,
  Lightbulb,
  Flame,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useHotkeys } from "@/hooks/use-hotkeys";

const NANO_ID = () => Math.random().toString(36).slice(2, 10);

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setTheme = useUIStore((s) => s.setTheme);

  const { data: tasks = [], mutate } = useSWR<TaskData[]>("tasks", api.getTasks);

  useHotkeys();

  const runCommand = useCallback(
    (command: () => void) => { setOpen(false); setTimeout(command, 100); },
    [setOpen]
  );

  const handleCreateTask = async () => {
    setOpen(false);
    setTimeout(async () => {
      await api.createTask({ id: NANO_ID(), title: "新任务", projectId: "", priority: "medium", estimatedMinutes: 60, status: "todo", tags: [] });
      mutate();
    }, 100);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="输入命令或搜索任务..." />
        <CommandList>
          <CommandEmpty>没有找到结果</CommandEmpty>
          <CommandGroup heading="导航">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}><LayoutDashboard className="mr-2 h-4 w-4" />前往 Dashboard</CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/projects"))}><FolderKanban className="mr-2 h-4 w-4" />查看所有项目</CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tasks"))}><CheckSquare className="mr-2 h-4 w-4" />查看所有任务</CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}><Calendar className="mr-2 h-4 w-4" />日历视图</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="快速操作">
            <CommandItem onSelect={handleCreateTask}><Plus className="mr-2 h-4 w-4" />创建任务<kbd className="ml-auto text-[10px] text-muted-foreground">⌘N</kbd></CommandItem>
            <CommandItem onSelect={() => window.dispatchEvent(new CustomEvent("devcockpit:quick-capture"))}><Lightbulb className="mr-2 h-4 w-4" />快速捕获想法<kbd className="ml-auto text-[10px] text-muted-foreground">⌘⇧N</kbd></CommandItem>
            <CommandItem onSelect={() => {}}><Flame className="mr-2 h-4 w-4" />开始专注计时<kbd className="ml-auto text-[10px] text-muted-foreground">⌘⇧F</kbd></CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="主题">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}><Sun className="mr-2 h-4 w-4" />浅色模式</CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}><Moon className="mr-2 h-4 w-4" />深色模式</CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}><Monitor className="mr-2 h-4 w-4" />跟随系统</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="任务">
            {tasks.slice(0, 8).map((task) => (
              <CommandItem key={task.id} onSelect={() => runCommand(() => router.push(`/tasks/${task.id}`))}>
                <CheckSquare className="mr-2 h-4 w-4" />
                <span className="truncate">{task.title}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{task.project.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
