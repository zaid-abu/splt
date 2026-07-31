import {
  getCurrencyScale,
  getMaximumSupportedMinorAmount,
  normalizeCurrencyCode,
} from "./currency";

export function parseMinorInput(value: string, currency: string): number {
  const code = normalizeCurrencyCode(currency);
  const scale = getCurrencyScale(code);
  const input = value.trim();
  const match = input.match(/^(?:(-)?)([0-9]+)(?:\.([0-9]+))?$/);
  if (!match) throw new Error("Invalid format");

  const [, sign, integerPart, fractionPart = ""] = match;
  if (fractionPart.length > scale) throw new Error(`At most ${scale} decimal places`);

  const minorText = `${integerPart}${fractionPart.padEnd(scale, "0")}`;
  const magnitude = BigInt(minorText);
  if (magnitude > BigInt(getMaximumSupportedMinorAmount(code))) {
    throw new Error("Amount out of range");
  }
  const result = Number(magnitude);
  return result === 0 ? 0 : sign ? -result : result;
}

export function minorToMajor(amountMinor: number, currency: string): number {
  const scale = getCurrencyScale(currency);
  if (!Number.isSafeInteger(amountMinor)) throw new Error("Amount out of range");
  if (Math.abs(amountMinor) > getMaximumSupportedMinorAmount(currency)) {
    throw new Error("Amount out of range");
  }
  return amountMinor / 10 ** scale;
}
