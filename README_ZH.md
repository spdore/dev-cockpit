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

- **Node.js 18+**
- **Git**
- **Gemini API Key** — 在 [Google AI Studio](https://aistudio.google.com/apikey) 免费获取

#### 各平台编译依赖

`better-sqlite3` 是原生 C++ 模块，大多数情况下 `npm install` 会自动下载预编译二进制，无需额外操作。如果遇到编译错误：

| 平台 | 安装命令 |
|------|----------|
| **Linux (Debian/Ubuntu)** | `sudo apt install build-essential python3` |
| **Linux (Fedora/RHEL)** | `sudo dnf install gcc-c++ make python3` |
| **macOS** | `xcode-select --install` |
| **Windows** | 通常会自动下载预编译版本。如失败，安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)，勾选"使用 C++ 的桌面开发"工作负载。 |

### 安装与启动

```bash
git clone https://github.com/spdore/dev-cockpit.git
cd dev-cockpit
npm install
npm run dev
```

浏览器打开终端输出的地址（默认 **http://localhost:3000**），进入 **设置** 页面粘贴 Gemini API Key 即可启用 AI 功能。

> **注意**：如果 3000 端口被占用，Next.js 会自动切换到 3001，请以终端实际输出为准。无需手动创建 `.env` 文件，API Key 存储在本地数据库中。

数据库和所有表在首个 API 请求到达时自动创建。数据库从空开始，由你亲手构建。

### 数据库

数据库文件位于 `database/dev-cockpit.db`，已加入 `.gitignore`，不会提交到版本库。建表语句统一维护在 `database/schema.sql`，纳入 Git 追踪，确保任何人 clone 项目后都能获得一致的表结构。

- **重新开始**：删除 `database/dev-cockpit.db`，重启服务即可。
- **备份数据**：复制 `database/` 目录即可。

---

## 常见问题

### `better-sqlite3` 编译失败

先确认已安装对应平台的编译工具（见上方[各平台编译依赖](#各平台编译依赖)），然后重试：

```bash
npm rebuild better-sqlite3
```

### 连不上 localhost:3000

检查终端输出——如果 3000 端口被占用，Next.js 会打印提示 "using available port 3001 instead"，实际端口以终端为准。

### AI 功能不工作

- 确认 Gemini API Key 填写正确且有可用配额（在 [Google AI Studio](https://aistudio.google.com/apikey) 查看）。
- 在 **设置** 页面粘贴 Key 后务必点击保存。

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
│   ├── database/           # 数据库连接
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
| `database/schema.sql` | 数据库建表脚本，首个请求时自动执行 |

## 许可证

MIT
