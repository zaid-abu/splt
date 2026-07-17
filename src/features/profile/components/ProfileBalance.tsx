import type { JSX } from "react";
import { GlassHeroBalance, useUI } from "@/components/ui";

interface ProfileBalanceProps {
  groupCount: number;
  owedToYou: number;
  youOwe: number;
  currencySymbol: string;
}

export function ProfileBalance({
  groupCount,
  owedToYou,
  youOwe,
  currencySymbol,
}: ProfileBalanceProps): JSX.Element {
  const { color } = useUI();
  const netBalance = owedToYou - youOwe;
  const formattedNet = `${netBalance >= 0 ? "+" : "-"}${currencySymbol}${Math.abs(netBalance).toFixed(0)}`;

  return (
    <GlassHeroBalance
      label="Balance"
      amount={formattedNet}
      amountColor={netBalance >= 0 ? color.success : netBalance < 0 ? color.danger : color.text}
      metrics={[
        { label: "Groups", value: String(groupCount) },
        {
          label: "Owed",
          value: `+${currencySymbol}${owedToYou.toFixed(0)}`,
          color: owedToYou > 0 ? color.success : undefined,
        },
        {
          label: "Owe",
          value: youOwe > 0 ? `-${currencySymbol}${youOwe.toFixed(0)}` : `${currencySymbol}0`,
          color: youOwe > 0 ? color.danger : undefined,
        },
      ]}
    />
  );
}
