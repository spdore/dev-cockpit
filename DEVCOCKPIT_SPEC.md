# DevCockpit Data Spec & AI Import Template

> **How to use**: Feed this file + your project description to any AI (Claude, GPT, Gemini). It will generate commands that DevCockpit AI can execute to auto-create projects and tasks. Paste the output into the DevCockpit AI chat.

> **使用方式**：将本文件 + 你的新项目描述一起发给任意 AI，它会生成 DevCockpit AI 助手可执行的命令序列。粘贴到 AI 对话框即可自动创建项目和任务。

---

## Data Model / 数据模型

### Project / 项目

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✅ | Project name / 项目名称 |
| description | string | ❌ | 1-3 sentence summary |
| color | string | ❌ | Hex color, e.g. `#8B5CF6`, default `#6B7280` |
| status | enum | ❌ | `active` / `maintaining` / `paused` / `planned` / `completed` |
| repoUrl | string | ❌ | Git repository URL |
| startDate | string | ❌ | `YYYY-MM-DD` |
| targetDate | string | ❌ | `YYYY-MM-DD` |

### Task / 任务

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | ✅ | Task title / 任务标题 |
| content | string | ❌ | Detailed description |
| projectId | string | ❌ | Project **name** (not ID) — auto-resolved by system |
| priority | enum | ❌ | `urgent` / `high` / `medium` / `low`, default `medium` |
| status | enum | ❌ | `inbox` / `todo` / `in_progress` / `review` / `done`, default `todo` |
| startDate | string | ❌ | `YYYY-MM-DD` |
| dueDate | string | ❌ | `YYYY-MM-DD` |
| tags | string[] | ❌ | e.g. `["bug", "frontend"]` |
| subtasks | object[] | ❌ | `[{title: string, done: boolean}]` |

### Milestone / 里程碑

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | ✅ | Milestone name |
| projectId | string | ✅ | Project name |
| targetDate | string | ✅ | `YYYY-MM-DD` |
| progress | number | ❌ | 0–100, default 0 |

### Daily Summary / 日报

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | ✅ | `YYYY-MM-DD` |
| content | string | ✅ | Work summary |
| workHours | number | ❌ | Hours worked |
| mood | string | ❌ | Emoji, e.g. `😊` |

---

## Enum Reference / 枚举速查

| Category | Values |
|----------|--------|
| Priority | `urgent` (紧急) / `high` (高) / `medium` (中) / `low` (低) |
| Task Status | `inbox` (收件箱) / `todo` (待开始) / `in_progress` (进行中) / `review` (审查中) / `done` (已完成) |
| Project Status | `active` (活跃) / `maintaining` (维护中) / `paused` (暂停) / `planned` (计划中) / `completed` (已完成) |
| Colors | `#8B5CF6` `#F97316` `#22C55E` `#3B82F6` `#EC4899` `#F59E0B` `#06B6D4` `#EF4444` `#14B8A6` `#6366F1` |

---

## AI Import Workflow / AI 导入流程

### Step 1: Write a project description

Describe your project in natural language — name, overview, current phase, timeline, and task breakdown.

### Step 2: Feed to external AI

Send this entire file + your project description to Claude / GPT / Gemini with:

> Based on the DevCockpit data spec, convert my project description into a sequence of DevCockpit AI commands. Output only the commands, one per line, in Chinese.

### Step 3: Paste into DevCockpit AI

Copy the generated commands and paste them into the DevCockpit AI chat page. The AI will parse and create confirmation cards — click "Execute" to save.

---

## Command Examples / 命令示例

```text
创建项目「MyApp」，描述是"移动端应用"，颜色用 #F97316，状态是计划中

为「MyApp」项目创建以下任务：
- 高优先级「用户认证模块」截止日期 2026-07-15 标签 auth,backend
- 中优先级「首页 UI」截止日期 2026-07-22 标签 frontend

为「MyApp」创建里程碑「MVP 发布」截止 2026-08-01

把「首页 UI」标记为进行中

查看所有高优先级任务
```

---

## Recommended Tags / 推荐标签

| Category | Tags |
|----------|------|
| Type | `feature` `bug` `refactor` `docs` `design` `testing` |
| Layer | `frontend` `backend` `devops` `database` `api` |
| Module | `auth` `payment` `ui` `perf` `security` `monitoring` |

---

## Notes / 注意事项

- AI matches projects by **name**, not ID — keep names consistent across commands
- Date format: `YYYY-MM-DD`. Relative dates ("next Friday") calculated from system time
- Multiple commands can be sent together — the AI batch-processes them
- Write operations generate confirmation cards; queries return results inline
