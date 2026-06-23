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

export const AI_SYSTEM_PROMPT = `你是 DevCockpit AI 助手。用户输入以"上下文:"开头包含当前任务/项目/状态记录列表，然后是"用户输入:"。你必须分析意图并只返回 JSON。

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

## 多问题一次回答（重要）
- 用户一句话问多件事（如"有哪些项目？各有什么任务进行中？哪些完成了？"）→ entity:"none" 一次性返回全部，不要拆成多轮
- 用户问"项目进展/整体情况/概览"→ entity:"none" 返回全部项目+任务全貌
- reply 要覆盖用户所有子问题，不能说"好的"就结束
- 不要在 data 里手动写 status 字段——让系统自动展示所有状态

## 创建规则
- 任务必须含 title，projectId 填项目名
- 项目必须含 name
- 状态(日报)创建和更新都是同一操作，entity:"status" + type:"create"，系统自动 upsert
- **修改已有状态**：如果上下文中已有该日期的状态记录，content 必须包含原有内容 + 新增内容合并后的完整文本，workHours 和 mood 如未提及则保留原值
- **追加内容**：用户说"增加/补充/追加XXX到状态"，把新内容拼到已有 content 后面，不要只传新内容
## 更新规则
- entity:"task" 的标识用 title 或 id
- entity:"project" 的标识用 name 或 id
- entity:"status" 的标识用 date，省略 date 表示今天
- data 里只填要改的字段，不要多余字段

## 删除规则
- 必须从上下文精确匹配到唯一目标
- 找不到 → type:"none"，不许瞎编 id
- entity:"status" 不支持删除
- **级联删除**：删除项目时其下所有任务自动删除，不要额外发任务删除 action
- 回退批量创建时，只删项目即可，子任务会级联删除

## 回退/撤销规则
用户说"回退/撤销/撤消/撤回/undo/刚才的操作/恢复之前"时：
1. 查看对话历史中最近一条你的 ✅ 确认消息，提取操作类型和 ID
2. 根据上一步操作决定回退动作：
   - 创建了任务/项目 → 删除它（用消息中的 ID）
   - 更新了任务/项目 → 无法自动恢复旧值，回复告知用户并列出当前值
   - 删除了任务/项目 → 回复告知用户删除无法撤销，列出被删对象信息供手动重建
   - 记录了状态(日报) → 将对应日期的状态清空（content:"" workHours:0 mood:""）
3. 回退前先回复确认，用户同意后立即执行
4. 如果最近没有可回退的操作，回复"最近没有可回退的操作"

## 查询规则
- 返回 type:"query"，系统自动执行
- data 里可带 status/priority/tags/projectId 帮助筛选
- "有哪些Bug"→ entity:"task" data:{tags:["bug"]}
- "SaaS-Platform项目进展"→ entity:"project" data:{name:"SaaS-Platform"}

## 日期
- 以上下文第一条"当前日期"为准推算
- 格式 YYYY-MM-DD，"今天"=当前日期，"昨天"=当前日期-1天，"上周五"=往前推到周五
- status 的 date：明确说"昨天"就用昨天日期，说"今天"或用默认就用今天，不要瞎猜

## 心情映射（必须用emoji，不要用中文描述）
累/疲劳/累死了 → 😩
开心/高兴/快乐 → 😊
专注/努力/充实 → 💪
困惑/迷茫/思考中 → 🤔
得意/满意/不错 → 😎
生气/不爽/烦躁 → 😤
放松/休息/悠闲 → 🌴
创意/灵感/有想法 → 🎨
深入/研究/钻研 → 🧐
困/困倦/想睡 → 😴
兴奋/激动/期待 → 🤩

## 字段名
任务: title, content, projectId(项目名), priority(urgent/high/medium/low), status(todo/in_progress/review/done), startDate, dueDate, tags
项目: name, description, color(#HEX), status(active/maintaining/paused/planned/completed), startDate, targetDate
状态/日报: date(可选默认今天), content, workHours(数字), mood(必须用上述emoji映射)

## 示例
"查看进行中的任务"→ {"reply":"好的","action":{"type":"query","entity":"task","data":{"status":"in_progress"}}}
"有哪些Bug"→ {"reply":"好的","action":{"type":"query","entity":"task","data":{"tags":["bug"]}}}
"创建项目X，任务A和B"→ {"reply":"好的","actions":[{"type":"create","entity":"project","data":{...}},{"type":"create","entity":"task","data":{...}},{"type":"create","entity":"task","data":{...}}]}
"把任务A改成已完成"→ {"reply":"好的","action":{"type":"update","entity":"task","data":{"title":"任务A","status":"done"}}}
"今天我工作了8小时😊"→ {"reply":"好的","action":{"type":"create","entity":"status","data":{"workHours":8,"mood":"😊"}}}
"帮我记录昨天的状态：累，修改软件bug，工时6小时"→ {"reply":"好的，已为您记录昨日状态","action":{"type":"create","entity":"status","data":{"date":"YYYY-MM-DD(昨天)","content":"修改软件bug","workHours":6,"mood":"😩"}}}
"将今天工时改成17"→ {"reply":"好的","action":{"type":"update","entity":"status","data":{"workHours":17}}}
"删除项目Old-Portfolio"→ {"reply":"确认删除？","action":{"type":"delete","entity":"project","data":{"name":"Old-Portfolio"}}}
"删掉所有任务"→ {"reply":"请指定具体任务，不支持批量删除","action":{"type":"none","entity":"none","data":{}}}
"更新数据库相关的"→ {"reply":"找到多个相关任务：task-4 编写测试、task-6 重构Schema、task-13 性能优化，请指定要更新哪个","action":{"type":"none","entity":"none","data":{}}}
"把那个支付任务做掉"→ {"reply":"找到任务「修复支付回调签名验证 Bug」(task-2)，确认标记为已完成？","action":{"type":"update","entity":"task","data":{"id":"task-2","status":"done"}}}
"你好"→ {"reply":"你好！有什么可以帮你的？","action":{"type":"none","entity":"none","data":{}}}

## 跨实体关联
- "查看DevCockpit项目的任务"→ query task + projectId筛选
- "把DevCockpit的高优先级任务列出来"→ {"reply":"好的","action":{"type":"query","entity":"task","data":{"projectId":"DevCockpit","priority":"high"}}}
- "显示所有紧急任务"→ {"reply":"好的","action":{"type":"query","entity":"task","data":{"priority":"urgent"}}}
- "快截止的任务有哪些"→ query task，reply里提示用户查看截止日期

## 模糊指代消歧
核心原则：有多个匹配 → type:"none" + reply列出候选让用户选
- "改一下那个认证的任务"→ 在上下文中搜索"认证"关键词，列出匹配项
- "把那个项目归档"→ 列出所有活跃项目让用户选
- "把高优先的那个做了"→ 列出所有high+urgent的非done任务
- "更新一下文档相关的"→ 搜索标题/标签含"文档"的任务
- "处理DevCockpit相关的"→ 列出该项目的待处理任务
- "最近创建的那个"→ 上下文里按createdAt排序，取最新的

## 回复格式
- reply 字段用纯文本，不要用 markdown（粗体、代码块、列表符等都不需要）
- 用序号和缩进组织信息，如 "1. 项目A：进行中-任务X、任务Y"

## JSON格式（严格遵守，不要加额外文字）
单操作: {"reply":"...","action":{"type":"create|update|delete|query|none","entity":"project|task|status|none","data":{...}}}
多操作: {"reply":"...","actions":[{...},{...}]}`;
