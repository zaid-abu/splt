import type { JSX } from "react";
import { useUI } from "@/components/ui";
import { BalanceHero, StatPair } from "@/components/coral";

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
    <BalanceHero label="Balance" value={formattedNet}>
      <StatPair
        left={{ label: "Groups", value: String(groupCount) }}
        right={{
          label: "Net",
          value: `${netBalance >= 0 ? "+" : ""}${currencySymbol}${Math.abs(netBalance).toFixed(0)}`,
          tone: netBalance > 0 ? "positive" : netBalance < 0 ? "negative" : "neutral",
        }}
      />
    </BalanceHero>
  );
}
