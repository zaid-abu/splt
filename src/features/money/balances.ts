import type { MoneyContext, OpenBalance } from "./types";

export interface BalanceEvent {
  counterpartyId: string;
  context: MoneyContext;
  currency: string;
  signedAmountMinor: number;
  date: Date;
}

export type SettlementScope =
  | { type: "group"; groupId: string }
  | { type: "friendship"; friendshipId: string }
  | { type: "global" };

export type SettlementDirection = "owes_me" | "i_owe";

export interface SettlementSelection {
  counterpartyId: string;
  context: MoneyContext;
  currency: string;
  amountMinor: number;
  direction: SettlementDirection;
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
  scope: SettlementScope
): SettlementSelection | null {
  const eligible = rows.filter((row) => {
    if (row.signedAmountMinor === 0) return false;
    if (scope.type === "global") return true;
    return scope.type === "group"
      ? row.context.type === "group" && row.context.groupId === scope.groupId
      : row.context.type === "direct" && row.context.friendshipId === scope.friendshipId;
  });
  if (eligible.length === 0) return null;

  const selected = [...eligible].sort((a, b) => {
    const magnitude = Math.abs(b.signedAmountMinor) - Math.abs(a.signedAmountMinor);
    if (magnitude !== 0) return magnitude;
    const counterparty = a.counterpartyId.localeCompare(b.counterpartyId);
    if (counterparty !== 0) return counterparty;
    const contextA =
      a.context.type === "group"
        ? `group:${a.context.groupId}`
        : `direct:${a.context.friendshipId}`;
    const contextB =
      b.context.type === "group"
        ? `group:${b.context.groupId}`
        : `direct:${b.context.friendshipId}`;
    const context = contextA.localeCompare(contextB);
    return context !== 0 ? context : a.currency.localeCompare(b.currency);
  })[0];

  return {
    counterpartyId: selected.counterpartyId,
    context: selected.context,
    currency: selected.currency,
    amountMinor: Math.abs(selected.signedAmountMinor),
    direction: selected.signedAmountMinor > 0 ? "owes_me" : "i_owe",
  };
}
