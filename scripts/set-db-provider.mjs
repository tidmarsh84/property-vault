// Swaps the prisma datasource provider (sqlite <-> postgresql) and regenerates
// the client. Usage: node scripts/set-db-provider.mjs postgresql|sqlite
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const target = process.argv[2];
if (!["sqlite", "postgresql"].includes(target)) {
  console.error("Usage: node scripts/set-db-provider.mjs sqlite|postgresql");
  process.exit(1);
}
const path = "prisma/schema.prisma";
const schema = readFileSync(path, "utf8");
const updated = schema.replace(
  /provider = "(sqlite|postgresql)"/,
  `provider = "${target}"`
);
writeFileSync(path, updated);
execSync("npx prisma generate", {
  stdio: "inherit",
  env: { ...process.env, PRISMA_SCHEMA_ENGINE_BINARY: "/bin/true" },
});
console.log(`datasource provider set to ${target}, client regenerated`);
