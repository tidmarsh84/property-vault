// Offline migration applier: runs prisma/migrations/*/migration.sql in order
// against the SQLite DB and records them in _prisma_migrations, so a real
// `prisma migrate deploy` on an unrestricted machine sees a clean state.
import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";

const dbPath = process.env.SQLITE_PATH ?? "prisma/dev.db";
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "checksum" TEXT NOT NULL,
  "finished_at" DATETIME,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" DATETIME,
  "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
  "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
)`);

const dir = "prisma/migrations";
const applied = new Set(
  db.prepare(`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`).all().map(r => r.migration_name)
);
for (const name of readdirSync(dir).filter(d => /^\d/.test(d)).sort()) {
  if (applied.has(name)) { console.log(`skip  ${name}`); continue; }
  const sql = readFileSync(path.join(dir, name, "migration.sql"), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  db.exec(sql);
  db.prepare(`INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
              VALUES (?, ?, current_timestamp, ?, current_timestamp, 1)`).run(randomUUID(), checksum, name);
  console.log(`applied ${name}`);
}
console.log("done");
