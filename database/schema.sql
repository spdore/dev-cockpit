-- DevCockpit Database Schema
-- 首次启动时自动执行，所有表使用 IF NOT EXISTS，已有数据库不受影响
-- Executed automatically on first launch; safe to re-run on existing databases

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Projects ──
CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color       TEXT NOT NULL DEFAULT '#6B7280',
    status      TEXT NOT NULL DEFAULT 'active',
    repo_url    TEXT NOT NULL DEFAULT '',
    start_date  TEXT,
    target_date TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Tasks ──
CREATE TABLE IF NOT EXISTS tasks (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    content      TEXT NOT NULL DEFAULT '',
    project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    priority     TEXT NOT NULL DEFAULT 'medium',
    status       TEXT NOT NULL DEFAULT 'todo',
    start_date   TEXT,
    due_date     TEXT,
    tags         TEXT NOT NULL DEFAULT '[]',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    today_order  INTEGER,
    subtasks     TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id   ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- ── Milestones ──
CREATE TABLE IF NOT EXISTS milestones (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    target_date TEXT NOT NULL,
    progress    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);

-- ── Achievements ──
CREATE TABLE IF NOT EXISTS achievements (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    icon            TEXT NOT NULL DEFAULT '🏆',
    condition_type  TEXT NOT NULL,
    condition_value INTEGER NOT NULL DEFAULT 1,
    unlocked_at     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Daily Summaries ──
CREATE TABLE IF NOT EXISTS daily_summaries (
    id         TEXT PRIMARY KEY,
    date       TEXT NOT NULL UNIQUE,
    content    TEXT NOT NULL DEFAULT '',
    work_hours REAL NOT NULL DEFAULT 0,
    mood       TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── User Settings ──
CREATE TABLE IF NOT EXISTS user_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

-- ── AI Conversations ──
CREATE TABLE IF NOT EXISTS conversations (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL DEFAULT '新对话',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Chat Messages ──
CREATE TABLE IF NOT EXISTS chat_messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL DEFAULT 'default',
    role            TEXT NOT NULL,
    content         TEXT NOT NULL DEFAULT '',
    action          TEXT,
    executed        INTEGER NOT NULL DEFAULT 0,
    error           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at);
