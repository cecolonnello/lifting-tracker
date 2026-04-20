/**
 * SQLite database using Node's built-in node:sqlite module (stable in Node 23+,
 * available as experimental from Node 22.5).  No native compilation required.
 */

import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH ?? './data/lifting.db';

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// node:sqlite ships inside Node 22.5+ — no install required
// tsx strips types so the import works even if @types/node lags behind
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => DB;
};

// Minimal typing shim so the rest of the codebase stays strongly typed
export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface Statement {
  run(...args: unknown[]): RunResult;
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
}

interface DB {
  exec(sql: string): void;
  prepare(sql: string): Statement;
}

const db: DB = new DatabaseSync(DB_PATH);

// Performance pragmas (exec, not pragma())
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS workouts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise   TEXT    NOT NULL,
    weight     REAL    NOT NULL CHECK (weight > 0),
    reps       INTEGER NOT NULL CHECK (reps > 0),
    one_rm     REAL    NOT NULL,
    date       TEXT    NOT NULL,
    notes      TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_workouts_exercise ON workouts (exercise);
  CREATE INDEX IF NOT EXISTS idx_workouts_date     ON workouts (date);

  CREATE TABLE IF NOT EXISTS goals (
    exercise   TEXT PRIMARY KEY,
    goal_one_rm REAL NOT NULL CHECK (goal_one_rm > 0),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
