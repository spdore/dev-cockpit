"use client";

import { create } from "zustand";

type Theme = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  fontSize: FontSize;
  geminiApiKey: string;
  geminiModel: string;
  settingsLoaded: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setFontSize: (size: FontSize) => void;
  setGeminiApiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  loadSettings: (settings: Record<string, string>) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  theme: "system",
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  fontSize: "medium",
  geminiApiKey: "",
  geminiModel: "gemini-3.1-flash-lite",
  settingsLoaded: false,

  setTheme: (theme) => { set({ theme }); saveSetting("theme", theme); try { localStorage.setItem("devcockpit-theme", theme); } catch {} },
  toggleSidebar: () => set((s) => { const v = !s.sidebarCollapsed; saveSetting("sidebarCollapsed", String(v)); return { sidebarCollapsed: v }; }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setFontSize: (fontSize) => { set({ fontSize }); saveSetting("fontSize", fontSize); },
  setGeminiApiKey: (geminiApiKey) => { set({ geminiApiKey }); saveSetting("geminiApiKey", geminiApiKey); },
  setGeminiModel: (geminiModel) => { set({ geminiModel }); saveSetting("geminiModel", geminiModel); },
  loadSettings: (settings) => set({
    theme: (() => { const t = (settings.theme as Theme) || "system"; try { localStorage.setItem("devcockpit-theme", t); } catch {} return t; })(),
    sidebarCollapsed: settings.sidebarCollapsed === "true",
    fontSize: (settings.fontSize as FontSize) || "medium",
    geminiApiKey: settings.geminiApiKey || "",
    geminiModel: settings.geminiModel || "gemini-3.1-flash-lite",
    settingsLoaded: true,
  }),
}));

function saveSetting(key: string, value: string) {
  fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: value }) }).catch(() => {});
}
