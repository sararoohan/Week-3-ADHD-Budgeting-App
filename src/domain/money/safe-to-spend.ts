// Safe-to-spend calculation (ADR-0013, refined by ADR-0020), in whole cents (ADR-0009),
// computed every time and never stored (ADR-0010). Pure (ADR-0011).
//
//   available now  = opening balance + money in arrived − net spending
//   net spending   = purchases + paid bills − money back (refunds)
//   safe to spend  = available now − unpaid bills due before next payday − flex buffer
//
// The set-aside term is every UNPAID bill occurrence due *before* the next payday —
// including overdue ones (no "today" floor), so an unpaid obligation can never read as
// higher safe-to-spend than it really is. "Before" is strict (half-open), so a bill due
// exactly on payday is covered by that day's pay and belongs to the next period (ADR-0027).

import type { SafeToSpendInput, SafeToSpendResult } from "./types";
import { nextPayday, occurrencesInRange, compareCalendarDates } from "./calendar";

/** A valid entry amount is a whole number of cents above zero (ADR-0009, FR-34). */
export function isValidAmountCents(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents > 0;
}

function sumCents(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}

/** Compute available-now and safe-to-spend from stored data as of the user's local date. */
export function computeSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const {
    openingBalanceCents,
    flexBufferCents,
    deposits,
    spendingEntries,
    bills,
    billPayments,
    depositSchedule,
    asOfDate,
  } = input;

  // Only count money/spending dated on or before "today" — available-now is as of
  // asOfDate, and we plan only from money that has actually arrived (money-rules.md).
  const onOrBeforeAsOf = (date: string) => compareCalendarDates(date, asOfDate) <= 0;

  // Money in that has actually arrived (ADR-0020): an expected-but-unarrived scheduled
  // deposit is simply not in this array, so it is not counted.
  const moneyInArrivedCents = sumCents(
    deposits.filter((d) => onOrBeforeAsOf(d.depositDate)).map((d) => d.amountCents),
  );

  const arrivedSpending = spendingEntries.filter((e) => onOrBeforeAsOf(e.entryDate));
  const purchasesCents = sumCents(
    arrivedSpending.filter((e) => e.type === "purchase").map((e) => e.amountCents),
  );
  const refundsCents = sumCents(
    arrivedSpending.filter((e) => e.type === "refund").map((e) => e.amountCents),
  );

  // A paid bill occurrence counts as spending at its bill's amount (ADR-0013), so it is
  // subtracted here and excluded from the set-aside below — counted exactly once. Every
  // paid occurrence must resolve to a known bill (the data layer passes all of the user's
  // bills; the DB cascades payments on bill delete); an unresolved one is a data error we
  // surface rather than silently treat as zero (ADR-0022: fail loud, never a wrong number).
  const billAmountById = new Map(bills.map((b) => [b.id, b.amountCents]));
  const paidBillsCents = sumCents(
    billPayments.map((p) => {
      const amount = billAmountById.get(p.billId);
      if (amount === undefined) {
        throw new Error(`bill payment references unknown bill: ${p.billId}`);
      }
      return amount;
    }),
  );

  const netSpendingCents = purchasesCents + paidBillsCents - refundsCents;
  const availableNowCents = openingBalanceCents + moneyInArrivedCents - netSpendingCents;

  const payday = nextPayday(depositSchedule, asOfDate);

  // Only a scheduled payday defines the window; with none, nothing is set aside (ADR-0020).
  let billsDueBeforePaydayCents = 0;
  if (payday !== null) {
    const paidOccurrences = new Set(billPayments.map((p) => `${p.billId}|${p.dueDate}`));
    for (const bill of bills) {
      // From the bill's own anchor (its earliest occurrence) up to — not including — payday.
      const dueDates = occurrencesInRange(bill, bill.anchorDate, payday);
      for (const dueDate of dueDates) {
        if (!paidOccurrences.has(`${bill.id}|${dueDate}`)) {
          billsDueBeforePaydayCents += bill.amountCents;
        }
      }
    }
  }

  const safeToSpendCents = availableNowCents - billsDueBeforePaydayCents - flexBufferCents;

  return {
    availableNowCents,
    safeToSpendCents,
    nextPayday: payday,
    billsDueBeforePaydayCents,
    netSpendingCents,
    moneyInArrivedCents,
  };
}
