"use client";

import { create } from "zustand";
import { DEFAULT_PROVIDER } from "@/lib/ai-providers";

type Theme = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  fontSize: FontSize;
  settingsLoaded: boolean;

  // AI provider
  aiProvider: string;
  aiModel: string;
  geminiApiKey: string;
  openaiApiKey: string;
  claudeApiKey: string;
  deepseekApiKey: string;
  qwenApiKey: string;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setFontSize: (size: FontSize) => void;
  setAiProvider: (provider: string) => void;
  setAiModel: (model: string) => void;
  setApiKey: (provider: string, key: string) => void;
  loadSettings: (settings: Record<string, string>) => void;
}

function saveSetting(key: string, value: string) {
  fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: value }) }).catch(() => {});
}

export const useUIStore = create<UIState>()((set) => ({
  theme: "system",
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  fontSize: "medium",
  settingsLoaded: false,

  aiProvider: DEFAULT_PROVIDER,
  aiModel: "",
  geminiApiKey: "",
  openaiApiKey: "",
  claudeApiKey: "",
  deepseekApiKey: "",
  qwenApiKey: "",

  setTheme: (theme) => { set({ theme }); saveSetting("theme", theme); try { localStorage.setItem("devcockpit-theme", theme); } catch {} },
  toggleSidebar: () => set((s) => { const v = !s.sidebarCollapsed; saveSetting("sidebarCollapsed", String(v)); return { sidebarCollapsed: v }; }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setFontSize: (fontSize) => { set({ fontSize }); saveSetting("fontSize", fontSize); },
  setAiProvider: (aiProvider) => { set({ aiProvider }); saveSetting("aiProvider", aiProvider); },
  setAiModel: (aiModel) => { set({ aiModel }); saveSetting("aiModel", aiModel); },
  setApiKey: (provider, key) => {
    const keyMap: Record<string, unknown> = { gemini: "geminiApiKey", openai: "openaiApiKey", claude: "claudeApiKey", deepseek: "deepseekApiKey", qwen: "qwenApiKey" };
    const stateKey = keyMap[provider] as string;
    if (stateKey) { set({ [stateKey]: key } as Partial<UIState>); saveSetting(stateKey, key); }
  },
  loadSettings: (settings) => set({
    theme: (() => { const t = (settings.theme as Theme) || "system"; try { localStorage.setItem("devcockpit-theme", t); } catch {} return t; })(),
    sidebarCollapsed: settings.sidebarCollapsed === "true",
    fontSize: (settings.fontSize as FontSize) || "medium",
    aiProvider: settings.aiProvider || DEFAULT_PROVIDER,
    aiModel: settings.aiModel || "",
    geminiApiKey: settings.geminiApiKey || "",
    openaiApiKey: settings.openaiApiKey || "",
    claudeApiKey: settings.claudeApiKey || "",
    deepseekApiKey: settings.deepseekApiKey || "",
    qwenApiKey: settings.qwenApiKey || "",
    settingsLoaded: true,
  }),
}));
