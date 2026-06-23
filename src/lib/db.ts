import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "database", "dev-cockpit.db");
const SCHEMA_PATH = path.join(process.cwd(), "database", "schema.sql");

const globalForDb = globalThis as unknown as { _db: Database.Database };

export const db: Database.Database =
  globalForDb._db ??
  (() => {
    const database = new Database(DB_PATH);
    initFromSchemaFile(database);
    return database;
  })();

if (process.env.NODE_ENV !== "production") globalForDb._db = db;

/** Execute schema.sql — idempotent, safe for existing databases. */
function initFromSchemaFile(database: Database.Database) {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.warn("[DB] schema.sql not found, skipping schema init");
    return;
  }
  const sql = fs.readFileSync(SCHEMA_PATH, "utf-8");
  database.exec(sql);
}

// ── Helpers ──
export function parseTags(tags: string): string[] {
  try { return JSON.parse(tags); } catch { return []; }
}

export function parseSubtasks(subtasks: string | null): { title: string; done: boolean }[] {
  if (!subtasks) return [];
  try { return JSON.parse(subtasks); } catch { return []; }
}
