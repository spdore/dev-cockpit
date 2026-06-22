import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  PROJECT_STATUS_CONFIG,
  LOAD_STATUS_MAP,
  getGreeting,
  getWeekNumber,
  NAV_ITEMS,
  GREETINGS,
} from "@/lib/constants";

// ============================================================
// T1 — lib/constants.ts
// ============================================================

describe("PRIORITY_CONFIG", () => {
  it("T1.1 — should contain all 4 priority levels with required properties", () => {
    const levels = ["urgent", "high", "medium", "low"] as const;
    for (const level of levels) {
      expect(PRIORITY_CONFIG[level]).toBeDefined();
      expect(PRIORITY_CONFIG[level].label).toBeTruthy();
      expect(PRIORITY_CONFIG[level].color).toMatch(/^text-/);
      expect(PRIORITY_CONFIG[level].bg).toMatch(/^bg-/);
      expect(PRIORITY_CONFIG[level].dot).toMatch(/^bg-/);
    }
  });

  it("should have red for urgent", () => {
    expect(PRIORITY_CONFIG.urgent.label).toBe("紧急");
    expect(PRIORITY_CONFIG.urgent.color).toContain("red");
  });

  it("should have orange for high", () => {
    expect(PRIORITY_CONFIG.high.label).toBe("高");
    expect(PRIORITY_CONFIG.high.color).toContain("orange");
  });

  it("should have yellow for medium", () => {
    expect(PRIORITY_CONFIG.medium.label).toBe("中");
    expect(PRIORITY_CONFIG.medium.color).toContain("yellow");
  });

  it("should have emerald for low", () => {
    expect(PRIORITY_CONFIG.low.label).toBe("低");
    expect(PRIORITY_CONFIG.low.color).toContain("emerald");
  });
});

describe("TASK_STATUS_CONFIG", () => {
  it("T1.2 — should contain all 5 task statuses", () => {
    const statuses = ["inbox", "todo", "in_progress", "review", "done"];
    for (const s of statuses) {
      expect(TASK_STATUS_CONFIG[s as keyof typeof TASK_STATUS_CONFIG]).toBeDefined();
      expect(TASK_STATUS_CONFIG[s as keyof typeof TASK_STATUS_CONFIG].label).toBeTruthy();
    }
  });

  it("should map inbox to 收件箱", () => {
    expect(TASK_STATUS_CONFIG.inbox.label).toBe("收件箱");
  });

  it("should map done to 已完成", () => {
    expect(TASK_STATUS_CONFIG.done.label).toBe("已完成");
  });
});

describe("PROJECT_STATUS_CONFIG", () => {
  it("T1.3 — should contain all 5 project statuses", () => {
    const statuses = ["active", "maintaining", "paused", "planned", "completed"];
    for (const s of statuses) {
      expect(PROJECT_STATUS_CONFIG[s as keyof typeof PROJECT_STATUS_CONFIG]).toBeDefined();
    }
  });
});

describe("LOAD_STATUS_MAP", () => {
  it("T1.4 — should contain 4 load statuses with message arrays", () => {
    const statuses = ["healthy", "warning", "critical", "insufficient_data"];
    for (const s of statuses) {
      const config = LOAD_STATUS_MAP[s as keyof typeof LOAD_STATUS_MAP];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(Array.isArray(config.messages)).toBe(true);
      expect(config.messages.length).toBeGreaterThan(0);
    }
  });

  it("healthy should have 3 messages", () => {
    expect(LOAD_STATUS_MAP.healthy.messages).toHaveLength(3);
  });

  it("warning should have 3 messages", () => {
    expect(LOAD_STATUS_MAP.warning.messages).toHaveLength(3);
  });

  it("critical should have 3 messages", () => {
    expect(LOAD_STATUS_MAP.critical.messages).toHaveLength(3);
  });

  it("insufficient_data should have 1 message", () => {
    expect(LOAD_STATUS_MAP.insufficient_data.messages).toHaveLength(1);
  });
});

describe("getGreeting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("T1.5 — should return morning greeting with ☀️ before 12pm", () => {
    vi.setSystemTime(new Date(2026, 5, 21, 8, 0, 0)); // 8:00 AM
    const result = getGreeting();
    expect(result.emoji).toBe("☀️");
    expect(GREETINGS.morning).toContain(result.text);
  });

  it("T1.6 — should return afternoon greeting with ⛅ between 12-17", () => {
    vi.setSystemTime(new Date(2026, 5, 21, 14, 0, 0)); // 2:00 PM
    const result = getGreeting();
    expect(result.emoji).toBe("⛅");
    expect(GREETINGS.afternoon).toContain(result.text);
  });

  it("T1.7 — should return evening greeting with 🌙 at or after 18:00", () => {
    vi.setSystemTime(new Date(2026, 5, 21, 20, 0, 0)); // 8:00 PM
    const result = getGreeting();
    expect(result.emoji).toBe("🌙");
    expect(GREETINGS.evening).toContain(result.text);
  });

  it("should return morning at 11:59", () => {
    vi.setSystemTime(new Date(2026, 5, 21, 11, 59, 0));
    const result = getGreeting();
    expect(result.emoji).toBe("☀️");
  });

  it("should return afternoon at 12:00 exactly", () => {
    vi.setSystemTime(new Date(2026, 5, 21, 12, 0, 0));
    const result = getGreeting();
    expect(result.emoji).toBe("⛅");
  });

  it("should return evening at 17:59", () => {
    vi.setSystemTime(new Date(2026, 5, 21, 17, 59, 0));
    const result = getGreeting();
    expect(result.emoji).toBe("⛅");
  });
});

describe("getWeekNumber", () => {
  it("T1.8 — should return week 1 for Jan 1", () => {
    const result = getWeekNumber(new Date(2026, 0, 1));
    expect(result).toBeGreaterThanOrEqual(1);
  });

  it("T1.9 — should return current week number for today", () => {
    const result = getWeekNumber(new Date());
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(53);
  });

  it("should return week 53 for Dec 31", () => {
    const result = getWeekNumber(new Date(2026, 11, 31));
    expect(result).toBeGreaterThanOrEqual(52);
  });
});

describe("NAV_ITEMS", () => {
  it("T1.10 — should contain 5 navigation items with correct labels", () => {
    expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(6);
    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("项目");
    expect(labels).toContain("任务");
    expect(labels).toContain("日历");
    expect(labels).toContain("状态");
    expect(labels).toContain("设置");
  });

  it("every item should have icon, label, and href", () => {
    for (const item of NAV_ITEMS) {
      expect(item.icon).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\//);
    }
  });
});

describe("GREETINGS", () => {
  it("T1.12 — each time period should have exactly 3 messages", () => {
    expect(GREETINGS.morning).toHaveLength(3);
    expect(GREETINGS.afternoon).toHaveLength(3);
    expect(GREETINGS.evening).toHaveLength(3);
  });
});
