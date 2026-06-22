"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

const FONT_SIZES: Record<string, string> = { small: "14px", medium: "16px", large: "18px" };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);
  const fontSize = useUIStore((s) => s.fontSize);
  const settingsLoaded = useUIStore((s) => s.settingsLoaded);
  const loadSettings = useUIStore((s) => s.loadSettings);

  // Load settings from DB on mount
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(loadSettings).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      root.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize] || "16px";
  }, [fontSize]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { const r = document.documentElement; r.classList.remove("light", "dark"); r.classList.add(mq.matches ? "dark" : "light"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return <>{children}</>;
}
