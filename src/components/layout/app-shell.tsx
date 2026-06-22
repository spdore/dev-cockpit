"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-200",
          sidebarCollapsed ? "ml-[60px]" : "ml-[220px]"
        )}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
