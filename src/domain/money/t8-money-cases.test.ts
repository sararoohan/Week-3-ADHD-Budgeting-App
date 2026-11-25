// T-8 money test cases — the Phase 1 "Prove the core" gate (NFR-3).
//
// SOURCE OF TRUTH: the "Money test cases (T-8.1)" table in the Technical Architecture
// spec's Quality Engineering Architecture section. This suite — not any repo markdown —
// is the authoritative encoding of those cases (ADR-0017, Definition of Done). Each
// `describe` below maps 1:1 to a row of that table, in order.
//
// Per TA-2, every case states its inputs, the date it is run on (`asOfDate`), and the
// exact expected amount in whole cents. Amounts are integer cents (ADR-0009); the math
// is computed, never stored (ADR-0010), in the pure module (ADR-0011).

import { describe, it, expect } from "vitest";
import { computeSafeToSpend, isValidAmountCents } from "./safe-to-spend";
import { nextPayday, occurrencesInRange } from "./calendar";
import type { SafeToSpendInput } from "./types";

/** Build a complete input with empty defaults; each case overrides only what it exercises. */
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

describe("Case 1 — a bill is due before the next payday", () => {
  it("takes the bill amount out of safe-to-spend", () => {
    // $1,000 on hand; payday is the 30th; a $200 bill is due the 20th (before payday).
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 100_000,
        asOfDate: "2026-06-15",
        depositSchedule: { frequency: "monthly", anchorDate: "2026-06-30" },
        bills: [{ id: "b1", amountCents: 20_000, frequency: "one_time", anchorDate: "2026-06-20" }],
      }),
    );
    expect(result.nextPayday).toBe("2026-06-30");
    expect(result.billsDueBeforePaydayCents).toBe(20_000);
    expect(result.availableNowCents).toBe(100_000);
    expect(result.safeToSpendCents).toBe(80_000);
  });
});

describe("Case 2 — a bill is due after the next payday", () => {
  it("does not take it out until the next pay period", () => {
    // Same $1,000 and payday the 30th, but the $200 bill is due July 5 (after payday).
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 100_000,
        asOfDate: "2026-06-15",
        depositSchedule: { frequency: "monthly", anchorDate: "2026-06-30" },
        bills: [{ id: "b1", amountCents: 20_000, frequency: "one_time", anchorDate: "2026-07-05" }],
      }),
    );
    expect(result.billsDueBeforePaydayCents).toBe(0);
    expect(result.safeToSpendCents).toBe(100_000);
  });
});

describe("Case 3 — a scheduled deposit is expected but hasn't arrived", () => {
  it("does not count it until it arrives (2.1.3)", () => {
    // Payday ($1,200) is scheduled for the 30th but no deposit row exists yet.
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 50_000,
        asOfDate: "2026-06-15",
        depositSchedule: { frequency: "monthly", anchorDate: "2026-06-30" },
        deposits: [], // nothing has actually arrived
      }),
    );
    expect(result.moneyInArrivedCents).toBe(0);
    expect(result.availableNowCents).toBe(50_000); // the expected $1,200 is NOT added
    expect(result.safeToSpendCents).toBe(50_000);
  });
});

describe("Case 4 — pay twice a month, every two weeks, monthly", () => {
  it("lands the next payday on the right date for each frequency", () => {
    expect(
      nextPayday({ frequency: "semimonthly", anchorDate: "2026-01-01", secondDay: 15 }, "2026-01-02"),
    ).toBe("2026-01-15");
    expect(nextPayday({ frequency: "biweekly", anchorDate: "2026-01-01" }, "2026-01-20")).toBe(
      "2026-01-29",
    );
    expect(nextPayday({ frequency: "monthly", anchorDate: "2026-03-31" }, "2026-04-01")).toBe(
      "2026-04-30",
    );
  });
});

describe("Case 5 — a bill due on the 31st in a 30-day month or February", () => {
  it("falls on the month's last day while the saved day stays 31", () => {
    // Saved day 31: Feb → 28 (29 in a leap year), Apr → 30, but 31-day months stay the 31st.
    expect(
      occurrencesInRange({ frequency: "monthly", anchorDate: "2026-01-31" }, "2026-01-01", "2026-05-01"),
    ).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
    expect(
      occurrencesInRange({ frequency: "monthly", anchorDate: "2024-01-31" }, "2024-02-01", "2024-03-01"),
    ).toEqual(["2024-02-29"]); // leap February
  });
});

describe("Case 6 — a schedule changes", () => {
  it("moves every future date while past payments stay", () => {
    // Future dates are always recomputed from the current schedule, so changing the
    // anchor moves them; already-recorded facts (bill_payments) are historical inputs.
    const oldSchedule = { frequency: "monthly", anchorDate: "2026-06-01" } as const;
    const newSchedule = { frequency: "monthly", anchorDate: "2026-06-05" } as const;
    expect(nextPayday(oldSchedule, "2026-06-02")).toBe("2026-07-01");
    expect(nextPayday(newSchedule, "2026-06-02")).toBe("2026-06-05"); // future date moved

    // A bill paid in the past stays counted (in net spending) regardless of the schedule.
    const base = {
      openingBalanceCents: 100_000,
      asOfDate: "2026-06-02",
      bills: [{ id: "b1", amountCents: 7_500, frequency: "monthly" as const, anchorDate: "2026-05-20" }],
      billPayments: [{ billId: "b1", dueDate: "2026-05-20" }], // historical, already paid
    };
    const withOld = computeSafeToSpend(input({ ...base, depositSchedule: oldSchedule }));
    const withNew = computeSafeToSpend(input({ ...base, depositSchedule: newSchedule }));
    expect(withOld.netSpendingCents).toBe(7_500);
    expect(withNew.netSpendingCents).toBe(7_500); // past payment unchanged by the schedule change
    expect(withOld.availableNowCents).toBe(92_500);
  });
});

describe("Case 7 — spending more than is safe", () => {
  it("shows a negative amount plainly, never hidden (6.2.4)", () => {
    // $100 on hand, $300 spent → available and safe-to-spend go negative.
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 10_000,
        spendingEntries: [{ amountCents: 30_000, entryDate: "2026-06-10", type: "purchase" }],
      }),
    );
    expect(result.availableNowCents).toBe(-20_000);
    expect(result.safeToSpendCents).toBe(-20_000); // returned as-is, not clamped to zero
  });
});

describe("Case 8 — the user's time zone is far from UTC", () => {
  it("lands paydays and due dates on the user's calendar day (T-4.2.3)", () => {
    // The module works purely from the LOCAL calendar date it is given; the UTC→local
    // conversion is the boundary's job (ADR-0027), so no date is ever shifted a day.
    // A payday saved for Dec 31 stays Dec 31, not Jan 1 or Dec 30.
    expect(nextPayday({ frequency: "monthly", anchorDate: "2026-12-31" }, "2026-12-30")).toBe(
      "2026-12-31",
    );
    // A user whose local "today" is already Jan 1 gets the next occurrence after it.
    expect(nextPayday({ frequency: "monthly", anchorDate: "2026-12-31" }, "2027-01-01")).toBe(
      "2027-01-31",
    );
    // A bill due on the user's local day is treated as due today (included in the window).
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 50_000,
        asOfDate: "2026-12-31",
        depositSchedule: { frequency: "monthly", anchorDate: "2027-01-15" },
        bills: [{ id: "b1", amountCents: 5_000, frequency: "one_time", anchorDate: "2026-12-31" }],
      }),
    );
    expect(result.billsDueBeforePaydayCents).toBe(5_000);
  });
});

describe("Case 9 — a flexible spending allowance is set", () => {
  it("takes the buffer out of safe-to-spend, and purchases draw it down", () => {
    // $1,000 on hand, $200 buffer kept in reserve.
    const noPurchase = computeSafeToSpend(
      input({ openingBalanceCents: 100_000, flexBufferCents: 20_000 }),
    );
    expect(noPurchase.safeToSpendCents).toBe(80_000); // 100,000 − 20,000 buffer

    const withPurchase = computeSafeToSpend(
      input({
        openingBalanceCents: 100_000,
        flexBufferCents: 20_000,
        spendingEntries: [{ amountCents: 5_000, entryDate: "2026-06-10", type: "purchase" }],
      }),
    );
    expect(withPurchase.availableNowCents).toBe(95_000);
    expect(withPurchase.safeToSpendCents).toBe(75_000); // the $50 purchase drew safe-to-spend down
  });
});

describe("Case 10 — amounts in cents", () => {
  it("totals match to the cent with no rounding drift", () => {
    // Values chosen to drift under floating-dollar math; whole cents stay exact.
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 1_000,
        spendingEntries: [
          { amountCents: 333, entryDate: "2026-06-01", type: "purchase" },
          { amountCents: 333, entryDate: "2026-06-02", type: "purchase" },
          { amountCents: 333, entryDate: "2026-06-03", type: "purchase" },
        ],
      }),
    );
    expect(result.netSpendingCents).toBe(999);
    expect(result.availableNowCents).toBe(1); // exactly one cent, no 0.999... drift
    expect(Number.isInteger(result.safeToSpendCents)).toBe(true);
  });
});

describe("Case 11 — a spending entry is edited (amount, date or note)", () => {
  it("reflects the change in safe-to-spend and keeps amounts above zero in whole cents (FR-34)", () => {
    const before = computeSafeToSpend(
      input({
        openingBalanceCents: 10_000,
        spendingEntries: [{ id: "s1", amountCents: 5_000, entryDate: "2026-06-10", type: "purchase" }],
      }),
    );
    expect(before.safeToSpendCents).toBe(5_000);

    // Edit the same entry's amount from $50 to $70: recompute reflects it.
    const after = computeSafeToSpend(
      input({
        openingBalanceCents: 10_000,
        spendingEntries: [{ id: "s1", amountCents: 7_000, entryDate: "2026-06-10", type: "purchase" }],
      }),
    );
    expect(after.safeToSpendCents).toBe(3_000);

    // The edited amount must stay a whole number of cents above zero.
    expect(isValidAmountCents(7_000)).toBe(true);
    expect(isValidAmountCents(0)).toBe(false);
    expect(isValidAmountCents(-1)).toBe(false);
    expect(isValidAmountCents(12.5)).toBe(false);
  });
});

describe("Case 12 — a spending entry is deleted, then undone", () => {
  it("removes it and updates safe-to-spend; undo restores the entry and amount (FR-35)", () => {
    // The Undo mechanism itself is in-memory UI (ADR-0019); the pure module just
    // recomputes from whichever entry set it is given.
    const present = computeSafeToSpend(
      input({
        openingBalanceCents: 10_000,
        spendingEntries: [{ id: "s1", amountCents: 3_000, entryDate: "2026-06-10", type: "purchase" }],
      }),
    );
    expect(present.availableNowCents).toBe(7_000);

    const deleted = computeSafeToSpend(input({ openingBalanceCents: 10_000, spendingEntries: [] }));
    expect(deleted.availableNowCents).toBe(10_000); // entry gone

    const undone = computeSafeToSpend(
      input({
        openingBalanceCents: 10_000,
        spendingEntries: [{ id: "s1", amountCents: 3_000, entryDate: "2026-06-10", type: "purchase" }],
      }),
    );
    expect(undone.availableNowCents).toBe(7_000); // restored with its amount
  });
});

describe("Case 13 — a refund is recorded as money back", () => {
  it("reduces net spending, never sets a payday, and can link to the purchase (FR-36)", () => {
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 20_000,
        spendingEntries: [
          { id: "p1", amountCents: 5_000, entryDate: "2026-06-05", type: "purchase" },
          { id: "r1", amountCents: 2_000, entryDate: "2026-06-08", type: "refund", refundsEntryId: "p1" },
        ],
      }),
    );
    expect(result.netSpendingCents).toBe(3_000); // 5,000 purchase − 2,000 money back
    expect(result.availableNowCents).toBe(17_000);
    expect(result.moneyInArrivedCents).toBe(0); // a refund is NOT a deposit
    expect(result.nextPayday).toBeNull(); // and never sets a payday
  });
});

describe("Case 14 — an opening balance is set at setup", () => {
  it("is the starting point of safe-to-spend (FR-37)", () => {
    // available = opening balance + money in arrived − net spending
    const bare = computeSafeToSpend(input({ openingBalanceCents: 50_000 }));
    expect(bare.safeToSpendCents).toBe(50_000);

    const withActivity = computeSafeToSpend(
      input({
        openingBalanceCents: 50_000,
        deposits: [{ amountCents: 10_000, depositDate: "2026-06-10" }],
        spendingEntries: [{ amountCents: 3_000, entryDate: "2026-06-11", type: "purchase" }],
      }),
    );
    expect(withActivity.availableNowCents).toBe(57_000); // 50,000 + 10,000 − 3,000
  });
});

describe("Case 15 — a one-off deposit (money in, no schedule)", () => {
  it("raises available-now immediately and sets no payday (ADR-0020)", () => {
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 0,
        deposits: [{ amountCents: 15_000, depositDate: "2026-06-12", scheduleId: null }],
        depositSchedule: null,
      }),
    );
    expect(result.moneyInArrivedCents).toBe(15_000);
    expect(result.availableNowCents).toBe(15_000);
    expect(result.nextPayday).toBeNull(); // only a scheduled deposit sets a payday
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JUDGMENT EXTENSION (beyond the literal 15 rows): an *overdue* unpaid bill.
// The T-8 table says a bill "due before the next payday" is set aside; an overdue
// unpaid bill (due date already in the past) is still due before the next payday
// and is still a real claim on the user's money, so it must be set aside too —
// otherwise safe-to-spend reads falsely high (the cardinal trust-breaker). The
// window is therefore every UNPAID occurrence due before next payday, including
// overdue, with no "today" floor. Flagged to the QA/spec side for a possible new row.
// ─────────────────────────────────────────────────────────────────────────────
describe("Case 16 (extension) — an overdue unpaid bill", () => {
  it("is still set aside, so safe-to-spend does not read high", () => {
    // $500 on hand; $200 rent was due the 1st, it's the 5th and still unpaid.
    const result = computeSafeToSpend(
      input({
        openingBalanceCents: 50_000,
        asOfDate: "2026-06-05",
        depositSchedule: { frequency: "monthly", anchorDate: "2026-06-30" },
        bills: [{ id: "rent", amountCents: 20_000, frequency: "one_time", anchorDate: "2026-06-01" }],
        billPayments: [], // not yet paid
      }),
    );
    expect(result.billsDueBeforePaydayCents).toBe(20_000); // overdue bill still set aside
    expect(result.availableNowCents).toBe(50_000);
    expect(result.safeToSpendCents).toBe(30_000); // $500 − $200, not $500
  });
});
