/**
 * Application-wide configuration constants.
 *
 * Includes UI label mappings, color palettes, greeting logic,
 * navigation items, and the AI system prompt.
 */

import type { TaskPriority, TaskStatus, ProjectStatus, LoadStatus } from "@/core/entities/enums";

// ═══════════════════════════════════════════════════════════
// Priority display config
// ═══════════════════════════════════════════════════════════

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  urgent:  { label: "紧急", color: "text-red-500",     bg: "bg-red-500/10",     dot: "bg-red-500" },
  high:    { label: "高",   color: "text-orange-500",  bg: "bg-orange-500/10",  dot: "bg-orange-500" },
  medium:  { label: "中",   color: "text-yellow-500",  bg: "bg-yellow-500/10",  dot: "bg-yellow-500" },
  low:     { label: "低",   color: "text-emerald-500", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
} as const;

// ═══════════════════════════════════════════════════════════
// Task status display config
// ═══════════════════════════════════════════════════════════

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  inbox:       { label: "收件箱", color: "text-gray-400",    bg: "bg-gray-400/10",    dot: "bg-gray-400" },
  todo:        { label: "待开始", color: "text-blue-400",    bg: "bg-blue-400/10",    dot: "bg-blue-400" },
  in_progress: { label: "进行中", color: "text-amber-400",   bg: "bg-amber-400/10",   dot: "bg-amber-400" },
  review:      { label: "审查中", color: "text-purple-400",  bg: "bg-purple-400/10",  dot: "bg-purple-400" },
  done:        { label: "已完成", color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
} as const;

// ═══════════════════════════════════════════════════════════
// Project status display config
// ═══════════════════════════════════════════════════════════

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; dot: string }> = {
  active:      { label: "活跃",   color: "text-emerald-400", dot: "bg-emerald-400" },
  maintaining: { label: "维护中", color: "text-blue-400",    dot: "bg-blue-400" },
  paused:      { label: "暂停",   color: "text-yellow-400",  dot: "bg-yellow-400" },
  planned:     { label: "计划中", color: "text-gray-400",    dot: "bg-gray-400" },
  completed:   { label: "已完成", color: "text-purple-400",  dot: "bg-purple-400" },
} as const;

// ═══════════════════════════════════════════════════════════
// Cognitive load assessment
// ═══════════════════════════════════════════════════════════

export const LOAD_STATUS_MAP: Record<LoadStatus, {
  label: string; color: string; icon: string; messages: string[];
}> = {
  healthy: {
    label: "健康", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: "🟢",
    messages: ["节奏不错，继续保持！", "工作与休息平衡得很好 👍", "最近的状态很在线 ✨"],
  },
  warning: {
    label: "注意", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: "🟡",
    messages: ["注意休息，连续工作太久了", "建议今天早点下班 🏠", "项目切换有点频繁，试试聚焦一个？"],
  },
  critical: {
    label: "警告", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: "🔴",
    messages: ["建议今天休息，你的大脑需要恢复", "连续高强度工作会影响代码质量", "关机，出去走走 🚶"],
  },
  insufficient_data: {
    label: "数据不足", color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: "⚪",
    messages: ["再使用几天，我会更了解你的节奏"],
  },
} as const;

// ═══════════════════════════════════════════════════════════
// Safe lookup helpers — accepts arbitrary string, returns config with fallback
// ═══════════════════════════════════════════════════════════

/** Look up priority display config, defaulting to "medium". */
export function getPriorityConfig(k: string) {
  return PRIORITY_CONFIG[k as TaskPriority] ?? PRIORITY_CONFIG.medium;
}

/** Look up task status display config, defaulting to "todo". */
export function getTaskStatusConfig(k: string) {
  return TASK_STATUS_CONFIG[k as TaskStatus] ?? TASK_STATUS_CONFIG.todo;
}

/** Look up project status display config, defaulting to "active". */
export function getProjectStatusConfig(k: string) {
  return PROJECT_STATUS_CONFIG[k as ProjectStatus] ?? PROJECT_STATUS_CONFIG.active;
}

/** Look up load status display config, defaulting to "insufficient_data". */
export function getLoadStatusConfig(k: string) {
  return LOAD_STATUS_MAP[k as LoadStatus] ?? LOAD_STATUS_MAP.insufficient_data;
}

// ═══════════════════════════════════════════════════════════
// Time-based greetings
// ═══════════════════════════════════════════════════════════

const GREETINGS = {
  morning:   ["早上好", "新的一天开始了", "今天也要加油"],
  afternoon: ["下午好", "下午效率最高", "冲刺时间到了"],
  evening:   ["晚上好", "夜深人静好写码", "今天的收获如何？"],
} as const;

/**
 * Returns a deterministic time-of-day greeting.
 * Uses `hour % pool.length` to avoid Math.random() hydration mismatch.
 */
export function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  const pool = hour < 12 ? GREETINGS.morning : hour < 18 ? GREETINGS.afternoon : GREETINGS.evening;
  const text = pool[hour % pool.length] ?? pool[0]!;
  const emoji = hour < 12 ? "☀️" : hour < 18 ? "⛅" : "🌙";
  return { text, emoji };
}

/** ISO week number (1-53) for a given date. */
export function getWeekNumber(date: Date = new Date()): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
}

// ═══════════════════════════════════════════════════════════
// Color palette & navigation
// ═══════════════════════════════════════════════════════════

/** Predefined project color palette (10 hex values). */
export const PROJECT_COLORS = [
  "#8B5CF6", "#F97316", "#22C55E", "#3B82F6",
  "#EC4899", "#F59E0B", "#06B6D4", "#EF4444",
  "#14B8A6", "#6366F1",
] as const;

/** Sidebar navigation items. */
export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "FolderKanban",     label: "项目",      href: "/projects" },
  { icon: "CheckSquare",      label: "任务",      href: "/tasks" },
  { icon: "Calendar",         label: "日历",      href: "/calendar" },
  { icon: "BookOpen",         label: "状态",      href: "/journal" },
  { icon: "Sparkles",         label: "AI",        href: "/ai" },
  { icon: "Settings",         label: "设置",      href: "/settings" },
] as const;

// ═══════════════════════════════════════════════════════════
// AI System Prompt
// ═══════════════════════════════════════════════════════════

export const AI_SYSTEM_PROMPT = `你是 DevCockpit AI 助手。用户输入以"上下文:"开头包含当前任务/项目/里程碑列表，然后是"用户输入:"。你必须分析意图并只返回 JSON。

## 铁律（违反将导致操作失败）
1. 任何写操作（创建/修改/删除/工时/心情）都必须返回 action，绝不能直接说"已完成""已更新"
2. 找不到唯一目标 → type:"none" + reply列出候选，让用户选择
3. 用户没明确说要创建/修改/删除 → type:"query"或"none"
4. 模糊指代（"那个支付的任务""数据库相关的"）→ type:"none" + 列出匹配项

## 决策表
| 场景 | 判断 | type |
|------|------|------|
| 明确说"创建/新建/添加"+有名称 | 信息充足 | create |
| 说"创建"但缺名称 | 追问 | none |
| 说"改成/修改/更新/标记"+匹配到唯一目标 | 找到目标 | update |
| 说"改成/修改"但匹配到多个 | 列出候选 | none |
| 说"删除/移除"+匹配到唯一目标 | 找到目标 | delete |
| 说"删除"但匹配到多个/模糊 | 拒绝或列候选 | none |
| 说"删除所有/清空" | 批量危险 | none(拒绝) |
| 说"查看/列出/有哪些/查一下" | 读取 | query |
| 纯聊天/天气/写诗/你好 | 非操作 | none |
| 说"把XX做了/干掉了" | 等同于标记完成 | update |

## 创建规则
- 任务必须含 title，projectId 填项目名
- 项目必须含 name
- 状态(日报)创建和更新都是同一操作，entity:"status" + type:"create"，系统自动 upsert
- 里程碑必须含 projectId(项目名)、title、targetDate

## 更新规则
- entity:"task" 的标识用 title 或 id
- entity:"project" 的标识用 name 或 id
- entity:"status" 的标识用 date，省略 date 表示今天
- entity:"milestone" 的标识用 title 或 id
- data 里只填要改的字段，不要多余字段

## 删除规则
- 必须从上下文精确匹配到唯一目标
- 找不到 → type:"none"，不许瞎编 id
- entity:"status" 不支持删除

## 查询规则
- 返回 type:"query"，系统自动执行
- data 里可带 status/priority/tags/projectId 帮助筛选
- "有哪些Bug"→ entity:"task" data:{tags:["bug"]}
- "SaaS-Platform项目进展"→ entity:"project" data:{name:"SaaS-Platform"}

## 日期
- 以上下文第一条"当前日期"为准推算
- 格式 YYYY-MM-DD，"今天"=当前日期，"上周五"=往前推到周五
- status 不填 date 默认今天

## 字段名
任务: title, content, projectId(项目名), priority(urgent/high/medium/low), status(todo/in_progress/review/done), startDate, dueDate, tags
项目: name, description, color(#HEX), status(active/maintaining/paused/planned/completed), startDate, targetDate
状态/日报: date(可选默认今天), content, workHours(数字), mood(emoji)

## 示例
"查看进行中的任务"→ {"reply":"好的","action":{"type":"query","entity":"task","data":{"status":"in_progress"}}}
"有哪些Bug"→ {"reply":"好的","action":{"type":"query","entity":"task","data":{"tags":["bug"]}}}
"创建项目X，任务A和B"→ {"reply":"好的","actions":[{"type":"create","entity":"project","data":{...}},{"type":"create","entity":"task","data":{...}},{"type":"create","entity":"task","data":{...}}]}
"把任务A改成已完成"→ {"reply":"好的","action":{"type":"update","entity":"task","data":{"title":"任务A","status":"done"}}}
"将今天工时改成17"→ {"reply":"好的","action":{"type":"update","entity":"status","data":{"workHours":17}}}
"今天我工作了8小时😊"→ {"reply":"好的","action":{"type":"create","entity":"status","data":{"workHours":8,"mood":"😊"}}}
"删除项目Old-Portfolio"→ {"reply":"确认删除？","action":{"type":"delete","entity":"project","data":{"name":"Old-Portfolio"}}}
"删掉所有任务"→ {"reply":"请指定具体任务，不支持批量删除","action":{"type":"none","entity":"none","data":{}}}
"更新数据库相关的"→ {"reply":"找到多个相关任务：task-4 编写测试、task-6 重构Schema、task-13 性能优化，请指定要更新哪个","action":{"type":"none","entity":"none","data":{}}}
"把那个支付任务做掉"→ {"reply":"找到任务「修复支付回调签名验证 Bug」(task-2)，确认标记为已完成？","action":{"type":"update","entity":"task","data":{"id":"task-2","status":"done"}}}
"你好"→ {"reply":"你好！有什么可以帮你的？","action":{"type":"none","entity":"none","data":{}}}

## JSON格式（严格遵守，不要加额外文字）
单操作: {"reply":"...","action":{"type":"create|update|delete|query|none","entity":"project|task|status|milestone|none","data":{...}}}
多操作: {"reply":"...","actions":[{...},{...}]}`;
