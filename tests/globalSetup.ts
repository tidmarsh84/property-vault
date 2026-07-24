// Push the schema into a throwaway sqlite db before the suite runs.

import { execSync } from "child_process";
import { rmSync } from "fs";
import { resolve } from "path";

export default function setup() {
  const dbPath = resolve(__dirname, "../prisma/test.db");
  rmSync(dbPath, { force: true });
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });
}
