// Unit tests for the pure calendar-date engine (ADR-0027).
// These primitives underpin the T-8 money cases (see t8-money-cases.test.ts): the
// next-payday dates, the month-end clamp, and schedule changes all rest on them.
// Every case states its inputs and the exact expected ISO date — no `new Date()`.

import { describe, it, expect } from "vitest";
import {
  parseISO,
  formatISO,
  compareCalendarDates,
  isLeapYear,
  daysInMonth,
  addDays,
  addMonthsClamped,
  nextPayday,
  occurrencesInRange,
} from "./calendar";

describe("parseISO / formatISO", () => {
  it("round-trips a valid date", () => {
    expect(parseISO("2026-06-15")).toEqual({ year: 2026, month: 6, day: 15 });
    expect(formatISO({ year: 2026, month: 6, day: 15 })).toBe("2026-06-15");
  });

  it("zero-pads single-digit months and days", () => {
    expect(formatISO({ year: 2026, month: 1, day: 3 })).toBe("2026-01-03");
  });

  it("rejects a malformed or impossible date", () => {
    expect(() => parseISO("2026-13-01")).toThrow();
    expect(() => parseISO("2026-02-30")).toThrow();
    expect(() => parseISO("not-a-date")).toThrow();
  });
});

describe("compareCalendarDates", () => {
  it("orders dates chronologically", () => {
    expect(compareCalendarDates("2026-01-01", "2026-12-31")).toBe(-1);
    expect(compareCalendarDates("2026-06-15", "2026-06-15")).toBe(0);
    expect(compareCalendarDates("2027-01-01", "2026-12-31")).toBe(1);
  });
});

describe("isLeapYear / daysInMonth", () => {
  it("knows leap years", () => {
    expect(isLeapYear(2024)).toBe(true); // divisible by 4
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true); // divisible by 400
    expect(isLeapYear(1900)).toBe(false); // divisible by 100, not 400
  });

  it("returns the right month lengths", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe("addDays", () => {
  it("rolls over a month boundary", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("rolls into a leap day", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("rolls over a year boundary and steps by weeks", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-01-01", 14)).toBe("2026-01-15");
  });

  it("subtracts days with a negative count", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("addMonthsClamped (month-end clamp with a preserved saved day)", () => {
  it("clamps the 31st to a shorter month's last day", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsClamped("2024-01-31", 1)).toBe("2024-02-29"); // leap
    expect(addMonthsClamped("2026-01-31", 3)).toBe("2026-04-30");
  });

  it("preserves the saved day of 31 across a short month", () => {
    // From Feb 28, stepping one month must land on Mar 31, not Mar 28 — the
    // saved day (31) is retained, not the clamped value.
    expect(addMonthsClamped("2026-02-28", 1, 31)).toBe("2026-03-31");
  });
});

describe("nextPayday (next occurrence strictly after asOf)", () => {
  it("monthly, clamped at month end", () => {
    expect(
      nextPayday({ frequency: "monthly", anchorDate: "2026-01-31" }, "2026-02-10"),
    ).toBe("2026-02-28");
  });

  it("every two weeks (biweekly)", () => {
    expect(
      nextPayday({ frequency: "biweekly", anchorDate: "2026-01-01" }, "2026-01-20"),
    ).toBe("2026-01-29"); // Jan 1, 15, 29 → first after Jan 20
  });

  it("twice a month (semimonthly)", () => {
    expect(
      nextPayday(
        { frequency: "semimonthly", anchorDate: "2026-01-01", secondDay: 15 },
        "2026-01-01",
      ),
    ).toBe("2026-01-15"); // Jan 1, 15, Feb 1, 15 → first strictly after Jan 1
  });

  it("weekly", () => {
    expect(
      nextPayday({ frequency: "weekly", anchorDate: "2026-03-02" }, "2026-03-02"),
    ).toBe("2026-03-09");
  });

  it("returns null when there is no schedule", () => {
    expect(nextPayday(null, "2026-06-15")).toBeNull();
  });

  it("returns null for a one_time schedule — only a recurring deposit sets a payday (ADR-0020)", () => {
    expect(nextPayday({ frequency: "one_time", anchorDate: "2026-12-01" }, "2026-11-01")).toBeNull();
  });
});

describe("occurrencesInRange (half-open [start, end))", () => {
  it("lists a monthly bill's due dates, clamping each month end", () => {
    // A bill saved for the 31st: the saved day stays 31, so 31-day months are
    // due on the 31st and short months on their last day (T-8 case 5).
    expect(
      occurrencesInRange(
        { frequency: "monthly", anchorDate: "2026-01-31" },
        "2026-01-01",
        "2026-05-01",
      ),
    ).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("excludes the end bound and includes the start bound", () => {
    expect(
      occurrencesInRange(
        { frequency: "monthly", anchorDate: "2026-06-30" },
        "2026-06-30",
        "2026-07-30",
      ),
    ).toEqual(["2026-06-30"]); // Jul 30 is the exclusive end, so only Jun 30
  });

  it("does not emit a semimonthly occurrence twice when its two days collide", () => {
    // Both days are the 15th: one occurrence per month, not two.
    expect(
      occurrencesInRange(
        { frequency: "semimonthly", anchorDate: "2026-01-15", secondDay: 15 },
        "2026-01-01",
        "2026-03-01",
      ),
    ).toEqual(["2026-01-15", "2026-02-15"]);
    // Days 30 and 31 both clamp to Feb 28: one occurrence that month, not two.
    expect(
      occurrencesInRange(
        { frequency: "semimonthly", anchorDate: "2026-02-28", secondDay: 30 },
        "2026-02-01",
        "2026-03-01",
      ),
    ).toEqual(["2026-02-28"]);
  });
});
