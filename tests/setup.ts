import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Fresh test database per run, migrated with the same SQL the app uses.
process.env.DATABASE_URL = "file:./prisma/test.db";
process.env.INTEGRITY_SIGNING_KEY = "test-signing-key";
process.env.AUTH_SECRET = "test-auth-secret";
process.env.STORAGE_DIR = "./.test-storage";

for (const f of ["prisma/test.db", "prisma/test.db-wal", "prisma/test.db-shm"]) {
  try {
    rmSync(f);
  } catch {}
}
execSync("node scripts/apply-migrations.mjs", {
  env: { ...process.env, SQLITE_PATH: "prisma/test.db" },
  stdio: "ignore",
});
