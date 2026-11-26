import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "./src"),
    },
  },
  test: {
    environment: "jsdom",
    // Reuse one jsdom environment per worker instead of rebuilding it for
    // every file (24 files → 24 jsdom instances). vmThreads breaks
    // vi.stubGlobal("window"), so share the environment across tests instead.
    isolate: false,
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
  },
});
