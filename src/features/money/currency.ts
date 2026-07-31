export const CURRENCY_SCALES = {
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
} as const;

export type CurrencyCode = keyof typeof CURRENCY_SCALES;

export function normalizeCurrencyCode(currency: string): CurrencyCode {
  if (typeof currency !== "string") throw new Error("Unknown currency");
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized) || !(normalized in CURRENCY_SCALES)) {
    throw new Error("Unknown currency");
  }
  return normalized as CurrencyCode;
}

export function assertCurrencyCode(currency: string): asserts currency is CurrencyCode {
  normalizeCurrencyCode(currency);
}

export function getCurrencyScale(currency: string): number {
  return CURRENCY_SCALES[normalizeCurrencyCode(currency)];
}

export function getMaximumSupportedMinorAmount(currency: string): number {
  const scale = getCurrencyScale(currency);
  return 10_000_000_000 * 10 ** scale - 1;
}

export const getScale = getCurrencyScale;
export const getMaximumMinorAmount = getMaximumSupportedMinorAmount;
