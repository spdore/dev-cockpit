/**
 * Topbar component — top navigation bar.
 *
 * Displays time-based greeting, system date, weather (via geolocation),
 * global search trigger, theme toggle, and user avatar.
 */

"use client";

import { Moon, Sun, Monitor, Search, CloudSun } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGreeting } from "@/hooks/use-greeting";
import { useWeather } from "@/hooks/use-weather";

export function Topbar() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  const { greeting, dateStr, mounted } = useGreeting();
  const weather = useWeather();

  const weatherText = weather.temp != null
    ? `${weather.emoji} ${weather.temp}°C${weather.city ? ` ${weather.city}` : ""}`
    : "";

  const themeIcon =
    theme === "dark" ? <Moon className="h-4 w-4" />
    : theme === "light" ? <Sun className="h-4 w-4" />
    : <Monitor className="h-4 w-4" />;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Left: Greeting + Date + Weather */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-sm font-medium text-foreground shrink-0" suppressHydrationWarning>
          {mounted ? `${greeting.text} ${greeting.emoji}` : ""}
        </h2>
        <span className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
          {mounted ? dateStr : ""}
        </span>
        {weather.temp != null && (
          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-0.5">
            <CloudSun className="h-3.5 w-3.5" />
            {weatherText}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Cmd+K Search Trigger */}
        <Tooltip>
          <TooltipTrigger
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span>搜索命令...</span>
            <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </TooltipTrigger>
          <TooltipContent>
            <p>快速搜索和导航</p>
          </TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
            {themeIcon}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />浅色
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />深色
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />跟随系统
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar */}
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/10 text-xs font-medium">XC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
