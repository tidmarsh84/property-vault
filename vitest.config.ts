import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false, // tests share one SQLite test database
  },
});
