/**
 * Database connection — bridges to the shared better-sqlite3 instance.
 */
import { db } from "@/lib/db";
import type Database from "better-sqlite3";

export function getDb(): Database.Database {
  return db;
}
