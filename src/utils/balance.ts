import { formatAmount } from "@/components/ui/AmountDisplay";
import { UI } from "@/components/ui/native-ui";

export function getBalanceCopy(balance: number, currencyCode: string) {
  if (balance > 0) {
    return {
      label: "Owes you",
      amount: formatAmount(balance, currencyCode),
      color: UI.color.success,
      bg: "#F5FCF8",
    };
  }

  if (balance < 0) {
    return {
      label: "You owe",
      amount: formatAmount(Math.abs(balance), currencyCode),
      color: UI.color.danger,
      bg: "#FFF7F5",
    };
  }

  return {
    label: "Settled",
    amount: "No balance",
    color: UI.color.muted,
    bg: UI.color.control,
  };
}
