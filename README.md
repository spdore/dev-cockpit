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

- **Node.js 18+**
- **Git**
- **Gemini API Key** — free at [Google AI Studio](https://aistudio.google.com/apikey)

#### Platform-specific build tools

`better-sqlite3` is a native C++ module. Most systems have prebuilt binaries and `npm install` just works, but if you hit a compilation error:

| Platform | Install |
|----------|---------|
| **Linux (Debian/Ubuntu)** | `sudo apt install build-essential python3` |
| **Linux (Fedora/RHEL)** | `sudo dnf install gcc-c++ make python3` |
| **macOS** | `xcode-select --install` |
| **Windows** | Prebuilt binaries are usually downloaded automatically. If not, install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) with the "Desktop development with C++" workload. |

### Install & Run

```bash
git clone https://github.com/spdore/dev-cockpit.git
cd dev-cockpit
npm install
npm run dev
```

Open the URL printed in the terminal (default **http://localhost:3000**), go to **Settings**, and paste your Gemini API Key to enable AI features.

> **Note**: If port 3000 is already in use, Next.js will silently switch to 3001. Always check the terminal output for the actual address. You do **not** need to create a `.env` file — the API key is stored in your local database.

The database and all tables are automatically created when the first API request arrives. The database starts empty — you build it your way from day one.

### Database

The database file lives at `database/dev-cockpit.db` and is ignored by Git. The schema is defined in `database/schema.sql` — tracked in version control so every clone gets the same table structure.

- To **start fresh**, delete `database/dev-cockpit.db` and restart the server.
- To **back up**, copy the `database/` folder.

---

## Troubleshooting

### `better-sqlite3` fails to compile

See the [platform-specific build tools](#platform-specific-build-tools) section above. Make sure your C++ toolchain is installed, then retry:

```bash
npm rebuild better-sqlite3
```

### Can't connect to localhost:3000

Check the terminal — if port 3000 was busy, Next.js prints the fallback port (e.g. "using available port 3001 instead").

### AI features not working

- Verify your Gemini API Key is correct and has available quota at [Google AI Studio](https://aistudio.google.com/apikey).
- Make sure the key is saved in **Settings** (not just pasted — click Save).

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
│   ├── database/           # DB connection
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
| `database/schema.sql` | Database schema — auto-executed on first request |

## License

MIT
