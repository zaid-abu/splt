import type { ExpenseSplitInput, MoneySplitMethod, SplitSource } from "./types";
import { getScale } from "./currency";
import { minorToMajor, parseMinorInput } from "./amount";

export { getScale, minorToMajor, parseMinorInput };

const MAX_MINOR = 999_999_999_999;

export function validateSplitSources(
  totalMinor: number,
  method: MoneySplitMethod,
  participants: readonly SplitSource[]
): void {
  if (!Number.isSafeInteger(totalMinor) || totalMinor < 0 || totalMinor > MAX_MINOR) {
    throw new Error("Total amount out of range");
  }
  if (participants.length === 0) {
    throw new Error("At least one participant is required");
  }

  const ids = new Set<string>();
  const positions = new Set<number>();
  for (const participant of participants) {
    if (!participant.userId || ids.has(participant.userId))
      throw new Error("User IDs must be unique");
    ids.add(participant.userId);
    if (!Number.isSafeInteger(participant.position) || participant.position < 0) {
      throw new Error("Positions must be contiguous integers starting at zero");
    }
    positions.add(participant.position);
  }
  if (
    positions.size !== participants.length ||
    [...positions].sort((a, b) => a - b).some((p, i) => p !== i)
  ) {
    throw new Error("Positions must be contiguous integers starting at zero");
  }

  switch (method) {
    case "equal":
      break;

    case "custom": {
      const amounts = participants.map((p) => p.amountMinor);
      if (
        amounts.some(
          (amount) => !Number.isSafeInteger(amount) || amount! < 0 || amount! > MAX_MINOR
        )
      ) {
        throw new Error("Custom amounts must be bounded nonnegative integers");
      }
      const total = amounts.reduce((sum, amount) => sum + BigInt(amount!), 0n);
      if (total !== BigInt(totalMinor)) {
        throw new Error(`Amounts must total ${totalMinor}`);
      }
      break;
    }

    case "percentage": {
      const units = participants.map((p) => p.percentageUnits);
      if (units.some((unit) => !Number.isSafeInteger(unit) || unit! <= 0 || unit! > 1_000_000)) {
        throw new Error("Percentage must be positive");
      }
      const total = units.reduce<number>((sum, unit) => sum + (unit ?? 0), 0);
      if (total !== 1_000_000) {
        throw new Error("Percentages must total 1,000,000");
      }
      break;
    }

    case "shares": {
      let total = 0n;
      for (const p of participants) {
        if (!Number.isSafeInteger(p.shareUnits) || p.shareUnits! <= 0) {
          throw new Error("Share must be positive");
        }
        total += BigInt(p.shareUnits!);
      }
      if (total > BigInt(MAX_MINOR)) {
        throw new Error("Share total out of range");
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
  validateSplitSources(totalMinor, method, participants);
  const n = participants.length;

  const amounts = new Array<number>(n);

  switch (method) {
    case "equal": {
      const base = BigInt(totalMinor) / BigInt(n);
      for (let i = 0; i < n; i++) {
        amounts[i] = Number(base);
      }
      break;
    }

    case "percentage": {
      for (let i = 0; i < n; i++) {
        amounts[i] = Number(
          (BigInt(totalMinor) * BigInt(participants[i].percentageUnits!)) / 1_000_000n
        );
      }
      break;
    }

    case "shares": {
      const totalShares = participants.reduce((sum, p) => sum + BigInt(p.shareUnits!), 0n);
      for (let i = 0; i < n; i++) {
        amounts[i] = Number(
          (BigInt(totalMinor) * BigInt(participants[i].shareUnits!)) / totalShares
        );
      }
      break;
    }

    case "custom": {
      for (let i = 0; i < n; i++) {
        amounts[i] = participants[i].amountMinor!;
      }
      break;
    }
  }

  const totalAllocated = amounts.reduce((s, v) => s + BigInt(v), 0n);
  const remainder = BigInt(totalMinor) - totalAllocated;

  const sorted = participants
    .map((p, i) => ({ index: i, position: p.position, userId: p.userId }))
    .sort((a, b) => a.position - b.position || a.userId.localeCompare(b.userId));

  for (let i = 0n; i < remainder; i++) {
    amounts[sorted[Number(i) % n].index]++;
  }

  return participants.map((p, i) => ({
    userId: p.userId,
    amountMinor: amounts[i],
    position: p.position,
  }));
}
