import type { Priority } from "./constants";

export interface ParsedTaskInput {
  title: string;        // Cleaned text without tokens
  tags: string[];       // e.g. ["bug", "frontend"]
  projectName: string | null;  // e.g. "SaaS-Platform"
  priority: Priority;   // mapped from !标记
  rawText: string;      // Original input preserved
}

/**
 * Parse a natural-language task input like:
 *   "#bug @SaaS-Platform !高 修复登录页样式问题"
 *
 * Extracts:
 *  - #tags   → tags[]
 *  - @project → projectName
 *  - !优先级  → priority (defaults to "medium")
 *  - remaining text → title
 */
export function parseTaskInput(input: string): ParsedTaskInput {
  const tags = (input.match(/#(\S+)/g) || []).map((t) => t.slice(1));
  const projectMatch = input.match(/@(\S+)/);
  const priorityMatch = input.match(/!(紧急|高|中|低|urgent|high|medium|low)/i);

  const title = input
    .replace(/#\S+/g, "")
    .replace(/@\S+/g, "")
    .replace(/!(?:紧急|高|中|低|urgent|high|medium|low)/gi, "")
    .trim();

  let priority: Priority = "medium";
  if (priorityMatch) {
    const p = priorityMatch[1]!.toLowerCase();
    if (p === "紧急" || p === "urgent") priority = "urgent";
    else if (p === "高" || p === "high") priority = "high";
    else if (p === "低" || p === "low") priority = "low";
  }

  return {
    title: title || input.trim() || "未命名任务",
    tags,
    projectName: projectMatch ? projectMatch[1]! : null,
    priority,
    rawText: input,
  };
}

/**
 * Parse for display-only purposes (used in QuickCapture preview badge rendering).
 * Returns the same structure plus the raw priority label string.
 */
export interface ParsedTokens {
  tags: string[];
  project: string | null;
  priority: string | null;  // Chinese label e.g. "高"
  text: string;
}

export function parseCaptureInput(input: string): ParsedTokens {
  const parsed = parseTaskInput(input);
  return {
    tags: parsed.tags,
    project: parsed.projectName,
    priority: parsed.priority === "medium" && !input.match(/!(?:中|medium)/i)
      ? null
      : PRIORITY_LABEL[parsed.priority],
    text: parsed.title,
  };
}

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};
