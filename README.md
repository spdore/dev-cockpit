# 🚀 DevCockpit — Personal Developer Dashboard

An AI-powered project management cockpit built for solo developers. Track projects, tasks, and daily progress with a clean dashboard, calendar, journal, and built-in Gemini AI assistant.

> **中文文档**: [README_ZH.md](./README_ZH.md)

---

## Features

### 📊 Dashboard
A single-page overview of your day:
- **Today's Focus** — Active tasks with drag-and-drop reordering and one-click completion
- **Weekly Overview** — Completion stats with a progress ring and per-project activity bars
- **Activity Heatmap** — Continuous green intensity based on daily work hours
- **Cognitive Status** — Current week's work-hour bar chart with mood tracking
- **Achievements** — Auto-unlock badges for hitting daily work-hour milestones (12h / 16h / 20h)

### 📁 Project Management
- Create, edit, and archive projects with custom colors, status labels, and Git repo links
- View project details with inline task management
- Track completion rates and milestone progress

### ✅ Task Management
- Full task lifecycle: inbox → todo → in progress → review → done
- Priority levels (urgent / high / medium / low) with color coding
- Subtask checklists, tags, start/due dates
- Group tasks by project with collapsible sections

### 🤖 AI Assistant (Gemini)
- Natural language chat interface for CRUD operations
- Stream responses token-by-token (SSE)
- AI auto-generates confirmation cards for write operations
- Query results appear inline — no extra round-trips
- Auto-titles conversations based on first message
- Built-in date awareness for relative time ("last Friday", "next week")

### 📅 Calendar
- Year / Month / Week views with task dots and mood indicators
- Navigate between months, click to drill down

### 📝 Journal
- Daily summaries with work hours, mood emoji, and free-text notes
- Mood word cloud visualization
- Month-by-month navigation

### ⚡ Global Shortcuts
- `⌘K` — Command palette for search, navigation, and quick actions
- Click status badges to cycle through task states
- Drag-and-drop task reordering

### 🌓 Theme
- Light / Dark / System-following modes
- Instant switching with no flash on reload

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| Database | SQLite (better-sqlite3) |
| Data Fetching | SWR |
| State | Zustand |
| AI | Google Gemini API (streaming) |
| Drag & Drop | @dnd-kit |
| Animation | Framer Motion |
| Icons | Lucide React |
| Testing | Vitest + Testing Library |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Gemini API Key](https://aistudio.google.com/apikey) (for AI features)

### Installation

```bash
git clone https://github.com/your-username/dev-cockpit.git
cd dev-cockpit
npm install
```

### Configuration

1. Start the dev server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000`
3. Go to **Settings** → paste your Gemini API Key
4. The database auto-creates on first launch with demo data

### Reset Database

```bash
node scripts/reset-db.js
```
Clears all data while preserving your API key and settings.

### One-Click Start (Windows)
Double-click `start.bat` — it checks Node.js, installs dependencies, and starts the server.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── dashboard/          # Main dashboard
│   ├── tasks/              # Task list & detail
│   ├── projects/           # Project list & detail
│   ├── calendar/           # Calendar views
│   ├── journal/            # Daily journal
│   ├── ai/                 # AI chat interface
│   ├── settings/           # Settings page
│   └── api/                # REST API endpoints
├── core/                   # Domain logic (framework-agnostic)
│   ├── database/           # DB connection, schema, seed
│   ├── entities/           # TypeScript types & DTOs
│   ├── repositories/       # Data access layer
│   └── services/           # Business logic
├── shared/                 # Utilities, config, validation
├── components/             # React components
│   ├── dashboard/          # Dashboard widgets
│   ├── layout/             # App shell, sidebar, topbar
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
└── test/                   # Test suite
```

---

## NPM Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |

---

## Repository Files

| File | Purpose |
|------|---------|
| `README.md` | English documentation (this file) |
| `README_ZH.md` | Chinese documentation |
| `DEVCOCKPIT_SPEC.md` | Data model reference & AI import workflow (bilingual) |
| `start.bat` | Windows one-click launcher |
| `reset-db.bat` | Windows DB reset script |
| `scripts/reset-db.js` | Cross-platform DB reset script |

## License

MIT
