import { View } from "react-native";
import { Typography } from "heroui-native";
import { GlassHeroBalance, useUI } from "@/components/ui";
import { formatAmount } from "@/components/ui/AmountDisplay";

interface FriendsSummaryProps {
  totalOwedToMe: number;
  totalIOwe: number;
  filterCounts: { all: number; owes_you: number; you_owe: number; settled: number };
  currencyCode: string;
}

export function FriendsSummary({
  totalOwedToMe,
  totalIOwe,
  filterCounts,
  currencyCode,
}: FriendsSummaryProps): React.JSX.Element {
  const { color, space } = useUI();
  const netBalance = totalOwedToMe - totalIOwe;

  return (
    <View style={{ paddingHorizontal: space.page, marginBottom: 16 }}>
      <GlassHeroBalance
        label={netBalance > 0 ? "You are owed overall" : netBalance < 0 ? "You owe overall" : "Balanced"}
        amount={formatAmount(Math.abs(netBalance), currencyCode)}
        amountColor={
          netBalance > 0 ? color.success : netBalance < 0 ? color.danger : undefined
        }
        metrics={[
          {
            label: "Owed to you",
            value: formatAmount(totalOwedToMe, currencyCode),
            color: totalOwedToMe > 0 ? color.success : undefined,
          },
          {
            label: "You owe",
            value: formatAmount(totalIOwe, currencyCode),
            color: totalIOwe > 0 ? color.danger : undefined,
          },
        ]}
      >
        <Typography
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: color.borderSoft,
            fontSize: 13,
            lineHeight: 18,
            color: color.muted,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {filterCounts.all === 0
            ? "Add people you split with most often."
            : `${filterCounts.owes_you + filterCounts.you_owe} open balance${filterCounts.owes_you + filterCounts.you_owe === 1 ? "" : "s"} across ${filterCounts.all} friend${filterCounts.all === 1 ? "" : "s"}.`}
        </Typography>
      </GlassHeroBalance>
    </View>
  );
}
