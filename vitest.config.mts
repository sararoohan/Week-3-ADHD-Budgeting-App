// Vitest configuration for the money/domain unit tests.
//
// Plain-language version: this tells the test runner WHERE the tests live and
// WHAT environment to run them in. The money rules are plain TypeScript (no
// browser, no React), so we use the fast "node" environment. When we build the
// money module in Phase 1, its test-first Vitest suite (ticket T-8) lands here.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure logic tests run in Node — no browser DOM needed (yet).
    environment: "node",
    // Collect any *.test.ts file under src/ (co-located with the code it tests)
    // or under a top-level tests/ folder.
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
