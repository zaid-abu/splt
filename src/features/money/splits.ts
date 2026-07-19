import type { ExpenseSplitInput, MoneySplitMethod, SplitSource } from "./types";

const currencyMinorScale: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  INR: 2,
  CAD: 2,
  AUD: 2,
  CHF: 2,
  CNY: 2,
  MXN: 2,
  BRL: 2,
  AED: 2,
  SAR: 2,
  SGD: 2,
  HKD: 2,
  KRW: 0,
  SEK: 2,
  NOK: 2,
  NZD: 2,
};

function getScale(currency: string): number {
  return currencyMinorScale[currency] ?? 2;
}

export function parseMinorInput(value: string, currency: string): number {
  const scale = getScale(currency);

  const isNegative = value.startsWith("-");
  const absValue = isNegative ? value.slice(1) : value;

  const parts = absValue.split(".");
  if (parts.length > 2) {
    throw new Error("Invalid format");
  }

  if (parts.length === 2 && parts[1].length > scale) {
    throw new Error(`At most ${scale} decimal places`);
  }

  const intPart = parts[0];
  const fracPart = parts.length === 2 ? parts[1].padEnd(scale, "0") : "".padEnd(scale, "0");
  const combinedStr = intPart + fracPart;
  const result = Number(combinedStr);

  if (!Number.isSafeInteger(result)) {
    throw new Error("Amount out of range");
  }

  return isNegative ? -result : result;
}

export function minorToMajor(amountMinor: number, currency: string): number {
  const scale = getScale(currency);
  return amountMinor / Math.pow(10, scale);
}

export function validateSplitSources(
  totalMinor: number,
  method: MoneySplitMethod,
  participants: readonly SplitSource[]
): void {
  if (participants.length === 0) {
    throw new Error("At least one participant is required");
  }

  switch (method) {
    case "equal":
      break;

    case "custom": {
      const total = participants.reduce((sum, p) => sum + (p.amountMinor ?? 0), 0);
      if (total !== totalMinor) {
        throw new Error(`Amounts must total ${totalMinor}`);
      }
      break;
    }

    case "percentage": {
      const total = participants.reduce((sum, p) => sum + (p.percentageUnits ?? 0), 0);
      if (total !== 1_000_000) {
        throw new Error("Percentages must total 1,000,000");
      }
      for (const p of participants) {
        if ((p.percentageUnits ?? 0) <= 0) {
          throw new Error("Percentage must be positive");
        }
      }
      break;
    }

    case "shares": {
      for (const p of participants) {
        if ((p.shareUnits ?? 0) <= 0) {
          throw new Error("Share must be positive");
        }
      }
      break;
    }
  }
}

export function calculateSplits(
  totalMinor: number,
  method: MoneySplitMethod,
  participants: readonly SplitSource[]
): ExpenseSplitInput[] {
  const n = participants.length;
  if (n === 0) return [];

  const amounts = new Array<number>(n);

  switch (method) {
    case "equal": {
      const base = Math.floor(totalMinor / n);
      for (let i = 0; i < n; i++) {
        amounts[i] = base;
      }
      break;
    }

    case "percentage": {
      for (let i = 0; i < n; i++) {
        amounts[i] = Math.floor((totalMinor * (participants[i].percentageUnits ?? 0)) / 1_000_000);
      }
      break;
    }

    case "shares": {
      const totalShares = participants.reduce((sum, p) => sum + (p.shareUnits ?? 0), 0);
      for (let i = 0; i < n; i++) {
        amounts[i] = Math.floor((totalMinor * (participants[i].shareUnits ?? 0)) / totalShares);
      }
      break;
    }

    case "custom": {
      for (let i = 0; i < n; i++) {
        amounts[i] = participants[i].amountMinor ?? 0;
      }
      break;
    }
  }

  const totalAllocated = amounts.reduce((s, v) => s + v, 0);
  const remainder = totalMinor - totalAllocated;

  const sorted = participants
    .map((p, i) => ({ index: i, position: p.position, userId: p.userId }))
    .sort((a, b) => a.position - b.position || a.userId.localeCompare(b.userId));

  for (let i = 0; i < remainder; i++) {
    amounts[sorted[i].index]++;
  }

  return participants.map((p, i) => ({
    userId: p.userId,
    amountMinor: amounts[i],
    position: p.position,
  }));
}
