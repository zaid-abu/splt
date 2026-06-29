/**
 * AmountDisplay — HeroUI Typography compound component.
 *
 * Formats currency amounts with compact notation for high-value currencies.
 *
 * @see https://heroui.com/docs/native/components/text.mdx
 */
import { Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import type { Currency } from "@/types";
import { CURRENCIES } from "@/types";

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c: Currency) => c.code === code)?.symbol ?? code;
}

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "IDR"]);

export function formatAmount(amount: number, currencyCode: string): string {
  const abs = Math.abs(amount);
  const symbol = getCurrencySymbol(currencyCode);
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currencyCode);
  if (abs >= 1_000_000) return `${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000 && isZeroDecimal) return `${symbol}${(abs / 1_000).toFixed(0)}K`;
  return `${symbol}${abs.toLocaleString("en-US", {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  })}`;
}

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  /** sm = body-xs, md = body-sm, lg = body, xl = h4 */
  size?: "sm" | "md" | "lg" | "xl";
  colored?: boolean;
  showSign?: boolean;
}

/**
 * Formatted currency amount with optional color coding.
 * Positive amounts = success color, negative = danger color.
 */
export function AmountDisplay({
  amount,
  currency = "USD",
  size = "md",
  colored = true,
  showSign = false,
}: AmountDisplayProps): JSX.Element {
  const isNeg = amount < 0;
  const isZero = amount === 0;

  const colorClass = colored && !isZero
    ? isNeg ? "text-danger" : "text-success"
    : "text-foreground";

  // Map size to Typography type
  const typeMap = { sm: "body-xs", md: "body-sm", lg: "body", xl: "h4" } as const;
  const type = typeMap[size];

  const prefix = showSign && !isZero ? (isNeg ? "-" : "+") : isNeg ? "-" : "";
  const formatted = formatAmount(amount, currency);

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
      <Typography type={type} className={`font-semibold ${colorClass}`}>
        {prefix}{formatted}
      </Typography>
      <Typography type="body-xs" className="text-muted">
        {currency}
      </Typography>
    </View>
  );
}
