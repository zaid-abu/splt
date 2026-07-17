import { View } from "react-native";
import { Typography } from "heroui-native";
import { MetricCell, useUI } from "@/components/ui";
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
  const { color, radius, space } = useUI();

  return (
    <View style={{ paddingHorizontal: space.page, marginBottom: 16 }}>
      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricCell
            label="Owed to you"
            value={formatAmount(totalOwedToMe, currencyCode)}
            tone={totalOwedToMe > 0 ? "success" : "neutral"}
          />
          <MetricCell
            label="You owe"
            value={formatAmount(totalIOwe, currencyCode)}
            tone={totalIOwe > 0 ? "danger" : "neutral"}
          />
        </View>
        <Typography
          style={{
            marginTop: 12,
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
      </View>
    </View>
  );
}
