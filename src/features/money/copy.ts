import { CURRENCIES } from "@/types";

import { normalizeSignedMinor } from "./balances";
import { minorToMajor } from "./splits";

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "IDR"]);

function formatMajorAmount(amount: number, currencyCode: string): string {
  const symbol = CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? currencyCode;
  const abs = Math.abs(amount);
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currencyCode);
  return `${symbol}${abs.toLocaleString("en-US", {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  })}`;
}

export interface BalanceCopyInput {
  signedAmountMinor: number;
  currency: string;
  name: string;
}

export interface ExpenseConsequenceInput {
  amountMinor: number;
  currency: string;
  title: string;
  yourShareMinor: number;
  payerName: string;
  isPayer: boolean;
}

export interface SettlementConsequenceInput {
  amountMinor: number;
  currency: string;
  counterpartyName: string;
  direction: "paid" | "received";
}

function minorFormatted(amountMinor: number, currency: string): string {
  const major = minorToMajor(Math.abs(amountMinor), currency);
  return formatMajorAmount(major, currency);
}

export function describeBalance(input: BalanceCopyInput): string {
  const { signedAmountMinor, currency, name } = input;
  const normalized = normalizeSignedMinor(signedAmountMinor);

  if (normalized === 0) {
    return `You and ${name} are settled`;
  }

  const formatted = minorFormatted(normalized, currency);

  if (normalized < 0) {
    return `You owe ${name} ${formatted}`;
  }

  return `${name} owes you ${formatted}`;
}

export function describeExpenseConsequence(input: ExpenseConsequenceInput): string {
  const { amountMinor, currency, title, payerName, isPayer } = input;

  if (isPayer) {
    const formatted = minorFormatted(amountMinor, currency);
    return `You paid ${formatted} for ${title}`;
  }

  const formatted = minorFormatted(input.yourShareMinor, currency);
  return `Your share of ${title} is ${formatted}`;
}

export function describeSettlementResult(input: SettlementConsequenceInput): string {
  const { amountMinor, currency, counterpartyName, direction } = input;
  const formatted = minorFormatted(amountMinor, currency);

  if (direction === "paid") {
    return `You paid ${formatted} to ${counterpartyName}`;
  }

  return `${counterpartyName} paid you ${formatted}`;
}
