import { View, Text } from "react-native";
import { useUI } from "@/components/ui";
import { BalanceHero, StatPair } from "@/components/coral";
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
      <BalanceHero
        label={
          netBalance > 0 ? "You are owed overall" : netBalance < 0 ? "You owe overall" : "Balanced"
        }
        value={formatAmount(Math.abs(netBalance), currencyCode)}
      >
        <StatPair
          left={{
            label: "Owed to you",
            value: formatAmount(totalOwedToMe, currencyCode),
            tone: totalOwedToMe > 0 ? "positive" : "neutral",
          }}
          right={{
            label: "You owe",
            value: formatAmount(totalIOwe, currencyCode),
            tone: totalIOwe > 0 ? "negative" : "neutral",
          }}
        />
        <Text
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: color.borderSoft,
            fontSize: 13,
            lineHeight: 18,
            color: color.muted,
            fontFamily: "InstrumentSans_500Medium",
          }}
        >
          {filterCounts.all === 0
            ? "Add people you split with most often."
            : `${filterCounts.owes_you + filterCounts.you_owe} open balance${filterCounts.owes_you + filterCounts.you_owe === 1 ? "" : "s"} across ${filterCounts.all} friend${filterCounts.all === 1 ? "" : "s"}.`}
        </Text>
      </BalanceHero>
    </View>
  );
}
