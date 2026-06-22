import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "dev-cockpit.db");

const globalForDb = globalThis as unknown as { _db: Database.Database };

export const db: Database.Database =
  globalForDb._db ??
  (() => {
    const database = new Database(DB_PATH);
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    initSchema(database);
    return database;
  })();

if (process.env.NODE_ENV !== "production") globalForDb._db = db;

function initSchema(database: Database.Database) {
  database.exec(`
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

    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      content     TEXT NOT NULL DEFAULT '',
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      priority    TEXT NOT NULL DEFAULT 'medium',
      status      TEXT NOT NULL DEFAULT 'todo',
      start_date  TEXT,
      due_date    TEXT,
      tags        TEXT NOT NULL DEFAULT '[]',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      today_order INTEGER,
      subtasks    TEXT
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      target_date TEXT NOT NULL,
      progress    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS daily_summaries (
      id         TEXT PRIMARY KEY,
      date       TEXT NOT NULL UNIQUE,
      content    TEXT NOT NULL DEFAULT '',
      work_hours REAL NOT NULL DEFAULT 0,
      mood       TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
    CREATE TABLE IF NOT EXISTS user_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL DEFAULT '新对话',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
    CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
  `);

  // Migrations
  try { database.exec("ALTER TABLE chat_messages ADD COLUMN conversation_id TEXT NOT NULL DEFAULT 'default'"); } catch {}
  const migrations = [
    "ALTER TABLE projects ADD COLUMN description TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN repo_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE projects ADD COLUMN start_date TEXT",
    "ALTER TABLE projects ADD COLUMN target_date TEXT",
    "ALTER TABLE tasks ADD COLUMN content TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE tasks ADD COLUMN start_date TEXT",
    "ALTER TABLE tasks ADD COLUMN due_date TEXT",
  ];
  for (const sql of migrations) {
    try { database.exec(sql); } catch { /* column exists */ }
  }

}

// ── Helpers ──
export function parseTags(tags: string): string[] {
  try { return JSON.parse(tags); } catch { return []; }
}

export function parseSubtasks(subtasks: string | null): { title: string; done: boolean }[] {
  if (!subtasks) return [];
  try { return JSON.parse(subtasks); } catch { return []; }
}
