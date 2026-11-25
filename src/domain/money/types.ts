// Money / domain module — shared types (ADR-0011, ADR-0009, ADR-0013, ADR-0020, ADR-0027).
//
// This module is PURE: no React, no Supabase, no database, no `new Date()` for
// calendar logic (ADR-0027). Every amount is whole integer cents (ADR-0009).
// Every calendar date is an ISO `YYYY-MM-DD` string in the USER'S LOCAL calendar
// day — the UTC→local conversion happens at the server/data boundary before these
// functions are called (ADR-0027), never inside the module.

/** An ISO calendar date, `YYYY-MM-DD`, with no time and no time zone. */
export type CalendarDate = string;

/** The fixed set of recurrence frequencies for MVP #1 (ADR-0022). */
export type Frequency =
  | "one_time"
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly";

/**
 * A repeating schedule shared by deposit_schedules and bills (ADR-0022).
 * `anchorDate` is the reference date every future occurrence is calculated from;
 * no "next date" is ever stored (ADR-0010). `secondDay` is used only by
 * `semimonthly` (the second day-of-month, e.g. the 15th).
 */
export interface RecurringSchedule {
  frequency: Frequency;
  anchorDate: CalendarDate;
  secondDay?: number;
}

/** A money-in arrival (deposits table). `scheduleId` null/absent = a one-off (ADR-0020). */
export interface DepositInput {
  amountCents: number;
  depositDate: CalendarDate;
  scheduleId?: string | null;
}

/** A purchase or a "money back" refund (spending_entries). Refunds are positive (ADR-0014). */
export interface SpendingEntryInput {
  id?: string;
  amountCents: number;
  entryDate: CalendarDate;
  type: "purchase" | "refund";
  /** On a refund, optionally the purchase id it offsets (ADR-0014). */
  refundsEntryId?: string | null;
}

/** An active bill or subscription (bills table). */
export interface BillInput {
  id: string;
  amountCents: number;
  frequency: Frequency;
  anchorDate: CalendarDate;
  secondDay?: number;
}

/** A record that one bill occurrence was paid (bill_payments). `dueDate` names the occurrence. */
export interface BillPaymentInput {
  billId: string;
  dueDate: CalendarDate;
}

/** Everything the safe-to-spend calculation needs, as plain data (not DB rows). */
export interface SafeToSpendInput {
  openingBalanceCents: number;
  flexBufferCents: number;
  /** Money-in arrivals; only those dated on/before `asOfDate` count toward available-now. */
  deposits: DepositInput[];
  /** Purchases and refunds; only those dated on/before `asOfDate` count toward available-now. */
  spendingEntries: SpendingEntryInput[];
  /** All of the user's bills — must include every bill referenced by `billPayments`. */
  bills: BillInput[];
  billPayments: BillPaymentInput[];
  /** The one recurring money-in schedule, or null. Only this drives the payday window (ADR-0020). */
  depositSchedule: RecurringSchedule | null;
  /** The user's LOCAL calendar date ("today"), `YYYY-MM-DD`. Passed in, never read from the clock. */
  asOfDate: CalendarDate;
}

/** The result of the safe-to-spend calculation (ADR-0013). All amounts are whole cents. */
export interface SafeToSpendResult {
  /** opening balance + money in arrived − net spending. */
  availableNowCents: number;
  /** available now − unpaid bills due before next payday − flex buffer. May be negative (a shortfall). */
  safeToSpendCents: number;
  /** The next scheduled payday strictly after `asOfDate`, or null when there is no schedule. */
  nextPayday: CalendarDate | null;
  /** Total of every unpaid bill occurrence due before nextPayday, including overdue ones. */
  billsDueBeforePaydayCents: number;
  /** purchases + paid bills − money back (ADR-0013). */
  netSpendingCents: number;
  /** Total money in that has actually arrived (ADR-0020). */
  moneyInArrivedCents: number;
}
