import { memo } from "react";
import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { MetricCell, UI } from "@/components/ui/native-ui";
import { formatAmount } from "@/components/ui/AmountDisplay";

interface FriendsBalanceHeaderProps {
  totalOwedToMe: number;
  totalIOwe: number;
  preferredCurrencyCode: string;
  filterCounts: { all: number; owes_you: number; you_owe: number; settled: number };
}

export const FriendsBalanceHeader = memo(function FriendsBalanceHeader({
  totalOwedToMe,
  totalIOwe,
  preferredCurrencyCode,
  filterCounts,
}: FriendsBalanceHeaderProps): JSX.Element {
  return (
    <View style={{ paddingHorizontal: UI.space.page, marginBottom: 16 }}>
      <View
        style={{
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricCell
            label="Owed to you"
            value={formatAmount(totalOwedToMe, preferredCurrencyCode)}
            tone={totalOwedToMe > 0 ? "success" : "neutral"}
          />
          <MetricCell
            label="You owe"
            value={formatAmount(totalIOwe, preferredCurrencyCode)}
            tone={totalIOwe > 0 ? "danger" : "neutral"}
          />
        </View>
        <Typography
          style={{
            marginTop: 12,
            fontSize: 13,
            lineHeight: 18,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {filterCounts.all === 0
            ? "Add people you split with most often."
            : `${filterCounts.owes_you + filterCounts.you_owe} open balance${filterCounts.owes_you + filterCounts.you_owe === 1 ? "" : "s"} across ${filterCounts.all} friend${filterCounts.all === 1 ? "" : "s"}.`}
        </Typography>
      </View>
    </View>
  );
});
