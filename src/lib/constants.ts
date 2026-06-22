// Priority color mapping and status configuration

export const PRIORITY_CONFIG = {
  urgent: { label: "紧急", color: "text-red-500", bg: "bg-red-500/10", dot: "bg-red-500" },
  high: { label: "高", color: "text-orange-500", bg: "bg-orange-500/10", dot: "bg-orange-500" },
  medium: { label: "中", color: "text-yellow-500", bg: "bg-yellow-500/10", dot: "bg-yellow-500" },
  low: { label: "低", color: "text-emerald-500", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
} as const;

export const TASK_STATUS_CONFIG = {
  inbox: { label: "收件箱", color: "text-gray-400", bg: "bg-gray-400/10", dot: "bg-gray-400" },
  todo: { label: "待开始", color: "text-blue-400", bg: "bg-blue-400/10", dot: "bg-blue-400" },
  in_progress: { label: "进行中", color: "text-amber-400", bg: "bg-amber-400/10", dot: "bg-amber-400" },
  review: { label: "审查中", color: "text-purple-400", bg: "bg-purple-400/10", dot: "bg-purple-400" },
  done: { label: "已完成", color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
} as const;

export const PROJECT_STATUS_CONFIG = {
  active: { label: "活跃", color: "text-emerald-400", dot: "bg-emerald-400" },
  maintaining: { label: "维护中", color: "text-blue-400", dot: "bg-blue-400" },
  paused: { label: "暂停", color: "text-yellow-400", dot: "bg-yellow-400" },
  planned: { label: "计划中", color: "text-gray-400", dot: "bg-gray-400" },
  completed: { label: "已完成", color: "text-purple-400", dot: "bg-purple-400" },
} as const;

export const LOAD_STATUS_MAP = {
  healthy: {
    label: "健康",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "🟢",
    messages: [
      "节奏不错，继续保持！",
      "工作与休息平衡得很好 👍",
      "最近的状态很在线 ✨",
    ],
  },
  warning: {
    label: "注意",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "🟡",
    messages: [
      "注意休息，连续工作太久了",
      "建议今天早点下班 🏠",
      "项目切换有点频繁，试试聚焦一个？",
    ],
  },
  critical: {
    label: "警告",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: "🔴",
    messages: [
      "建议今天休息，你的大脑需要恢复",
      "连续高强度工作会影响代码质量",
      "关机，出去走走 🚶",
    ],
  },
  insufficient_data: {
    label: "数据不足",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: "⚪",
    messages: ["再使用几天，我会更了解你的节奏"],
  },
} as const;

export type Priority = keyof typeof PRIORITY_CONFIG;
export type TaskStatus = keyof typeof TASK_STATUS_CONFIG;
export type ProjectStatus = keyof typeof PROJECT_STATUS_CONFIG;
export type LoadStatus = keyof typeof LOAD_STATUS_MAP;

/** Safe lookup helpers — cast string to config key */
export function getPriority(k: string) { return PRIORITY_CONFIG[k as Priority] ?? PRIORITY_CONFIG.medium; }
export function getTaskStatus(k: string) { return TASK_STATUS_CONFIG[k as TaskStatus] ?? TASK_STATUS_CONFIG.todo; }
export function getProjectStatus(k: string) { return PROJECT_STATUS_CONFIG[k as ProjectStatus] ?? PROJECT_STATUS_CONFIG.active; }
export function getLoadStatus(k: string) { return LOAD_STATUS_MAP[k as LoadStatus] ?? LOAD_STATUS_MAP.insufficient_data; }

export const GREETINGS = {
  morning: ["早上好", "新的一天开始了", "今天也要加油"],
  afternoon: ["下午好", "下午效率最高", "冲刺时间到了"],
  evening: ["晚上好", "夜深人静好写码", "今天的收获如何？"],
} as const;

export function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  const pool =
    hour < 12 ? GREETINGS.morning
    : hour < 18 ? GREETINGS.afternoon
    : GREETINGS.evening;
  // Deterministic: hour % length avoids Math.random() hydration mismatch
  const text = pool[hour % pool.length] ?? pool[0]!;
  const emoji = hour < 12 ? "☀️" : hour < 18 ? "⛅" : "🌙";
  return { text, emoji };
}

export function getWeekNumber(date: Date = new Date()): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
}

export const PROJECT_COLORS = [
  "#8B5CF6", "#F97316", "#22C55E", "#3B82F6",
  "#EC4899", "#F59E0B", "#06B6D4", "#EF4444",
  "#14B8A6", "#6366F1",
];

export const NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "FolderKanban", label: "项目", href: "/projects" },
  { icon: "CheckSquare", label: "任务", href: "/tasks" },
  { icon: "Calendar", label: "日历", href: "/calendar" },
  { icon: "BookOpen", label: "状态", href: "/journal" },
  { icon: "Sparkles", label: "AI", href: "/ai" },
  { icon: "Settings", label: "设置", href: "/settings" },
] as const;
