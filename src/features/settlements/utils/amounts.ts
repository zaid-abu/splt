import { minorToMajor, parseMinorInput } from "@/features/money/splits";

export type SettlementAmountPreset = "full" | "half";

export const SETTLEMENT_AMOUNT_PRESETS: ReadonlyArray<{
  key: SettlementAmountPreset;
  label: string;
}> = [
  { key: "full", label: "Full" },
  { key: "half", label: "Half" },
];

export function settlementPresetMinor(
  openBalanceMinor: number,
  preset: SettlementAmountPreset
): number {
  const maximum = Math.abs(openBalanceMinor);
  return preset === "full" ? maximum : Math.floor(maximum / 2);
}

export function settlementPresetInput(
  openBalanceMinor: number,
  currency: string,
  preset: SettlementAmountPreset
): string {
  return minorToMajor(settlementPresetMinor(openBalanceMinor, preset), currency).toString();
}

export function isPositiveSettlementInput(amountInput: string, currency: string): boolean {
  try {
    return parseMinorInput(amountInput, currency) > 0;
  } catch {
    return false;
  }
}

export function isSettlementInputWithinBalance(
  amountInput: string,
  currency: string,
  openBalanceMinor: number
): boolean {
  try {
    const amountMinor = parseMinorInput(amountInput, currency);
    return amountMinor > 0 && amountMinor <= Math.abs(openBalanceMinor);
  } catch {
    return false;
  }
}
