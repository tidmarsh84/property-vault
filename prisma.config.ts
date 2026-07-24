import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 config. The driver adapter makes the CLI run migrations through
// the WASM schema engine (no Rust binary download needed) and is also how
// the runtime client connects. DATABASE_URL keeps the Postgres switch:
// set it to a postgres:// URL and swap the adapter in src/lib/db.ts.
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  adapter: async () => new PrismaBetterSqlite3({ url }),
});
