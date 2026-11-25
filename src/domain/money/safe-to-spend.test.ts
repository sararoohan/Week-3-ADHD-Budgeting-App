// Robustness/edge tests for computeSafeToSpend that sit alongside — not inside — the
// T-8 spec mirror (t8-money-cases.test.ts). These lock behaviours surfaced in code
// review: available-now is "as of today," and an unresolved payment fails loudly.

import { describe, it, expect } from "vitest";
import { computeSafeToSpend } from "./safe-to-spend";
import type { SafeToSpendInput } from "./types";

function input(overrides: Partial<SafeToSpendInput> = {}): SafeToSpendInput {
  return {
    openingBalanceCents: 0,
    flexBufferCents: 0,
    deposits: [],
    spendingEntries: [],
    bills: [],
    billPayments: [],
    depositSchedule: null,
    asOfDate: "2026-06-15",
    ...overrides,
  };
}

describe("available-now is as of asOfDate", () => {
  it("ignores a deposit dated after today (not yet arrived)", () => {
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 10_000,
        asOfDate: "2026-06-15",
        deposits: [
          { amountCents: 5_000, depositDate: "2026-06-10" }, // arrived
          { amountCents: 9_000, depositDate: "2026-06-25" }, // future — excluded
        ],
      }),
    );
    expect(result.moneyInArrivedCents).toBe(5_000);
    expect(result.availableNowCents).toBe(15_000);
  });

  it("counts a deposit or purchase dated exactly today", () => {
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 10_000,
        asOfDate: "2026-06-15",
        deposits: [{ amountCents: 2_000, depositDate: "2026-06-15" }],
        spendingEntries: [{ amountCents: 1_000, entryDate: "2026-06-15", type: "purchase" }],
      }),
    );
    expect(result.availableNowCents).toBe(11_000); // 10,000 + 2,000 − 1,000
  });

  it("ignores a purchase dated after today", () => {
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 10_000,
        asOfDate: "2026-06-15",
        spendingEntries: [{ amountCents: 4_000, entryDate: "2026-06-20", type: "purchase" }],
      }),
    );
    expect(result.netSpendingCents).toBe(0);
    expect(result.availableNowCents).toBe(10_000);
  });
});

describe("fail loud on bad data", () => {
  it("throws when a bill payment references a bill not in the bills list", () => {
    expect(() =>
      computeSafeToSpend(
        input({
          openingBalanceCents: 10_000,
          bills: [], // the paid bill is missing
          billPayments: [{ billId: "ghost", dueDate: "2026-06-01" }],
        }),
      ),
    ).toThrow(/unknown bill/);
  });
});
