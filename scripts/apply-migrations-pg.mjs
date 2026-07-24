// Postgres migration applier — same contract as apply-migrations.mjs but for
// a postgres:// DATABASE_URL. Runs prisma/migrations-postgres/*/migration.sql
// in order and records them in _prisma_migrations.
import pg from "pg";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("postgres")) {
  console.error("Set DATABASE_URL to a postgres:// URL");
  process.exit(1);
}
const client = new pg.Client({ connectionString: url });
await client.connect();

await client.query(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "checksum" TEXT NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
)`);

const dir = "prisma/migrations-postgres";
const appliedRes = await client.query(
  `SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`
);
const applied = new Set(appliedRes.rows.map((r) => r.migration_name));

for (const name of readdirSync(dir).filter((d) => /^\d/.test(d)).sort()) {
  if (applied.has(name)) { console.log(`skip  ${name}`); continue; }
  const sql = readFileSync(path.join(dir, name, "migration.sql"), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
       VALUES ($1, $2, now(), $3, now(), 1)`,
      [randomUUID(), checksum, name]
    );
    await client.query("COMMIT");
    console.log(`applied ${name}`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}
await client.end();
console.log("done");
