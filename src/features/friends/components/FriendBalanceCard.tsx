import { View, Text } from "react-native";
import * as icons from "lucide-react-native";
import { BalanceHero, useCoralColors } from "@/components/coral";
import { formatAmount } from "@/components/ui/AmountDisplay";
import Animated, { FadeInDown } from "react-native-reanimated";

interface FriendBalanceCardProps {
  friendName: string;
  netBalance: number;
  isPositive: boolean;
  isSettled: boolean;
  lastActivityCopy: string;
  currencyCode: string;
}

export function FriendBalanceCard({
  friendName,
  netBalance,
  isPositive,
  isSettled,
  lastActivityCopy,
  currencyCode,
}: FriendBalanceCardProps): React.JSX.Element {
  const coral = useCoralColors();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      {isSettled ? (
        <BalanceHero label="Status" value="All settled up">
          <View
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: coral.border,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: coral.muted,
                fontFamily: "InstrumentSans_500Medium",
              }}
            >
              No pending balances
            </Text>
            <Text
              numberOfLines={2}
              style={{
                marginTop: 4,
                fontSize: 14,
                lineHeight: 20,
                color: coral.muted,
                fontFamily: "InstrumentSans_500Medium",
                textAlign: "center",
              }}
            >
              {lastActivityCopy}
            </Text>
          </View>
        </BalanceHero>
      ) : (
        <BalanceHero
          label={isPositive ? `${friendName} owes you` : `You owe ${friendName}`}
          value={formatAmount(Math.abs(netBalance), currencyCode)}
        >
          <Text
            numberOfLines={2}
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: coral.border,
              fontSize: 14,
              lineHeight: 20,
              color: coral.muted,
              fontFamily: "InstrumentSans_500Medium",
              textAlign: "center",
            }}
          >
            {isPositive
              ? "Send a reminder or add another shared expense."
              : "Settle this balance when you are ready."}{" "}
            {lastActivityCopy}
          </Text>
        </BalanceHero>
      )}
    </Animated.View>
  );
}
