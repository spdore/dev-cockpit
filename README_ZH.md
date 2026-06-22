# 🚀 DevCockpit — 个人开发者项目管理驾驶舱

面向独立开发者的 AI 驱动项目管理仪表盘。集任务追踪、项目规划、日历视图、日报日志和 Gemini AI 助手于一体，让效率可量化、进度可视化。

> **English Docs**: [README.md](./README.md)

---

## 功能

### 📊 驾驶舱首页
一屏掌握当日状态：
- **今日焦点** — 所有进行中的任务，支持拖拽排序、点击勾选完成
- **本周概览** — 完成数/进行中/待开始统计 + 进度环 + 项目活跃度
- **活动热力图** — 基于每日工时的连续绿色热力，无工时为浅灰
- **认知状态** — 本周每日工时柱状图 + 今日心情
- **成就系统** — 单日工时超 12h/16h/20h 自动解锁徽章

### 📁 项目管理
- 创建、编辑、归档项目，自定义颜色、状态标签、Git 仓库链接
- 项目详情页内联管理任务
- 完成率追踪和里程碑进度

### ✅ 任务管理
- 全生命周期：收件箱 → 待开始 → 进行中 → 审查中 → 已完成
- 优先级分级（紧急 / 高 / 中 / 低）颜色编码
- 子任务清单、标签分类、起止日期
- 按项目分组，可折叠展开

### 🤖 AI 助手
- 自然语言对话式 CRUD：创建 / 查询 / 更新 / 删除项目和任务
- 流式输出（逐 token 显示），无 JSON 技术文本泄露
- 写操作自动弹出确认卡片，查询结果直出无需多轮对话
- 首次对话自动总结标题
- 根据当前系统日期推算相对时间（"上周五""下周3"等）

### 📅 日历视图
- 年 / 月 / 周三视图切换
- 每日任务圆点 + 心情 emoji

### 📝 日报日志
- 每日工作总结 + 工时 + 心情
- 心情词云可视化
- 按月份筛选

### ⚡ 全局交互
- `⌘K` 命令面板：搜索、导航、快捷创建
- 点击状态徽章循环切换
- 拖拽排序

### 🌓 主题
- 浅色 / 深色 / 跟随系统，刷新无闪烁

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + Turbopack) |
| 语言 | TypeScript 5 |
| 界面 | React 19 + Tailwind CSS 4 + shadcn/ui |
| 数据库 | SQLite (better-sqlite3) |
| 数据获取 | SWR |
| 状态管理 | Zustand |
| AI | Google Gemini API (流式) |
| 拖拽 | @dnd-kit |
| 动效 | Framer Motion |
| 图标 | Lucide React |
| 测试 | Vitest + Testing Library |

---

## 快速开始

### 环境要求
- Node.js 18+
- Gemini API Key（用于 AI 功能，在 [Google AI Studio](https://aistudio.google.com/apikey) 免费获取）

### 安装

```bash
git clone https://github.com/your-username/dev-cockpit.git
cd dev-cockpit
npm install
```

### 配置

1. 启动开发服务器：
   ```bash
   npm run dev
   ```
2. 浏览器打开 `http://localhost:3000`
3. 进入 **设置** 页面 → 粘贴 Gemini API Key
4. 首次启动自动创建数据库并填充示例数据

### 重置数据库

```bash
node scripts/reset-db.js
```
清空所有业务数据，保留 API Key 和主题设置。

### Windows 一键启动
双击 `start.bat`，自动检查环境、安装依赖、启动服务。

---

## 项目结构

```
src/
├── app/                    # Next.js 页面与 API 路由
│   ├── dashboard/          # 仪表盘首页
│   ├── tasks/              # 任务列表与详情
│   ├── projects/           # 项目列表与详情
│   ├── calendar/           # 日历视图
│   ├── journal/            # 日报日志
│   ├── ai/                 # AI 对话界面
│   ├── settings/           # 系统设置
│   └── api/                # REST API
├── core/                   # 领域逻辑（框架无关）
│   ├── database/           # 数据库连接、建表、种子
│   ├── entities/           # 类型定义
│   ├── repositories/       # 数据访问层
│   └── services/           # 业务逻辑
├── shared/                 # 工具函数、常量、校验
├── components/             # React 组件
│   ├── dashboard/          # 仪表盘卡片
│   ├── layout/             # 布局组件
│   └── ui/                 # shadcn/ui 基础组件
├── hooks/                  # 自定义 Hook
├── stores/                 # Zustand 状态
└── test/                   # 测试
```

---

## NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm start` | 启动生产服务 |
| `npm test` | 运行测试 |
| `npm run lint` | 代码检查 |

---

## 仓库文件说明

| 文件 | 用途 |
|------|------|
| `README.md` | 英文文档 |
| `README_ZH.md` | 中文文档（本文件） |
| `DEVCOCKPIT_SPEC.md` | 数据结构规范 & AI 导入模板（中英双语） |
| `start.bat` | Windows 一键启动脚本 |
| `reset-db.bat` | Windows 数据库重置脚本 |
| `scripts/reset-db.js` | 跨平台数据库重置脚本 |

## 许可证

MIT
