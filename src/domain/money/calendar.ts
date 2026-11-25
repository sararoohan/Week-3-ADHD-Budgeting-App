// Pure calendar-date math (ADR-0027): ISO `YYYY-MM-DD` strings only, no `new Date()`,
// no time-zone math. Deterministic and machine-independent so the money tests are a
// trustworthy Phase 1 gate (ADR-0011, ADR-0017).

import type { CalendarDate, RecurringSchedule } from "./types";

/** A calendar date broken into its parts. */
export interface DateParts {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SAFETY_CAP = 10_000; // bounds occurrence iteration; far beyond any MVP horizon

/** True for a leap year (proleptic Gregorian). */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Number of days in a given month (1–12) of a given year. */
export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

/** Parse `YYYY-MM-DD` into parts. Throws on a malformed or impossible date. */
export function parseISO(iso: CalendarDate): DateParts {
  const match = ISO_RE.exec(iso);
  if (!match) {
    throw new Error(`Invalid calendar date: ${iso}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in ${iso}`);
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`Invalid day in ${iso}`);
  }
  return { year, month, day };
}

/** Format parts back to `YYYY-MM-DD` (zero-padded). */
export function formatISO(parts: DateParts): CalendarDate {
  const y = String(parts.year).padStart(4, "0");
  const m = String(parts.month).padStart(2, "0");
  const d = String(parts.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Chronological comparison of two ISO dates: -1, 0, or 1. */
export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  const da = toDayNumber(parseISO(a));
  const db = toDayNumber(parseISO(b));
  if (da < db) return -1;
  if (da > db) return 1;
  return 0;
}

// --- Integer day-number conversion (Howard Hinnant's days_from_civil / civil_from_days).
// Serial day count for the proleptic Gregorian calendar, pure integer math, no `Date`.

function toDayNumber({ year, month, day }: DateParts): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor((y >= 0 ? y : y - 399) / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (month > 2 ? month - 3 : month + 9) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function fromDayNumber(dayNumber: number): DateParts {
  const z = dayNumber + 719468;
  const era = Math.floor((z >= 0 ? z : z - 146096) / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: month <= 2 ? y + 1 : y, month, day };
}

/** Add (or subtract) whole days, rolling over months and years correctly. */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  return formatISO(fromDayNumber(toDayNumber(parseISO(date)) + days));
}

/**
 * Add whole months, clamping to the month's last day when it is shorter, while
 * preserving `savedDay` for future steps (so the 31st runs 31 → Feb 28 → Mar 31).
 * `savedDay` defaults to the input date's day-of-month.
 */
export function addMonthsClamped(
  date: CalendarDate,
  months: number,
  savedDay?: number,
): CalendarDate {
  const parts = parseISO(date);
  const keepDay = savedDay ?? parts.day;
  const monthIndex = parts.year * 12 + (parts.month - 1) + months;
  const year = Math.floor(monthIndex / 12);
  const month = (((monthIndex % 12) + 12) % 12) + 1;
  const day = Math.min(keepDay, daysInMonth(year, month));
  return formatISO({ year, month, day });
}

/**
 * Ascending occurrences of a schedule, starting at (and never before) its anchor.
 * Infinite for recurring frequencies — callers bound consumption by date and the cap.
 */
function* occurrenceSeq(schedule: RecurringSchedule): Generator<CalendarDate> {
  const { frequency, anchorDate, secondDay } = schedule;

  if (frequency === "one_time") {
    yield anchorDate;
    return;
  }

  if (frequency === "weekly" || frequency === "biweekly") {
    const step = frequency === "weekly" ? 7 : 14;
    let current = anchorDate;
    while (true) {
      yield current;
      current = addDays(current, step);
    }
  }

  if (frequency === "monthly") {
    const { day } = parseISO(anchorDate);
    let k = 0;
    while (true) {
      yield addMonthsClamped(anchorDate, k, day);
      k += 1;
    }
  }

  if (frequency === "semimonthly") {
    if (secondDay == null) {
      throw new Error("semimonthly schedule requires secondDay");
    }
    const { day: firstDay } = parseISO(anchorDate);
    const lo = Math.min(firstDay, secondDay);
    const hi = Math.max(firstDay, secondDay);
    let k = 0;
    while (true) {
      const firstOfMonth = addMonthsClamped(anchorDate, k, 1);
      const { year, month } = parseISO(firstOfMonth);
      const dim = daysInMonth(year, month);
      // Clamp each day to the month and dedupe, so a collision (e.g. 15 & 15, or
      // 30 & 31 both clamping to Feb 28) yields the day once, never twice.
      const days = Array.from(new Set([Math.min(lo, dim), Math.min(hi, dim)])).sort(
        (a, b) => a - b,
      );
      for (const day of days) {
        const occ = formatISO({ year, month, day });
        // Never emit an occurrence before the anchor (a low day in the anchor's own month).
        if (compareCalendarDates(occ, anchorDate) >= 0) {
          yield occ;
        }
      }
      k += 1;
    }
  }

  throw new Error(`Unknown frequency: ${frequency}`);
}

/**
 * All occurrences of a schedule in the half-open range [startInclusive, endExclusive),
 * in ascending order.
 */
export function occurrencesInRange(
  schedule: RecurringSchedule,
  startInclusive: CalendarDate,
  endExclusive: CalendarDate,
): CalendarDate[] {
  const result: CalendarDate[] = [];
  let count = 0;
  for (const occ of occurrenceSeq(schedule)) {
    count += 1;
    if (count > SAFETY_CAP) break;
    if (compareCalendarDates(occ, endExclusive) >= 0) break; // ascending: past the window
    if (compareCalendarDates(occ, startInclusive) >= 0) {
      result.push(occ);
    }
  }
  return result;
}

/**
 * The next scheduled occurrence strictly after `asOfDate` ("the next upcoming payday"),
 * or null when there is no schedule or the schedule is `one_time`. Only a *recurring*
 * deposit drives the payday window (ADR-0020); a one-time schedule sets no payday.
 * (A one-time *bill* still has its occurrence — that goes through occurrencesInRange,
 * not this function.)
 */
export function nextPayday(
  schedule: RecurringSchedule | null,
  asOfDate: CalendarDate,
): CalendarDate | null {
  if (!schedule || schedule.frequency === "one_time") return null;
  let count = 0;
  for (const occ of occurrenceSeq(schedule)) {
    count += 1;
    if (count > SAFETY_CAP) break;
    if (compareCalendarDates(occ, asOfDate) > 0) {
      return occ;
    }
  }
  return null;
}
