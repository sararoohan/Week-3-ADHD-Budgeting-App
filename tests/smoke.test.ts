// Placeholder test — proves the Vitest harness is wired up and runs in CI.
//
// This exists only so the test step has something to run (and stay green) before
// the real money-logic suite arrives. The money test cases (ticket T-8) are
// authored test-first in Phase 1 and are the source of truth for NFR-3
// (see docs/definition-of-done.md). Replace/remove this once that suite lands.

import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
