import { View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { GlassHeroBalance, useUI } from "@/components/ui";
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
  const { color, radius } = useUI();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      {isSettled ? (
        <GlassHeroBalance label="Status" amount="All settled up" amountColor={color.success} metrics={[]}>
          <View
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: color.borderSoft,
              alignItems: "center",
            }}
          >
            <Typography
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              No pending balances
            </Typography>
            <Typography
              numberOfLines={2}
              style={{
                marginTop: 4,
                fontSize: 14,
                lineHeight: 20,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
              }}
            >
              {lastActivityCopy}
            </Typography>
          </View>
        </GlassHeroBalance>
      ) : (
        <GlassHeroBalance
          label={isPositive ? `${friendName} owes you` : `You owe ${friendName}`}
          amount={formatAmount(Math.abs(netBalance), currencyCode)}
          amountColor={isPositive ? color.success : color.danger}
          metrics={[]}
        >
          <Typography
            numberOfLines={2}
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: color.borderSoft,
              fontSize: 14,
              lineHeight: 20,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
            }}
          >
            {isPositive
              ? "Send a reminder or add another shared expense."
              : "Settle this balance when you are ready."}{" "}
            {lastActivityCopy}
          </Typography>
        </GlassHeroBalance>
      )}
    </Animated.View>
  );
}
