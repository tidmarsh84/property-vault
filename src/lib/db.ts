import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 Rust-free client with a driver adapter, chosen by DATABASE_URL:
//   file:...       → SQLite via better-sqlite3 (dev default)
//   postgres://... → Postgres via pg (deployment)
// When switching to Postgres, also run: node scripts/set-db-provider.mjs postgresql
// (regenerates the client for the Postgres dialect) and use
// scripts/apply-migrations-pg.mjs for migrations. See DEPLOY.md.
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

function makeAdapter() {
  if (url.startsWith("postgres")) {
    return new PrismaPg({ connectionString: url });
  }
  return new PrismaBetterSqlite3({ url });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: makeAdapter(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
