// ── AI Natural Language Parser ──
// Converts unstructured Chinese text into structured CRUD operations

export type EntityType = "project" | "task" | "status";
export type ActionType = "create" | "update" | "delete" | "query" | "unknown";

export interface ParsedCommand {
  action: ActionType;
  entity: EntityType;
  fields: Record<string, string | string[] | null>;
  raw: string;
  confidence: number; // 0-1
}

const PRIORITY_MAP: Record<string, string> = {
  "紧急": "urgent", "urgent": "urgent",
  "高": "high", "high": "high",
  "中": "medium", "medium": "medium",
  "低": "low", "low": "low",
};

const STATUS_MAP: Record<string, string> = {
  "待开始": "todo", "todo": "todo",
  "进行中": "in_progress", "in_progress": "in_progress",
  "审查中": "review", "review": "review",
  "已完成": "done", "done": "done",
  "收件箱": "inbox", "inbox": "inbox",
};

const PROJECT_STATUS_MAP: Record<string, string> = {
  "活跃": "active", "active": "active",
  "维护中": "maintaining", "maintaining": "maintaining",
  "暂停": "paused", "paused": "paused",
  "计划中": "planned", "planned": "planned",
  "已完成": "completed", "completed": "completed",
};

export function parseCommand(input: string): ParsedCommand {
  const text = input.trim();
  if (!text) return { action: "unknown", entity: "task", fields: {}, raw: text, confidence: 0 };

  let action: ActionType = "unknown";
  let entity: EntityType = "task";
  let confidence = 0.5;
  const fields: Record<string, string | string[] | null> = {};

  // ── Intent detection ──
  if (/^(创建|新建|添加|增加|加一个?|create|add|new)\b/i.test(text)) {
    action = "create"; confidence += 0.3;
  } else if (/^(修改|更新|编辑|改|update|edit|change)\b/i.test(text)) {
    action = "update"; confidence += 0.2;
  } else if (/^(删除|移除|删|delete|remove)\b/i.test(text)) {
    action = "delete"; confidence += 0.2;
  } else if (/^(查看|显示|列出|有哪些?|查|show|list|query|find)\b/i.test(text)) {
    action = "query"; confidence += 0.25;
  } else if (/完成|做了|做完了|搞定|done|finish|complete/i.test(text)) {
    action = "update"; fields.status = "done"; confidence += 0.25;
  }

  // ── Entity detection ──
  if (/项目|project|proj/i.test(text)) { entity = "project"; confidence += 0.2; }
  else if (/(每日)?(状态|总结|日记|心情|记录)|status|summary|journal|daily/i.test(text)) { entity = "status"; confidence += 0.2; }
  else if (/任务|task|todo|bug|feature/i.test(text)) { entity = "task"; confidence += 0.1; }

  // ── Field extraction ──

  // Title / Name — quoted text or text after entity keywords
  const titleMatch = text.match(/[""]([^""]+)[""]|「([^」]+)」|『([^』]+)』|名称[是为:：]\s*(\S+)/);
  if (titleMatch) {
    fields.title = titleMatch[1] || titleMatch[2] || titleMatch[3] || titleMatch[4] || "";
  } else if (action === "create") {
    // Extract title from the main description
    const clean = text.replace(/^(创建|新建|添加|增加)\s*(一个?|新的?)?\s*(项目|任务)?\s*/i, "").replace(/\s*[，,]\s*.*$/, "").trim();
    if (clean && clean.length < 50) fields.title = clean;
  }

  // Description / Content
  const descMatch = text.match(/描述[是为:：]\s*(.+?)(?:[，,]\s*(?:优先级|状态|标签|日期|截止|项目)|\s*$)/);
  if (descMatch) fields.content = descMatch[1]!.trim();

  // Priority
  for (const [k, v] of Object.entries(PRIORITY_MAP)) {
    if (text.includes(k)) { fields.priority = v; break; }
  }

  // Status
  for (const [k, v] of Object.entries(STATUS_MAP)) {
    if (text.includes(k)) { fields.status = v; break; }
  }
  for (const [k, v] of Object.entries(PROJECT_STATUS_MAP)) {
    if (text.includes(k) && entity === "project") { fields.status = v; break; }
  }

  // Tags — #tag or 标签: tag1, tag2
  const tagMatch = text.match(/#(\S+)/g);
  if (tagMatch) fields.tags = tagMatch.map(t => t.slice(1));
  else {
    const tagLabel = text.match(/标签[是为:：]\s*(.+?)(?:[，,]\s*(?:优先级|状态|日期|截止)|\s*$)/);
    if (tagLabel) fields.tags = tagLabel[1]!.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  }

  // Project name
  const projMatch = text.match(/@(\S+)|项目[是为:：]\s*(\S+)/);
  if (projMatch) fields.projectName = projMatch[1] || projMatch[2] || "";

  // Due date
  const dueMatch = text.match(/(?:截止|到期|due|ddl)[是为:：]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[月/-]\d{1,2}(?:[日号])?)/);
  if (dueMatch) fields.dueDate = dueMatch[1]!;

  // Start date
  const startMatch = text.match(/(?:开始|start)[是为:：]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[月/-]\d{1,2}(?:[日号])?)/);
  if (startMatch) fields.startDate = startMatch[1]!;

  // Work hours
  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:小时|个?钟|h|hours)/);
  if (hoursMatch) fields.workHours = hoursMatch[1]!;

  // Mood
  const moodMatch = text.match(/(😊|💪|🤔|😎|😤|🌴|🎨|🧐|😴|🤩)/);
  if (moodMatch) fields.mood = moodMatch[1]!;

  // Target ID for update/delete
  const idMatch = text.match(/(?:id|编号)[是为:：]?\s*(\S+)/);
  if (idMatch) fields.id = idMatch[1]!;

  // Color
  const colorMatch = text.match(/#([0-9A-Fa-f]{6})\b/);
  if (colorMatch) fields.color = "#" + colorMatch[1]!;

  return { action, entity, fields, raw: text, confidence: Math.min(confidence, 1) };
}

/** Generate a human-readable summary of what the AI understood */
export function explainCommand(cmd: ParsedCommand): string {
  const actionLabel = { create: "创建", update: "更新", delete: "删除", query: "查询", unknown: "" }[cmd.action];
  const entityLabel = { project: "项目", task: "任务", status: "状态记录" }[cmd.entity];

  if (cmd.confidence < 0.4) return "不太确定你想做什么，能再说详细一点吗？";
  if (cmd.action === "unknown") return `你想对${entityLabel}做什么操作？`;

  const parts: string[] = [];
  if (cmd.fields.title) parts.push(`名称："${cmd.fields.title}"`);
  if (cmd.fields.priority) parts.push(`优先级：${cmd.fields.priority}`);
  if (cmd.fields.status) parts.push(`状态：${cmd.fields.status}`);
  if (cmd.fields.tags) parts.push(`标签：${(cmd.fields.tags as string[]).join(", ")}`);
  if (cmd.fields.dueDate) parts.push(`截止：${cmd.fields.dueDate}`);
  if (cmd.fields.projectName) parts.push(`项目：${cmd.fields.projectName}`);
  if (cmd.fields.content) parts.push(`描述：${(cmd.fields.content as string).slice(0, 30)}`);
  if (cmd.fields.workHours) parts.push(`工时：${cmd.fields.workHours}h`);

  let summary = `理解为：${actionLabel}${entityLabel}`;
  if (parts.length > 0) summary += `，${parts.join("，")}`;
  return summary;
}
