import type { JSX } from "react";
import { View } from "react-native";
import { MetricCell } from "@/components/ui";

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
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <MetricCell label="Groups" value={String(groupCount)} />
      <MetricCell
        label="Owed"
        value={`+${currencySymbol}${owedToYou.toFixed(0)}`}
        tone={owedToYou > 0 ? "success" : "neutral"}
      />
      <MetricCell
        label="Owe"
        value={
          youOwe > 0
            ? `-${currencySymbol}${youOwe.toFixed(0)}`
            : `${currencySymbol}0`
        }
        tone={youOwe > 0 ? "danger" : "neutral"}
      />
    </View>
  );
}
