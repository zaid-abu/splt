import type { MoneyContext, OpenBalance } from "./types";

export interface BalanceEvent {
  counterpartyId: string;
  context: MoneyContext;
  currency: string;
  signedAmountMinor: number;
  date: Date;
}

export type SettlementScope = "group" | "friendship" | "global";

export interface SettlementSelection {
  counterpartyId: string;
  context: MoneyContext;
  currency: string;
  amountMinor: number;
}

export function normalizeSignedMinor(value: number): number {
  return value === 0 ? 0 : value;
}

export function aggregateOpenBalances(
  events: readonly BalanceEvent[],
  currentUserId: string
): OpenBalance[] {
  const groups = new Map<string, { sum: number; lastDate: Date; firstEvent: BalanceEvent }>();

  for (const evt of events) {
    if (evt.counterpartyId === currentUserId) continue;

    const ctxKey = evt.context.type === "group" ? evt.context.groupId : evt.context.friendshipId;
    const key = `${evt.counterpartyId}::${ctxKey}::${evt.currency}`;

    const existing = groups.get(key);
    if (existing) {
      existing.sum += evt.signedAmountMinor;
      if (evt.date > existing.lastDate) {
        existing.lastDate = evt.date;
      }
    } else {
      groups.set(key, {
        sum: evt.signedAmountMinor,
        lastDate: evt.date,
        firstEvent: evt,
      });
    }
  }

  return Array.from(groups.values()).map((g) => ({
    counterpartyId: g.firstEvent.counterpartyId,
    context: g.firstEvent.context,
    currency: g.firstEvent.currency,
    signedAmountMinor: normalizeSignedMinor(g.sum),
    lastActivityAt: g.lastDate,
  }));
}

export function classifyPersonBalances(
  rows: readonly OpenBalance[]
): "mixed" | "owes-you" | "you-owe" | "settled" {
  if (rows.length === 0) return "settled";

  let hasPositive = false;
  let hasNegative = false;

  for (const row of rows) {
    const n = normalizeSignedMinor(row.signedAmountMinor);
    if (n > 0) hasPositive = true;
    if (n < 0) hasNegative = true;
  }

  if (hasPositive && hasNegative) return "mixed";
  if (hasPositive) return "owes-you";
  if (hasNegative) return "you-owe";
  return "settled";
}

export function orderBalances(
  rows: readonly OpenBalance[],
  preferredCurrency: string
): OpenBalance[] {
  return [...rows].sort((a, b) => {
    const aPref = a.currency === preferredCurrency ? 0 : 1;
    const bPref = b.currency === preferredCurrency ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;

    const currencyCmp = a.currency.localeCompare(b.currency);
    if (currencyCmp !== 0) return currencyCmp;

    const absDiff = Math.abs(b.signedAmountMinor) - Math.abs(a.signedAmountMinor);
    if (absDiff !== 0) return absDiff;

    return a.counterpartyId.localeCompare(b.counterpartyId);
  });
}

export function selectSettlementTarget(
  rows: readonly OpenBalance[],
  _scope: SettlementScope
): SettlementSelection | null {
  if (rows.length === 0) return null;

  const positive = rows.filter((r) => r.signedAmountMinor > 0);
  if (positive.length > 0) {
    const sorted = [...positive].sort((a, b) => b.signedAmountMinor - a.signedAmountMinor);
    return {
      counterpartyId: sorted[0].counterpartyId,
      context: sorted[0].context,
      currency: sorted[0].currency,
      amountMinor: sorted[0].signedAmountMinor,
    };
  }

  const negative = rows.filter((r) => r.signedAmountMinor < 0);
  if (negative.length > 0) {
    const sorted = [...negative].sort((a, b) => b.signedAmountMinor - a.signedAmountMinor);
    return {
      counterpartyId: sorted[0].counterpartyId,
      context: sorted[0].context,
      currency: sorted[0].currency,
      amountMinor: sorted[0].signedAmountMinor,
    };
  }

  return null;
}
