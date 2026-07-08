import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

// Resolve the database location. Override with NC_DB_PATH if desired.
const DB_PATH = process.env.NC_DB_PATH || path.join(process.cwd(), 'data', 'app.db');

function createConnection() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'editor',
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      slug       TEXT NOT NULL UNIQUE,
      status     TEXT NOT NULL DEFAULT 'draft',
      content    TEXT NOT NULL,
      version    INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tvs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      department   TEXT NOT NULL DEFAULT '',
      slug         TEXT NOT NULL UNIQUE,
      page_id      INTEGER,
      last_seen_at TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL
    );

    -- Playlist: a TV shows one or more pages, each for a dwell time, with an
    -- optional schedule (days-of-week + time window). Empty schedule = always.
    CREATE TABLE IF NOT EXISTS tv_pages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      tv_id      INTEGER NOT NULL,
      page_id    INTEGER NOT NULL,
      position   INTEGER NOT NULL DEFAULT 0,
      dwell_sec  INTEGER NOT NULL DEFAULT 60,
      days       TEXT NOT NULL DEFAULT '',   -- CSV of 0..6 (0=Sun); '' = every day
      start_min  INTEGER,                     -- minutes from midnight; NULL = no lower bound
      end_min    INTEGER,                     -- minutes from midnight; NULL = no upper bound
      FOREIGN KEY (tv_id) REFERENCES tvs(id) ON DELETE CASCADE,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tv_pages_tv ON tv_pages(tv_id, position);

    -- Brands / tenants. Each brand serves its TVs on its own public hostname.
    CREATE TABLE IF NOT EXISTS brands (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      slug       TEXT NOT NULL UNIQUE,
      hostname   TEXT NOT NULL DEFAULT '',   -- e.g. news.go4rex.com (used to build TV links)
      logo_url   TEXT NOT NULL DEFAULT '',   -- brand logo shown on screens + in admin
      created_at TEXT NOT NULL
    );
  `);

  // --- Additive column migrations (safe on existing databases) ---
  addColumn(db, 'users', 'department', "TEXT NOT NULL DEFAULT ''");
  addColumn(db, 'pages', 'department', "TEXT NOT NULL DEFAULT ''");
  addColumn(db, 'tvs', 'brand_id', 'INTEGER');
  addColumn(db, 'pages', 'brand_id', 'INTEGER');
  addColumn(db, 'brands', 'logo_url', "TEXT NOT NULL DEFAULT ''");

  // --- Backfill playlist from the legacy single-page assignment ---
  const legacy = db
    .prepare(
      `SELECT id, page_id FROM tvs
       WHERE page_id IS NOT NULL
         AND id NOT IN (SELECT DISTINCT tv_id FROM tv_pages)`
    )
    .all();
  const ins = db.prepare(
    `INSERT INTO tv_pages (tv_id, page_id, position, dwell_sec, days) VALUES (?, ?, 0, 60, '')`
  );
  for (const row of legacy) ins.run(row.id, row.page_id);
}

// Add a column only if it doesn't already exist.
function addColumn(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Cache the connection across module reloads (Next dev hot-reload safety).
const globalForDb = globalThis;
export const db = globalForDb.__ncDb || (globalForDb.__ncDb = createConnection());

export function nowIso() {
  return new Date().toISOString();
}
