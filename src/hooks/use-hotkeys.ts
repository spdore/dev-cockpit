"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

/**
 * Global keyboard shortcut handler.
 * Dispatches custom events for page-specific actions:
 *   devcockpit:new-task     → ⌘N / Ctrl+N
 *   devcockpit:quick-capture → ⌘⇧N / Ctrl+Shift+N
 */
export function useHotkeys() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // ⌘K / Ctrl+K → Command palette
      if (isMeta && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // ⌘⇧N / Ctrl+Shift+N → Quick capture
      if (isMeta && e.shiftKey && e.key === "n") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("devcockpit:quick-capture"));
        return;
      }

      // ⌘N / Ctrl+N → New task
      if (isMeta && !e.shiftKey && e.key === "n") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("devcockpit:new-task"));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);
}
