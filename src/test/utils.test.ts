import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

// ============================================================
// T3 — lib/utils.ts
// ============================================================

describe("cn (className merge utility)", () => {
  it("T3.1 — should merge basic class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("T3.2 — should resolve Tailwind conflicts (last wins)", () => {
    const result = cn("px-4", "px-2");
    expect(result).toContain("px-2");
    expect(result).not.toContain("px-4");
  });

  it("T3.3 — should handle conditional/falsy values", () => {
    const result = cn("base", false && "hidden", undefined, null, "");
    expect(result).toBe("base");
  });

  it("should handle array of classes", () => {
    const result = cn(["text-sm", "font-bold"], "text-lg");
    // text-lg should win over text-sm via tailwind-merge
    expect(result).toContain("text-lg");
    expect(result).toContain("font-bold");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });

  it("should merge dark: variants properly", () => {
    const result = cn("bg-white dark:bg-black", "dark:bg-zinc-900");
    expect(result).toContain("bg-white");
    expect(result).toContain("dark:bg-zinc-900");
    expect(result).not.toContain("dark:bg-black");
  });
});
