import { formatAmount } from "@/components/ui/AmountDisplay";
import { LIGHT_COLORS } from "@/components/ui/native-ui";

export function getBalanceCopy(balance: number, currencyCode: string) {
  if (balance > 0) {
    return {
      label: "Owes you",
      amount: formatAmount(balance, currencyCode),
      color: LIGHT_COLORS.success,
      bg: LIGHT_COLORS.successTint,
    };
  }

  if (balance < 0) {
    return {
      label: "You owe",
      amount: formatAmount(Math.abs(balance), currencyCode),
      color: LIGHT_COLORS.danger,
      bg: LIGHT_COLORS.dangerTint,
    };
  }

  return {
    label: "Settled",
    amount: "No balance",
    color: LIGHT_COLORS.muted,
    bg: LIGHT_COLORS.control,
  };
}
