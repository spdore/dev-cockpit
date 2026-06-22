/**
 * Hook: Auto-updating time-based greeting and formatted date.
 *
 * Updates every 60 seconds to follow system time (midnight crossing, etc.).
 * Computed client-side only to avoid SSR hydration mismatch.
 */

import { useEffect, useState } from "react";
import { getGreeting } from "@/shared/config";
import { formatDateCN } from "@/shared/date-utils";

export function useGreeting() {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState<ReturnType<typeof getGreeting>>({ text: "", emoji: "" });
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const tick = () => {
      setGreeting(getGreeting());
      setDateStr(formatDateCN());
    };
    tick();
    setMounted(true);
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  return { greeting, dateStr, mounted };
}
